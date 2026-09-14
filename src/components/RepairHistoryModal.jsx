import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'
import { statusLabel } from '../constants/repairStatus'

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RepairHistoryModal({ open, spacecraft, onClose }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    setNotice('')
    setLoading(true)
    spacecraftApi
      .getRepairHistory(spacecraft.id)
      .then(setRecords)
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }, [open, spacecraft])

  if (!open) return null

  const totalClosedMuseum = records.reduce((sum, r) => sum + (r.closedMuseumDates?.length ?? 0), 0)
  const totalClosedTheater = records.reduce((sum, r) => sum + (r.closedTheaterEvents?.length ?? 0), 0)
  const totalCancelledTickets = records.reduce((sum, r) => sum + (r.cancelledTicketCount ?? 0), 0)

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
        <h2>🔧 Historial de taller — {spacecraft?.name}</h2>

        {notice && <p className="field-error">{notice}</p>}
        {loading && <p className="schedule-hint">Cargando historial…</p>}

        {!loading && records.length === 0 && (
          <p className="schedule-hint">Esta nave nunca ha estado en el taller.</p>
        )}

        {!loading && records.length > 0 && (
          <>
            <p className="schedule-hint schedule-hint-top">
              {records.length} visita{records.length === 1 ? '' : 's'} al taller en total ·{' '}
              <strong>
                {totalClosedMuseum + totalClosedTheater} horario{totalClosedMuseum + totalClosedTheater === 1 ? '' : 's'}
                /función{totalClosedMuseum + totalClosedTheater === 1 ? '' : 'es'}
              </strong>{' '}
              cerrados y <strong>{totalCancelledTickets}</strong> entrada{totalCancelledTickets === 1 ? '' : 's'} cancelada
              {totalCancelledTickets === 1 ? '' : 's'} en total.
            </p>

            <div className="repair-record-list">
              {records.map((r) => (
                <div className="repair-record-card" key={r.id}>
                  <div className="repair-record-head">
                    <span className={`status-badge status-${(r.status || 'OPERATIVA').toLowerCase()}`}>
                      {statusLabel(r.status)}
                    </span>
                    <span className="repair-record-dates">
                      {formatDateTime(r.sentAt)} {r.finishedAt ? `→ ${formatDateTime(r.finishedAt)}` : '(en curso)'}
                    </span>
                  </div>

                  {r.damages?.length > 0 && (
                    <div className="damage-chip-list">
                      {r.damages.map((d, i) => (
                        <span className="damage-chip" key={i}>
                          {d.subtype}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="repair-record-detail">
                    {r.cancelledTicketCount ?? 0} entrada{(r.cancelledTicketCount ?? 0) === 1 ? '' : 's'} cancelada
                    {(r.cancelledTicketCount ?? 0) === 1 ? '' : 's'} · {r.closedMuseumDates?.length ?? 0} horario
                    {(r.closedMuseumDates?.length ?? 0) === 1 ? '' : 's'} de museo cerrado
                    {(r.closedMuseumDates?.length ?? 0) === 1 ? '' : 's'} · {r.closedTheaterEvents?.length ?? 0} función
                    {(r.closedTheaterEvents?.length ?? 0) === 1 ? '' : 'es'} de teatro cerrada
                    {(r.closedTheaterEvents?.length ?? 0) === 1 ? '' : 's'}
                  </p>

                  {r.closedTheaterEvents?.length > 0 && (
                    <ul className="repair-closed-events">
                      {r.closedTheaterEvents.map((ev, i) => (
                        <li key={i}>
                          {ev.eventType}: {formatDate(ev.startDate)} — {formatDate(ev.endDate)} · {ev.eventTime?.slice(0, 5)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
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
