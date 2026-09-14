import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

function emptyRow() {
  return { category: '', subtype: '' }
}

export default function SendToTallerModal({ open, spacecraft, onClose, onSent }) {
  const [catalog, setCatalog] = useState({})
  const [impact, setImpact] = useState(null)
  const [damages, setDamages] = useState([emptyRow()])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !spacecraft) return
    setDamages([emptyRow()])
    setNotice('')
    setLoading(true)
    Promise.all([spacecraftApi.getDamageCatalog(), spacecraftApi.getRepairImpact(spacecraft.id)])
      .then(([catalogData, impactData]) => {
        setCatalog(catalogData)
        setImpact(impactData)
      })
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }, [open, spacecraft])

  if (!open) return null

  function updateRow(index, field, value) {
    setDamages((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        if (field === 'category') return { category: value, subtype: '' }
        return { ...row, [field]: value }
      })
    )
  }

  function addRow() {
    setDamages((prev) => [...prev, emptyRow()])
  }

  function removeRow(index) {
    setDamages((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit = damages.length > 0 && damages.every((d) => d.category && d.subtype)

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    setNotice('')
    try {
      await spacecraftApi.sendToTaller(spacecraft.id, damages)
      onSent?.(spacecraft.name)
    } catch (err) {
      setNotice(err.message)
    } finally {
      setSaving(false)
    }
  }

  const hasTicketsToCancel = (impact?.totalTicketsToCancel ?? 0) > 0
  const hasClosures = (impact?.museumSchedulesToClose ?? 0) > 0 || (impact?.theaterEventsToClose ?? 0) > 0

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
        <h2>🔧 Enviar al taller — {spacecraft?.name}</h2>
        <p className="schedule-hint schedule-hint-top">
          Elige uno o más daños. Mientras esté en el taller, esta nave no podrá tener nuevos horarios de
          museo ni funciones de teatro.
        </p>

        {notice && <p className="field-error">{notice}</p>}
        {loading && <p className="schedule-hint">Cargando…</p>}

        {!loading && (
          <>
            {hasTicketsToCancel && (
              <div className="impact-warning impact-warning-danger">
                ⚠ Esto cancelará <strong>{impact.totalTicketsToCancel}</strong> entrada
                {impact.totalTicketsToCancel === 1 ? '' : 's'} activa
                {impact.totalTicketsToCancel === 1 ? '' : 's'} ({impact.museumTicketsToCancel} de museo,{' '}
                {impact.theaterTicketsToCancel} de teatro) y cerrará {impact.museumSchedulesToClose} horario
                {impact.museumSchedulesToClose === 1 ? '' : 's'} de museo y {impact.theaterEventsToClose}{' '}
                función{impact.theaterEventsToClose === 1 ? '' : 'es'} de teatro.
              </div>
            )}
            {!hasTicketsToCancel && hasClosures && (
              <div className="impact-warning">
                Se cerrarán {impact.museumSchedulesToClose} horario{impact.museumSchedulesToClose === 1 ? '' : 's'} de
                museo y {impact.theaterEventsToClose} función{impact.theaterEventsToClose === 1 ? '' : 'es'} de teatro
                (sin entradas vendidas).
              </div>
            )}

            <div className="damage-row-list">
              {damages.map((row, index) => {
                const subtypes = row.category ? catalog[row.category]?.subtypes ?? [] : []
                return (
                  <div className="damage-row" key={index}>
                    <label className="field">
                      <span>Categoría</span>
                      <select value={row.category} onChange={(e) => updateRow(index, 'category', e.target.value)}>
                        <option value="">Selecciona…</option>
                        {Object.entries(catalog).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Daño</span>
                      <select
                        value={row.subtype}
                        onChange={(e) => updateRow(index, 'subtype', e.target.value)}
                        disabled={!row.category}
                      >
                        <option value="">{row.category ? 'Selecciona…' : '— elige categoría primero —'}</option>
                        {subtypes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="btn-icon btn-icon-danger damage-row-remove"
                      onClick={() => removeRow(index)}
                      disabled={damages.length === 1 || saving}
                      aria-label="Quitar este daño"
                    >
                      🗑
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="modal-actions modal-actions-left">
              <button type="button" className="btn btn-ghost btn-schedule" onClick={addRow} disabled={saving}>
                + Agregar otro daño
              </button>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={handleSubmit} disabled={!canSubmit || saving || loading}>
            {saving ? 'Enviando…' : '🔧 Enviar a taller'}
          </button>
        </div>
      </div>
    </div>
  )
}
