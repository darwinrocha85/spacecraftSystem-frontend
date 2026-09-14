import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

// Misma ventana movil de 8 dias que el resto de la app (hoy + 7 dias mas).
const WINDOW_DAYS = 8

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWindowDates() {
  const dates = []
  const today = new Date()
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    dates.push(toIsoDate(d))
  }
  return dates
}

function formatDateLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function MuseumSalesModal({ open, spacecraft, onClose }) {
  const [byDay, setByDay] = useState({}) // { isoDate: slots[] | null (null = cargando aun) }
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    const dates = getWindowDates()
    const initial = {}
    dates.forEach((d) => {
      initial[d] = null
    })
    setByDay(initial)
    setNotice('')
    setLoading(true)

    Promise.all(
      dates.map((date) =>
        spacecraftApi
          .getMuseumAvailability(spacecraft.id, date)
          .then((slots) => ({ date, slots }))
          .catch((err) => ({ date, slots: [], error: err.message }))
      )
    )
      .then((results) => {
        const next = {}
        let firstError = ''
        results.forEach(({ date, slots, error }) => {
          next[date] = slots
          if (error && !firstError) firstError = error
        })
        setByDay(next)
        if (firstError) setNotice(firstError)
      })
      .finally(() => setLoading(false))
  }, [open, spacecraft])

  if (!open) return null

  const dates = getWindowDates()
  const totalSold = Object.values(byDay).reduce((sum, slots) => {
    if (!slots) return sum
    return sum + slots.reduce((s, slot) => s + (slot.booked ?? 0), 0)
  }, 0)

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
        <h2>Entradas vendidas — {spacecraft?.name}</h2>
        <p className="schedule-hint schedule-hint-top">
          Hoy + los próximos 7 días, por franja horaria.{' '}
          {!loading && <strong>{totalSold} entrada{totalSold === 1 ? '' : 's'} vendida{totalSold === 1 ? '' : 's'} en la ventana.</strong>}
        </p>

        {notice && <p className="field-error">{notice}</p>}
        {loading && <p className="schedule-hint">Cargando ventas…</p>}

        {!loading && (
          <div className="sales-day-list">
            {dates.map((date) => {
              const slots = byDay[date] || []
              const daySold = slots.reduce((s, slot) => s + (slot.booked ?? 0), 0)
              return (
                <div className="sales-day-card" key={date}>
                  <div className="sales-day-head">
                    <span className="schedule-day">{formatDateLabel(date)}</span>
                    {slots.length > 0 && (
                      <span className="sales-day-total">{daySold} vendida{daySold === 1 ? '' : 's'}</span>
                    )}
                  </div>

                  {slots.length === 0 ? (
                    <p className="schedule-hint">Nave cerrada ese día.</p>
                  ) : (
                    <div className="sales-slot-list">
                      {slots.map((slot) => {
                        const pct = slot.capacity > 0 ? Math.round((slot.booked / slot.capacity) * 100) : 0
                        return (
                          <div className="sales-slot-row" key={slot.time}>
                            <span className="sales-slot-time">{slot.time?.slice(0, 5)}</span>
                            <div className="sales-slot-bar-track">
                              <div className="sales-slot-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="sales-slot-count">
                              {slot.booked}/{slot.capacity}
                            </span>
                          </div>
                        )
                      })}
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
