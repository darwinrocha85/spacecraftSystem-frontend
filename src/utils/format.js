// Fase 6: formato compartido para el dashboard (montos y porcentajes).
export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toFixed(2)}`
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  return `${value}%`
}
