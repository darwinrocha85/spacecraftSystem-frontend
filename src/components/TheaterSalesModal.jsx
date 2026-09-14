import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

const EVENT_TYPE_LABELS = {
  MUSICA: '🎵 Música',
  ARTES: '🎭 Artes escénicas',
  LIBRE: '🎤 Libre',
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysInRange(startIso, endIso) {
  const start = new Date(startIso + 'T00:00:00')
  const end = new Date(endIso + 'T00:00:00')
  return Math.round((end - start) / 86400000) + 1
}

export default function TheaterSalesModal({ open, spacecraft, onClose }) {
  const [events, setEvents] = useState([])
  const [sales, setSales] = useState({}) // { eventId: salesData | null (cargando) | { error } }
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    setSales({})
    setNotice('')
    setLoadingEvents(true)
    spacecraftApi
      .listTheaterEvents(spacecraft.id)
      .then((evts) => {
        setEvents(evts)
        const initial = {}
        evts.forEach((ev) => {
          initial[ev.id] = null
        })
        setSales(initial)
        return Promise.all(
          evts.map((ev) =>
            spacecraftApi
              .getTheaterEventSales(ev.id)
              .then((data) => ({ id: ev.id, data }))
              .catch((err) => ({ id: ev.id, error: err.message }))
          )
        )
      })
      .then((results) => {
        if (!results) return
        setSales((prev) => {
          const next = { ...prev }
          results.forEach(({ id, data, error }) => {
            next[id] = error ? { error } : data
          })
          return next
        })
      })
      .catch((err) => setNotice(err.message))
      .finally(() => setLoadingEvents(false))
  }, [open, spacecraft])

  if (!open) return null

  const totalSold = events.reduce((sum, ev) => sum + (sales[ev.id]?.totalSeatsSold ?? 0), 0)

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
          Por evento (100 asientos por función).{' '}
          {!loadingEvents && <strong>{totalSold} asiento{totalSold === 1 ? '' : 's'} vendido{totalSold === 1 ? '' : 's'} en total.</strong>}
        </p>

        {notice && <p className="field-error">{notice}</p>}
        {loadingEvents && <p className="schedule-hint">Cargando funciones…</p>}
        {!loadingEvents && events.length === 0 && <p className="schedule-hint">Todavía no hay funciones programadas.</p>}

        {!loadingEvents && events.length > 0 && (
          <div className="event-list event-list-admin">
            {events.map((ev) => {
              const s = sales[ev.id]
              const totalCapacity = daysInRange(ev.startDate, ev.endDate) * 100
              return (
                <div className="event-card event-card-admin sales-event-card" key={ev.id}>
                  <span className={`event-type-badge event-type-${ev.eventType?.toLowerCase()}`}>
                    {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                  </span>
                  <p className="event-dates">
                    {formatDate(ev.startDate)} — {formatDate(ev.endDate)}
                  </p>
                  <p className="event-time">🕒 {ev.time?.slice(0, 5)}</p>

                  {s === null && <p className="schedule-hint">Cargando ventas…</p>}
                  {s?.error && <p className="field-error">{s.error}</p>}
                  {s && !s.error && (
                    <>
                      <p className="sales-event-total">
                        {s.totalSeatsSold} / {totalCapacity} asientos vendidos
                      </p>
                      {s.byDate.length > 0 && (
                        <div className="sales-slot-list">
                          {s.byDate.map((row) => (
                            <div className="sales-slot-row" key={row.functionDate}>
                              <span className="sales-slot-time">{formatDate(row.functionDate)}</span>
                              <div className="sales-slot-bar-track">
                                <div
                                  className="sales-slot-bar-fill"
                                  style={{ width: `${Math.round((row.seatsSold / row.seatsPerFunction) * 100)}%` }}
                                />
                              </div>
                              <span className="sales-slot-count">
                                {row.seatsSold}/{row.seatsPerFunction}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
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
