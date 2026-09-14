// Fase 3: estados de la nave. OPERATIVA es el default; los demás son sub-estados dentro
// del taller de reparación (se gestionan desde la app de taller, no desde este admin).
export const STATUS_LABELS = {
  OPERATIVA: '✅ Operativa',
  ENTRO_A_TALLER: '🔧 Entró a taller',
  EN_REVISION: '🔍 En revisión',
  ESPERA_REPUESTOS: '⏳ Espera de repuestos',
  EN_PROCESO: '🛠️ En proceso',
}

export function statusLabel(status) {
  return STATUS_LABELS[status || 'OPERATIVA'] ?? status
}

export function isOperativa(status) {
  return !status || status === 'OPERATIVA'
}
