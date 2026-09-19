import { z } from "zod";
import { SchemaType } from "@google/generative-ai";
import { callTaller, findTool as findNavespaceTool } from "./navespace-tools.js";

// Catálogo de tools para el asistente del TALLER (staff del taller de reparación, no el dueño
// de la flota — ese es navespace-tools.js). Construido leyendo directo el código real de
// spacecraft-taller-frontend (repairApi.js, BudgetForm.jsx, PartsStockPanel.jsx, RepairCard.jsx,
// constants/repairStatus.js) para que cada payload matchee exactamente lo que ya manda esa UI.
//
// Reusa (no duplica) las tools de lectura de navespace-tools.js que le sirven igual al staff
// del taller, porque son el MISMO backend/endpoint — evita una segunda definición que se
// pueda desalinear con la primera.
const REUSED_TOOL_NAMES = [
  "list_spacecrafts", // para ubicar el spacecraftId de una nave por nombre
  "get_damage_catalog",
  "get_repairs_for_spacecraft",
  "get_active_repair",
  "get_repair_detail",
  "get_budgets",
];
const reusedTools = REUSED_TOOL_NAMES.map((name) => {
  const tool = findNavespaceTool(name);
  if (!tool) {
    throw new Error(`taller-tools.js: no se encontró la tool reusada "${name}" en navespace-tools.js`);
  }
  return tool;
});

// Único manual "avance" disponible (mismo mapeo que NEXT_MANUAL_STATUS en
// src/constants/repairStatus.js del frontend de taller) — ESPERANDO_APROBACION_PRESUPUESTO y
// ENTREGADA no son transiciones manuales de este endpoint (la primera la dispara crear un
// presupuesto, la segunda el flujo del dueño de la flota vía receive_ship_from_taller).
const MANUAL_ADVANCE_TARGETS = ["EN_REVISION", "EN_TRABAJO", "LISTA_PARA_SALIR"];
const REPAIR_STATUSES = [
  "ENVIADA",
  "RECIBIDA",
  "EN_REVISION",
  "EN_TRABAJO",
  "ESPERANDO_APROBACION_PRESUPUESTO",
  "LISTA_PARA_SALIR",
  "ENTREGADA",
];

