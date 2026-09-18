import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'
import RepairStatusPanel from './RepairStatusPanel'
import { repairStatusLabel } from '../constants/repairStatus'

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

export default function WorkshopStatusModal({ open, spacecraft, onClose, onReceived }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    setNotice('')
    setLoading(true)
    spacecraftApi
      .getRepairsForSpacecraft(spacecraft.id)
      .then(setRecords)
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }, [open, spacecraft])

  if (!open) return null

  return (
    <div
      className="modal-overlay modal-overlay-top"
      role="presentation"
      onClick={onClose}
    >
      <div className="modal-card schedule-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Taller — {spacecraft?.name}</h2>

        <div style={{ marginBottom: '18px' }}>
          <RepairStatusPanel
            spacecraftId={spacecraft.id}
            onReceived={() => {
              onReceived?.(spacecraft.name)
              onClose()
            }}
          />
        </div>

        <h3 style={{ fontSize: '0.95rem', margin: '14px 0 10px', color: 'var(--text-muted)' }}>
          Historial de visitas
        </h3>

        {notice && <p className="field-error">{notice}</p>}
        {loading && <p className="schedule-hint">Cargando historial…</p>}

        {!loading && records.length === 0 && (
          <p className="schedule-hint">Esta nave nunca ha estado en el taller.</p>
        )}

        {!loading && records.length > 0 && (
          <div className="repair-record-list">
            {records.map((r) => (
              <div className="repair-record-card" key={r.id}>
                <div className="repair-record-head">
                  <span className={`status-badge status-${r.status.toLowerCase()}`}>
                    {repairStatusLabel(r.status)}
                  </span>
                  <span className="repair-record-dates">
                    {formatDateTime(r.createdAt)} {r.deliveredAt ? `→ ${formatDateTime(r.deliveredAt)}` : '(en curso)'}
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
                {(r.closedMuseumDates?.length > 0 || r.closedTheaterEvents?.length > 0) && (
                  <p className="repair-record-detail">
                    {r.closedMuseumDates?.length ?? 0} horario{(r.closedMuseumDates?.length ?? 0) === 1 ? '' : 's'} de museo cerrado{(r.closedMuseumDates?.length ?? 0) === 1 ? '' : 's'} · {r.closedTheaterEvents?.length ?? 0} función{(r.closedTheaterEvents?.length ?? 0) === 1 ? '' : 'es'} de teatro cerrada{(r.closedTheaterEvents?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            ))}
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
