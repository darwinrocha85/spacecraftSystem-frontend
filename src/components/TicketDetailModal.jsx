import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'
import { formatMoney } from '../utils/format'

const TYPE_LABELS = {
  museum: '🏛 Museo',
  theater: '🎭 Teatro',
}

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate + 'T00:00:00')
  const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatTime(time) {
  if (!time) return '—'
  return time.slice(0, 5)
}

// Fase 6 (fix 2026-09-17): detalle de entradas activas. Se abre al hacer click en la tira "Entradas
// activas" del dashboard (general o por nave) — antes ese número no llevaba a ningún lado. Muestra
// fecha/hora de cada entrada de un vistazo, y un botón "Ver detalle" por fila que expande comprador,
// código de confirmación y el desglose de costo (para entender por qué el ingreso total es el que es).
export default function TicketDetailModal({ open, spacecraftId, title, onClose }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedKey, setExpandedKey] = useState(null)

  useEffect(() => {
    if (!open) return
    setExpandedKey(null)
    setError('')
    setLoading(true)
    spacecraftApi
      .getDashboardTickets(spacecraftId)
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [open, spacecraftId])

  if (!open) return null

  return (
    <div
      className="modal-overlay modal-overlay-top"
      role="presentation"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div className="modal-card schedule-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Entradas activas{title ? ` — ${title}` : ''}</h2>
        <p className="schedule-hint schedule-hint-top">
          {!loading && !error && (
            <strong>
              {tickets.length} entrada{tickets.length === 1 ? '' : 's'} activa{tickets.length === 1 ? '' : 's'}.
            </strong>
          )}
        </p>

        {error && <p className="field-error">{error}</p>}
        {loading && <p className="schedule-hint">Cargando entradas…</p>}

        {!loading && !error && tickets.length === 0 && (
          <p className="schedule-hint">Todavía no hay entradas activas.</p>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-detail-list">
            {tickets.map((t) => {
              const key = `${t.type}-${t.confirmationCode}`
              const expanded = expandedKey === key
              return (
                <div className="ticket-detail-row" key={key}>
                  <div className="ticket-detail-summary">
                    <span className={`venue-badge venue-${t.type === 'museum' ? 'museum' : 'theater'}`}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </span>
                    {!spacecraftId && <span className="ticket-detail-ship">{t.spacecraftName}</span>}
                    <span className="ticket-detail-date">{formatDate(t.date)}</span>
                    <span className="ticket-detail-time">🕒 {formatTime(t.time)}</span>
                    <span className="ticket-detail-qty">
                      {t.quantity} entrada{t.quantity === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setExpandedKey(expanded ? null : key)}
                    >
                      {expanded ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                  </div>

                  {expanded && (
                    <div className="ticket-detail-expanded">
                      <p>
                        <strong>Comprador:</strong> {t.buyerName} · {t.buyerEmail}
                      </p>
                      <p>
                        <strong>Código de confirmación:</strong> {t.confirmationCode}
                      </p>
                      <p>
                        <strong>Cantidad comprada:</strong> {t.quantity}
                      </p>
                      <p>
                        <strong>Costo individual:</strong> {formatMoney(t.unitPrice)}
                      </p>
                      <p>
                        <strong>Costo total:</strong> {formatMoney(t.totalPrice)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