const newTallerTools = [
  {
    name: "get_shop_repairs",
    title: "Reparaciones del taller",
    description:
      "Lista las reparaciones que ve el taller, opcionalmente filtradas por estado. Sin " +
      "status trae todas (activas e históricas).",
    zodShape: {
      status: z.enum(REPAIR_STATUSES).optional().describe("Filtrar por estado (opcional)"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING, format: "enum", enum: REPAIR_STATUSES, description: "Filtrar por estado (opcional)" },
      },
      required: [],
    },
    async handler({ status } = {}) {
      return callTaller("/repairs", { searchParams: { status } });
    },
  },
  {
    name: "confirm_repair_receipt",
    title: "Confirmar recepción de una nave",
    description:
      "El taller confirma que recibió físicamente una nave recién enviada (pasa de ENVIADA a " +
      "RECIBIDA). Sin advertencia asociada — se puede ejecutar directo.",
    zodShape: {
      repairId: z.coerce.number().int().positive().describe("ID de la reparación"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: { repairId: { type: SchemaType.INTEGER, description: "ID de la reparación" } },
      required: ["repairId"],
    },
    async handler({ repairId }) {
      return callTaller(`/repairs/${repairId}/confirm-receipt`, { method: "POST" });
    },
  },
  {
    name: "advance_repair_status",
    title: "Avanzar el estado de una reparación",
    description:
      "Avanza manualmente el estado de una reparación: RECIBIDA→EN_REVISION, " +
      "EN_REVISION→EN_TRABAJO, o EN_TRABAJO→LISTA_PARA_SALIR (el backend valida que sea el " +
      "único avance permitido desde el estado actual — si no estás seguro del estado actual, " +
      "consultá get_repair_detail primero). Sin advertencia asociada — se puede ejecutar " +
      "directo.",
    zodShape: {
      repairId: z.coerce.number().int().positive().describe("ID de la reparación"),
      status: z.enum(MANUAL_ADVANCE_TARGETS).describe("Estado destino"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: {
        repairId: { type: SchemaType.INTEGER, description: "ID de la reparación" },
        status: { type: SchemaType.STRING, format: "enum", enum: MANUAL_ADVANCE_TARGETS, description: "Estado destino" },
      },
      required: ["repairId", "status"],
    },
    async handler({ repairId, status }) {
      return callTaller(`/repairs/${repairId}/status`, { method: "PATCH", body: { status } });
    },
  },
  {
    name: "list_spare_parts",
    title: "Stock de repuestos",
    description:
      "Lista los repuestos del taller (nombre, precio, stock informativo, activo/inactivo). " +
      "Consultar esto antes de armar un presupuesto (create_budget) para conocer los " +
      "sparePartId y precios válidos.",
    zodShape: {
      activeOnly: z.boolean().optional().describe("true = solo repuestos activos (default). false = incluye desactivados."),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: {
        activeOnly: { type: SchemaType.BOOLEAN, description: "true = solo repuestos activos (default). false = incluye desactivados." },
      },
      required: [],
    },
    async handler({ activeOnly = true } = {}) {
      return callTaller("/parts", { searchParams: { active: activeOnly } });
    },
  },
  {
    name: "create_spare_part",
    title: "Agregar un repuesto al stock",
    description:
      "Da de alta un repuesto nuevo en el stock del taller. Sin advertencia asociada — se " +
      "puede ejecutar directo.",
    zodShape: {
      name: z.string().min(1).describe("Nombre del repuesto"),
      price: z.coerce.number().nonnegative().describe("Precio unitario en euros"),
      stockQuantity: z.coerce.number().int().nonnegative().optional().describe("Cantidad en stock (informativo, opcional)"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Nombre del repuesto" },
        price: { type: SchemaType.NUMBER, description: "Precio unitario en euros" },
        stockQuantity: { type: SchemaType.NUMBER, description: "Cantidad en stock (informativo, opcional)" },
      },
      required: ["name", "price"],
    },
    async handler({ name, price, stockQuantity }) {
      return callTaller("/parts", {
        method: "POST",
        body: { name, price, stockQuantity: stockQuantity ?? null },
      });
    },
  },
  {
    name: "update_spare_part",
    title: "Editar un repuesto",
    description:
      "Edita campos puntuales de un repuesto existente (nombre, precio, stock, o " +
      "reactivarlo poniendo active en true). Mandá solo los campos que querés cambiar. Sin " +
      "advertencia asociada — se puede ejecutar directo.",
    zodShape: {
      partId: z.coerce.number().int().positive().describe("ID del repuesto"),
      name: z.string().min(1).optional().describe("Nuevo nombre (opcional)"),
      price: z.coerce.number().nonnegative().optional().describe("Nuevo precio en euros (opcional)"),
      stockQuantity: z.coerce.number().int().nonnegative().optional().describe("Nuevo stock (opcional)"),
      active: z.boolean().optional().describe("true para reactivar un repuesto desactivado (opcional)"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: {
        partId: { type: SchemaType.INTEGER, description: "ID del repuesto" },
        name: { type: SchemaType.STRING, description: "Nuevo nombre (opcional)" },
        price: { type: SchemaType.NUMBER, description: "Nuevo precio en euros (opcional)" },
        stockQuantity: { type: SchemaType.NUMBER, description: "Nuevo stock (opcional)" },
        active: { type: SchemaType.BOOLEAN, description: "true para reactivar un repuesto desactivado (opcional)" },
      },
      required: ["partId"],
    },
    async handler({ partId, ...changes }) {
      const body = {};
      for (const [key, value] of Object.entries(changes)) {
        if (value !== undefined) body[key] = value;
      }
      return callTaller(`/parts/${partId}`, { method: "PATCH", body });
    },
  },
  {
    name: "deactivate_spare_part",
    title: "Desactivar un repuesto",
    description:
      "Desactiva un repuesto (soft-delete, reversible con update_spare_part y active=true). " +
      "Sin advertencia asociada — se puede ejecutar directo, igual que el botón del panel de " +
      "stock, que tampoco pide confirmación para esto.",
    zodShape: {
      partId: z.coerce.number().int().positive().describe("ID del repuesto a desactivar"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: { partId: { type: SchemaType.INTEGER, description: "ID del repuesto a desactivar" } },
      required: ["partId"],
    },
    async handler({ partId }) {
      return callTaller(`/parts/${partId}`, { method: "DELETE" });
    },
  },
  {
    name: "create_budget",
    title: "Armar un presupuesto de reparación",
    description:
      "Crea un presupuesto para una reparación eligiendo repuestos y cantidades (el total " +
      "sale de sumar precio × cantidad de cada línea, no hay campo de mano de obra en esta " +
      "demo). Consultar list_spare_parts primero para conocer los sparePartId y precios " +
      "válidos. Al crearse, la reparación pasa a ESPERANDO_APROBACION_PRESUPUESTO y queda a " +
      "la espera de que el dueño de la flota lo apruebe (cobra a BankIn, fuera de alcance de " +
      "este asistente) o lo rechace desde el panel admin. Sin advertencia asociada acá — se " +
      "puede ejecutar directo.",
    zodShape: {
      repairId: z.coerce.number().int().positive().describe("ID de la reparación"),
      items: z
        .array(
          z.object({
            sparePartId: z.coerce.number().int().positive().describe("ID del repuesto (de list_spare_parts)"),
            quantity: z.coerce.number().int().positive().describe("Cantidad de ese repuesto"),
          })
        )
        .min(1)
        .describe("Una o más líneas de repuestos"),
    },
    geminiParameters: {
      type: SchemaType.OBJECT,
      properties: {
        repairId: { type: SchemaType.INTEGER, description: "ID de la reparación" },
        items: {
          type: SchemaType.ARRAY,
          description: "Una o más líneas de repuestos",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              sparePartId: { type: SchemaType.INTEGER, description: "ID del repuesto (de list_spare_parts)" },
              quantity: { type: SchemaType.INTEGER, description: "Cantidad de ese repuesto" },
            },
            required: ["sparePartId", "quantity"],
          },
        },
      },
      required: ["repairId", "items"],
    },
    async handler({ repairId, items }) {
      return callTaller(`/repairs/${repairId}/budgets`, { method: "POST", body: { items } });
    },
  },
];

export const TALLER_TOOLS = [...reusedTools, ...newTallerTools];

export function findTallerTool(name) {
  return TALLER_TOOLS.find((t) => t.name === name);
}
