import { useEffect, useState } from 'react'
import MuseumScheduleModal from './MuseumScheduleModal'
import TheaterEventModal from './TheaterEventModal'
import SendToTallerModal from './SendToTallerModal'
import { isOperativa } from '../constants/repairStatus'

const EMPTY_FORM = {
  name: '',
  franchise: '',
  crewCapacity: '',
  speed: '',
  spacecraftType: '',
  isArmed: false,
  isMuseum: false,
  isTheater: false,
  museumCapacity: '',
  ticketPrice: '',
}

function toFormState(spacecraft) {
  if (!spacecraft) return EMPTY_FORM
  return {
    name: spacecraft.name ?? '',
    franchise: spacecraft.franchise ?? '',
    crewCapacity: spacecraft.crewCapacity ?? '',
    speed: spacecraft.speed ?? '',
    spacecraftType: spacecraft.spacecraftType ?? '',
    isArmed: Boolean(spacecraft.isArmed),
    isMuseum: Boolean(spacecraft.isMuseum),
    isTheater: Boolean(spacecraft.isTheater),
    museumCapacity: spacecraft.museumCapacity ?? '',
    ticketPrice: spacecraft.ticketPrice ?? '',
  }
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
  if (!form.franchise.trim()) errors.franchise = 'La franquicia es obligatoria.'
  if (form.crewCapacity !== '' && Number(form.crewCapacity) < 0) {
    errors.crewCapacity = 'No puede ser negativo.'
  }
  if (form.speed !== '' && Number(form.speed) < 0) {
    errors.speed = 'No puede ser negativa.'
  }
  if (form.isMuseum && (form.museumCapacity === '' || Number(form.museumCapacity) <= 0)) {
    errors.museumCapacity = 'Obligatoria y mayor a 0 si la nave es museo.'
  }
  if (form.ticketPrice !== '' && Number(form.ticketPrice) < 0) {
    errors.ticketPrice = 'No puede ser negativo.'
  }
  return errors
}

