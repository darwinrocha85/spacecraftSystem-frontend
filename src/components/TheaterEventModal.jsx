import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

const EVENT_TYPES = [
  { value: 'MUSICA', label: '🎵 Música' },
  { value: 'ARTES', label: '🎭 Artes escénicas' },
  { value: 'LIBRE', label: '🎤 Libre' },
]

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyForm() {
  return { eventType: 'MUSICA', startDate: todayIso(), endDate: todayIso(), time: '' }
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function validate(form) {
  const errors = {}
  if (!form.startDate) errors.startDate = 'La fecha de inicio es obligatoria.'
  if (!form.endDate) errors.endDate = 'La fecha de fin es obligatoria.'
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'Debe ser igual o posterior a la fecha de inicio.'
  }
  if (!form.time) errors.time = 'La hora es obligatoria.'
  return errors
}

export default function TheaterEventModal({ open, spacecraft, onClose, onSaved }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    setForm(emptyForm())
    setEditingId(null)
    setDeleteConfirmId(null)
    setErrors({})
    setNotice('')
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spacecraft])

  function loadEvents() {
    setLoading(true)
    spacecraftApi
      .listTheaterEvents(spacecraft.id)
      .then(setEvents)
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }

  if (!open) return null

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startEdit(ev) {
    setDeleteConfirmId(null)
    setEditingId(ev.id)
    setForm({
      eventType: ev.eventType,
      startDate: ev.startDate,
      endDate: ev.endDate,
      time: ev.time ? ev.time.slice(0, 5) : '',
    })
    setErrors({})
    setNotice('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
    setErrors({})
  }

  async function handleSubmit() {
    const validationErrors = validate(form)
    setErrors(validationErrors)
    setNotice('')
    if (Object.keys(validationErrors).length > 0) return

    const payload = {
      spacecraftId: spacecraft.id,
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate,
      time: form.time,
    }

    setSaving(true)
    try {
      if (editingId) {
        await spacecraftApi.updateTheaterEvent(editingId, payload)
      } else {
        await spacecraftApi.createTheaterEvent(payload)
      }
      setForm(emptyForm())
      setEditingId(null)
      await loadEvents()
      onSaved?.()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setSaving(true)
    setNotice('')
    try {
      await spacecraftApi.deleteTheaterEvent(id)
      setDeleteConfirmId(null)
      if (editingId === id) cancelEdit()
      await loadEvents()
      onSaved?.()
    } catch (err) {
      setNotice(err.message)
      setDeleteConfirmId(null)
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
        <h2>Funciones de teatro — {spacecraft?.name}</h2>
        <p className="schedule-hint schedule-hint-top">
          Cada función se repite todos los días del rango a la misma hora, con 100 asientos fijos. No puede
          chocar con otra función de esta nave en la misma franja de horario.
        </p>

        {notice && <p className="field-error">{notice}</p>}

        <div className="event-form">
          <label className="field">
            <span>Tipo de evento</span>
            <select value={form.eventType} onChange={(e) => update('eventType', e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Hora</span>
            <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
            {errors.time && <span className="field-error">{errors.time}</span>}
          </label>

          <label className="field">
            <span>Fecha inicio</span>
            <input
              type="date"
              value={form.startDate}
              min={todayIso()}
              onChange={(e) => update('startDate', e.target.value)}
            />
            {errors.startDate && <span className="field-error">{errors.startDate}</span>}
          </label>

          <label className="field">
            <span>Fecha fin</span>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate || todayIso()}
              onChange={(e) => update('endDate', e.target.value)}
            />
            {errors.endDate && <span className="field-error">{errors.endDate}</span>}
          </label>
        </div>

        <div className="modal-actions modal-actions-left">
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : '+ Crear función'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
              Cancelar edición
            </button>
          )}
        </div>

        <div className="schedule-block">
          <p className="schedule-title">Funciones ya programadas</p>
          {loading && <p className="schedule-hint">Cargando funciones…</p>}
          {!loading && events.length === 0 && <p className="schedule-hint">Todavía no hay funciones.</p>}
          {!loading && events.length > 0 && (
            <div className="event-list event-list-admin">
              {events.map((ev) => (
                <div className={`event-card event-card-admin${editingId === ev.id ? ' event-card-editing' : ''}`} key={ev.id}>
                  <div className="event-card-admin-head">
                    <span className={`event-type-badge event-type-${ev.eventType?.toLowerCase()}`}>
                      {EVENT_TYPES.find((t) => t.value === ev.eventType)?.label ?? ev.eventType}
                    </span>
                    <div className="event-card-admin-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => startEdit(ev)}
                        aria-label={`Editar función del ${formatDate(ev.startDate)}`}
                        disabled={saving}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => setDeleteConfirmId(ev.id)}
                        aria-label={`Eliminar función del ${formatDate(ev.startDate)}`}
                        disabled={saving}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <p className="event-dates">
                    {formatDate(ev.startDate)} — {formatDate(ev.endDate)}
                  </p>
                  <p className="event-time">🕒 {ev.time?.slice(0, 5)}</p>

                  {deleteConfirmId === ev.id && (
                    <div className="event-card-confirm">
                      <span>¿Borrar esta función?</span>
                      <div className="event-card-confirm-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-schedule"
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={saving}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-schedule"
                          onClick={() => handleDelete(ev.id)}
                          disabled={saving}
                        >
                          Sí, borrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
