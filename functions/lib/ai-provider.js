import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

// Capa de abstracción para que un asistente de function-calling (ask-admin.js, ask-taller.js,
// y los que se sumen) pueda correr sobre Gemini o sobre Claude cambiando UNA variable de
// entorno (AI_PROVIDER=gemini|claude), sin duplicar el loop de tool-calling por proveedor.
//
// Decisión clave que simplifica todo esto: los `geminiParameters` que ya se escriben a mano
// para cada tool (en navespace-tools.js, taller-tools.js, etc.) SON JSON Schema válido tal
// cual — se confirmó inspeccionando el paquete @google/generative-ai instalado: SchemaType
// resuelve a strings en minúscula ("string", "object", "integer", ...), no a los enums en
// mayúscula que tiene la documentación vieja de Gemini. Eso significa que el mismo objeto
// sirve como `parameters` de Gemini y como `input_schema` de Claude sin conversión — un solo
// schema por tool, no tres.
//
// El `history` que reciben las funciones de acá es siempre neutral: [{role: "user"|
// "assistant", text}] (ver chat-utils.js). El tool-calling en sí (pedir una tool, mandarle el
// resultado) pasa solo DENTRO del turno actual — no se persiste como tool_use/functionCall en
// el historial entre preguntas, solo la respuesta final en texto. Por eso ambos proveedores
// pueden compartir la misma forma de historial sin perder nada.

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
// Haiku 4.5 es el modelo de Anthropic en el mismo escalón de precio/velocidad que Gemini
// Flash — el que tiene sentido para un asistente de function-calling de este tamaño.
const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5-20251001";

/**
 * Qué proveedor usar. AI_PROVIDER se lee una vez por invocación de la Cloud Function (no hay
 * caché entre requests en Cloud Functions Gen 2 salvo que la instancia se reuse, y aunque se
 * reuse esto es tan barato que da igual releerlo siempre).
 */
export function resolveProvider() {
  const raw = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
  if (raw !== "gemini" && raw !== "claude") {
    throw Object.assign(
      new Error(`AI_PROVIDER inválido: "${raw}". Los valores válidos son "gemini" o "claude".`),
      { isConfigError: true }
    );
  }
  return raw;
}

async function runToolCall(tools, name, args) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return { error: `Herramienta desconocida: ${name}` };
  try {
    return { result: await tool.handler(args || {}) };
  } catch (err) {
    return { error: err.message };
  }
}

async function runGemini({ apiKey, model, systemPrompt, tools, history, question, maxRounds, temperature, maxOutputTokens }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const toolsForGemini = [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.geminiParameters,
      })),
    },
  ];
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    tools: toolsForGemini,
  });

  // No usamos ChatSession/sendMessage() a propósito: el helper del SDK arma el turno de
  // respuesta de una function-call con `role: "function"`, rol que la API detrás de Gemini
  // ya no acepta (bug real encontrado y corregido en la Fase 10.1 — ver fase10-estado.md).
  // Armamos `contents` a mano y llamamos a generateContent() directo.
  const contents = [
    ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] })),
    { role: "user", parts: [{ text: question }] },
  ];

  let response;
  let rounds = 0;
  while (true) {
    const result = await generativeModel.generateContent({
      contents,
      generationConfig: { maxOutputTokens, temperature },
    });
    response = result.response;

    const calls = response.functionCalls();
    if (!calls || calls.length === 0 || rounds >= maxRounds) break;

    contents.push(response.candidates[0].content);

    const responseParts = [];
    for (const call of calls) {
      const data = await runToolCall(tools, call.name, call.args);
      responseParts.push({ functionResponse: { name: call.name, response: data } });
    }
    contents.push({ role: "user", parts: responseParts });
    rounds++;
  }

  const text = (response.text() || "").trim();
  return { answer: text || "No pude obtener esa información ahora mismo." };
}

async function runClaude({ apiKey, model, systemPrompt, tools, history, question, maxRounds, temperature, maxOutputTokens }) {
  const anthropic = new Anthropic({ apiKey });
  const claudeTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.geminiParameters,
  }));

  // Los roles neutrales ("user"/"assistant") ya coinciden con los de la Messages API de
  // Claude — a diferencia de Gemini, acá no hace falta mapear nada.
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.text })),
    { role: "user", content: question },
  ];

  let response;
  let rounds = 0;
  while (true) {
    response = await anthropic.messages.create({
      model,
      system: systemPrompt,
      max_tokens: maxOutputTokens,
      temperature,
      tools: claudeTools,
      messages,
    });

    if (response.stop_reason !== "tool_use" || rounds >= maxRounds) break;

    // El turno del modelo se reenvía tal cual vino (puede traer texto + uno o más bloques
    // tool_use) para que el modelo tenga su propio pedido en el historial de la vuelta
    // siguiente — mismo patrón que el `response.candidates[0].content` de Gemini.
    messages.push({ role: "assistant", content: response.content });

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const data = await runToolCall(tools, block.name, block.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(data),
      });
    }
    messages.push({ role: "user", content: toolResults });
    rounds++;
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { answer: text || "No pude obtener esa información ahora mismo." };
}

/**
 * Clasifica un error del SDK del proveedor como "cuota agotada" (429) de forma normalizada,
 * para que el caller (ask-admin.js, ask-taller.js) responda con el mismo mensaje amigable sin
 * importar qué proveedor estaba activo.
 */
function classifyProviderError(err) {
  return (
    err?.status === 429 ||
    /\b429\b/.test(err?.message || "") ||
    /quota|resource_exhausted|too many requests|rate.?limit|overloaded/i.test(err?.message || "")
  );
}

/**
 * Punto de entrada único para ambos asistentes. Devuelve { answer, provider, mock? } o tira
 * un Error con `.isQuotaError` (bool) y `.provider` seteados, para que el caller decida el
 * status HTTP sin tener que conocer los detalles de cada SDK.
 */
export async function runAssistant({
  systemPrompt,
  tools,
  history,
  question,
  maxRounds = 4,
  temperature = 0.2,
  maxOutputTokens = 800,
}) {
  const provider = resolveProvider();

  if (provider === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        mock: true,
        provider,
        answer:
          "[mock sin ANTHROPIC_API_KEY, AI_PROVIDER=claude] Configura ANTHROPIC_API_KEY en " +
          "esta Function para respuesta real. Pregunta recibida: " +
          question.slice(0, 120),
      };
    }
    const model = process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;
    try {
      const result = await runClaude({ apiKey, model, systemPrompt, tools, history, question, maxRounds, temperature, maxOutputTokens });
      return { ...result, provider };
    } catch (err) {
      err.isQuotaError = classifyProviderError(err);
      err.provider = provider;
      throw err;
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      mock: true,
      provider,
      answer:
        "[mock sin GEMINI_API_KEY] Configura GEMINI_API_KEY en esta Function para " +
        "respuesta real con datos en vivo. Pregunta recibida: " +
        question.slice(0, 120),
    };
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  try {
    const result = await runGemini({ apiKey, model, systemPrompt, tools, history, question, maxRounds, temperature, maxOutputTokens });
    return { ...result, provider };
  } catch (err) {
    err.isQuotaError = classifyProviderError(err);
    err.provider = provider;
    throw err;
  }
}
