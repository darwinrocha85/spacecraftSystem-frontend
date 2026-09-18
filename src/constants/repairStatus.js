// Fase 1 (extracción del taller a backend Python): ahora hay DOS conceptos de estado separados:
//  - Spacecraft.status (spacecraftSystem/Java): solo OPERATIVA o EN_TALLER - lo único que le
//    importa al resto del sistema (venta de entradas, marketing, dashboard).
//  - Repair.status (spacecraft-taller-backend/Python): el detalle fino del ciclo de reparación,
//    que este panel admin ahora también puede leer (y actuar sobre presupuestos/recepción).

export const STATUS_LABELS = {
  OPERATIVA: '✅ Operativa',
  EN_TALLER: '🔧 En taller',
}

export function statusLabel(status) {
  return STATUS_LABELS[status || 'OPERATIVA'] ?? status
}

export function isOperativa(status) {
  return !status || status === 'OPERATIVA'
}

export const REPAIR_STATUS_LABELS = {
  ENVIADA: '📦 Enviada, esperando confirmación del taller',
  RECIBIDA: '📥 Recibida por el taller',
  EN_REVISION: '🔍 En revisión',
  EN_TRABAJO: '🛠️ En trabajo',
  ESPERANDO_APROBACION_PRESUPUESTO: '💰 Esperando tu aprobación de presupuesto',
  LISTA_PARA_SALIR: '✅ Lista para retirar',
  ENTREGADA: '🚀 Entregada',
}

export function repairStatusLabel(status) {
  return REPAIR_STATUS_LABELS[status] ?? status
}
