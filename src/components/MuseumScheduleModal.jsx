import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

// Horario del museo: siempre hoy + los próximos 7 días (8 días en total).
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

function emptySchedule() {
  const map = {}
  getWindowDates().forEach((date) => {
    map[date] = { openTime: '', closeTime: '' }
  })
  return map
}

function validateSchedule(schedule) {
  const errs = {}
  Object.entries(schedule).forEach(([date, row]) => {
    const hasOpen = row.openTime !== ''
    const hasClose = row.closeTime !== ''
    if (hasOpen !== hasClose) {
      errs[date] = 'Completa apertura y cierre, o deja ambos vacíos (día cerrado).'
    } else if (hasOpen && hasClose && row.closeTime <= row.openTime) {
      errs[date] = 'El cierre debe ser después de la apertura.'
    }
  })
  return errs
}

export default function MuseumScheduleModal({ open, spacecraft, onClose, onSaved }) {
  const [schedule, setSchedule] = useState(emptySchedule)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    setSchedule(emptySchedule())
    setErrors({})
    setNotice('')
    setLoading(true)
    spacecraftApi
      .getMuseumSchedule(spacecraft.id)
      .then((rows) => {
        setSchedule((prev) => {
          const next = { ...prev }
          rows.forEach((row) => {
            if (next[row.date]) {
              next[row.date] = {
                openTime: row.openTime ? row.openTime.slice(0, 5) : '',
                closeTime: row.closeTime ? row.closeTime.slice(0, 5) : '',
              }
            }
          })
          return next
        })
      })
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }, [open, spacecraft])

  if (!open) return null

  function updateField(date, field, value) {
    setSchedule((prev) => ({ ...prev, [date]: { ...prev[date], [field]: value } }))
  }

  async function handleSave() {
    const validationErrors = validateSchedule(schedule)
    setErrors(validationErrors)
    setNotice('')
    if (Object.keys(validationErrors).length > 0) return

    const daysToSave = Object.entries(schedule).filter(([, row]) => row.openTime && row.closeTime)
    setSaving(true)
    try {
      await Promise.all(
        daysToSave.map(([date, row]) =>
          spacecraftApi.saveMuseumScheduleDay({
            spacecraftId: spacecraft.id,
            date,
            openTime: row.openTime,
            closeTime: row.closeTime,
          })
        )
      )
      onSaved?.()
      onClose()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-overlay modal-overlay-top"
      role="presentation"
      onClick={(e) => {
        e.stopPropagation()
        if (!saving) onClose()
      }}
    >
      <div className="modal-card schedule-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Horario de {spacecraft?.name}</h2>
        <p className="schedule-hint schedule-hint-top">
          Hoy + los próximos 7 días. Deja ambos campos vacíos para marcar el día como cerrado.
        </p>

        {loading && <p className="schedule-hint">Cargando horario…</p>}
        {notice && <p className="field-error">{notice}</p>}

        <div className="schedule-grid">
          {Object.entries(schedule).map(([date, row]) => (
            <div className="schedule-row" key={date}>
              <span className="schedule-day">{formatDateLabel(date)}</span>
              <label className="schedule-time-group">
                <span>Apertura</span>
                <input
                  type="time"
                  value={row.openTime}
                  onChange={(e) => updateField(date, 'openTime', e.target.value)}
                />
              </label>
              <label className="schedule-time-group">
                <span>Cierre</span>
                <input
                  type="time"
                  value={row.closeTime}
                  onChange={(e) => updateField(date, 'closeTime', e.target.value)}
                />
              </label>
              {errors[date] && <span className="field-error schedule-row-error">{errors[date]}</span>}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Guardando…' : 'Guardar horario'}
          </button>
        </div>
      </div>
    </div>
  )
}