export default function SpacecraftForm({ open, spacecraft, saving, onSubmit, onCancel, onSentToTaller }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [theaterEventsOpen, setTheaterEventsOpen] = useState(false)
  const [tallerOpen, setTallerOpen] = useState(false)
  const isEditing = Boolean(spacecraft)
  const operativa = isOperativa(spacecraft?.status)
  const blocked = isEditing && !operativa

  useEffect(() => {
    if (open) {
      setForm(toFormState(spacecraft))
      setErrors({})
      setScheduleOpen(false)
      setTheaterEventsOpen(false)
      setTallerOpen(false)
    }
  }, [open, spacecraft])

  if (!open) return null

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    onSubmit({
      name: form.name.trim(),
      franchise: form.franchise.trim(),
      crewCapacity: form.crewCapacity === '' ? null : Number(form.crewCapacity),
      speed: form.speed === '' ? null : Number(form.speed),
      spacecraftType: form.spacecraftType.trim() || null,
      isArmed: form.isArmed,
      isMuseum: form.isMuseum,
      isTheater: form.isTheater,
      museumCapacity: form.isMuseum && form.museumCapacity !== '' ? Number(form.museumCapacity) : null,
      ticketPrice: form.ticketPrice === '' ? null : Number(form.ticketPrice),
    })
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <form
        className="modal-card form-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2>{isEditing ? `Editar ${spacecraft.name}` : 'Registrar nueva nave'}</h2>

        <div className="form-grid">
          <label className="field">
            <span>Nombre *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ej. Halcón Milenario"
              autoFocus
              disabled={blocked}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <label className="field">
            <span>Franquicia *</span>
            <input
              type="text"
              value={form.franchise}
              onChange={(e) => update('franchise', e.target.value)}
              placeholder="Ej. Star Wars"
              disabled={blocked}
            />
            {errors.franchise && <span className="field-error">{errors.franchise}</span>}
          </label>

          <label className="field">
            <span>Tipo de nave</span>
            <input
              type="text"
              value={form.spacecraftType}
              onChange={(e) => update('spacecraftType', e.target.value)}
              placeholder="Ej. Carguero"
              disabled={blocked}
            />
          </label>

          <label className="field">
            <span>Capacidad de tripulación</span>
            <input
              type="number"
              min="0"
              value={form.crewCapacity}
              onChange={(e) => update('crewCapacity', e.target.value)}
              placeholder="Ej. 6"
              disabled={blocked}
            />
            {errors.crewCapacity && <span className="field-error">{errors.crewCapacity}</span>}
          </label>

          <label className="field">
            <span>Velocidad</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.speed}
              onChange={(e) => update('speed', e.target.value)}
              placeholder="Ej. 1050 (en unidades de tu backend)"
              disabled={blocked}
            />
            {errors.speed && <span className="field-error">{errors.speed}</span>}
          </label>

          <label className="field switch-field">
            <span>¿Está armada?</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.isArmed}
              className={`switch ${form.isArmed ? 'switch-on' : ''}`}
              onClick={() => update('isArmed', !form.isArmed)}
              disabled={blocked}
            >
              <span className="switch-thumb" />
            </button>
          </label>

          <label className="field switch-field">
            <span>¿Es museo?</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.isMuseum}
              className={`switch switch-museum ${form.isMuseum ? 'switch-on' : ''}`}
              onClick={() => update('isMuseum', !form.isMuseum)}
              disabled={blocked}
            >
              <span className="switch-thumb" />
            </button>
          </label>

          <label className="field switch-field">
            <span>¿Es teatro?</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.isTheater}
              className={`switch switch-theater ${form.isTheater ? 'switch-on' : ''}`}
              onClick={() => update('isTheater', !form.isTheater)}
              disabled={blocked}
            >
              <span className="switch-thumb" />
            </button>
          </label>

          {form.isMuseum && (
            <label className="field">
              <span>Capacidad del museo (personas a la vez) *</span>
              <input
                type="number"
                min="1"
                value={form.museumCapacity}
                onChange={(e) => update('museumCapacity', e.target.value)}
                placeholder="Ej. 150"
                disabled={blocked}
              />
              {errors.museumCapacity && <span className="field-error">{errors.museumCapacity}</span>}
            </label>
          )}

          {form.isMuseum && (
            <div className="field schedule-launcher">
              <span>Horario del museo</span>
              {isEditing ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-schedule"
                  onClick={() => setScheduleOpen(true)}
                  disabled={blocked}
                >
                  🗓 Configurar horario
                </button>
              ) : (
                <p className="schedule-hint">Podrás configurarlo después de registrar la nave.</p>
              )}
            </div>
          )}

          {(form.isMuseum || form.isTheater) && (
            <label className="field">
              <span>Precio de la entrada (BankIn)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.ticketPrice}
                onChange={(e) => update('ticketPrice', e.target.value)}
                placeholder="Ej. 25.00 (si se deja vacío se usa 25.00 € por defecto)"
                disabled={blocked}
              />
              {errors.ticketPrice && <span className="field-error">{errors.ticketPrice}</span>}
            </label>
          )}

          {form.isTheater && (
            <div className="field schedule-launcher">
              <span>Funciones de teatro</span>
              {isEditing ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-schedule"
                  onClick={() => setTheaterEventsOpen(true)}
                  disabled={blocked}
                >
                  🎭 Configurar funciones
                </button>
              ) : (
                <p className="schedule-hint">Podrás configurarlas después de registrar la nave.</p>
              )}
            </div>
          )}

          {isEditing && operativa && (
            <div className="field schedule-launcher">
              <span>Taller de reparación</span>
              <button type="button" className="btn btn-ghost btn-schedule" onClick={() => setTallerOpen(true)}>
                🔧 Enviar a taller
              </button>
            </div>
          )}
          {blocked && (
            <div className="field schedule-launcher">
              <span>Taller de reparación</span>
              <p className="schedule-hint">
                Nave en taller — no editable. Haz click en “En taller” en la tabla para ver el estado.
              </p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || blocked}>
            {blocked ? 'No editable en taller' : saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar nave'}
          </button>
        </div>
      </form>

      {isEditing && (
        <MuseumScheduleModal
          open={scheduleOpen}
          spacecraft={spacecraft}
          onClose={() => setScheduleOpen(false)}
        />
      )}

      {isEditing && (
        <TheaterEventModal
          open={theaterEventsOpen}
          spacecraft={spacecraft}
          onClose={() => setTheaterEventsOpen(false)}
        />
      )}

      {isEditing && (
        <SendToTallerModal
          open={tallerOpen}
          spacecraft={spacecraft}
          onClose={() => setTallerOpen(false)}
          onSent={(name) => {
            setTallerOpen(false)
            onSentToTaller?.(name)
          }}
        />
      )}
    </div>
  )
}
