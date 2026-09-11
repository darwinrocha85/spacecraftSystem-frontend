import { useEffect, useState } from 'react'

const EMPTY_FORM = {
  name: '',
  franchise: '',
  crewCapacity: '',
  speed: '',
  spacecraftType: '',
  isArmed: false,
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
  return errors
}

export default function SpacecraftForm({ open, spacecraft, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(toFormState(spacecraft))
      setErrors({})
    }
  }, [open, spacecraft])

  if (!open) return null

  const isEditing = Boolean(spacecraft)

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
            >
              <span className="switch-thumb" />
            </button>
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar nave'}
          </button>
        </div>
      </form>
    </div>
  )
}
