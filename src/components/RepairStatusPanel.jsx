import { useCallback, useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'
import BudgetApprovalModal from './BudgetApprovalModal'
import ReceiveShipButton from './ReceiveShipButton'
import { repairStatusLabel } from '../constants/repairStatus'

// Fase 1: reemplaza el badge estático que antes decía "se gestiona desde la app de taller".
// Ahora el dueño de la flota ve en vivo el estado fino de la reparación (viene del backend de
// taller en Python) y puede actuar: aprobar/rechazar presupuesto, o recibir la nave cuando el
// taller la deja lista.
export default function RepairStatusPanel({ spacecraftId, onReceived }) {
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [showBudget, setShowBudget] = useState(false)

  const load = useCallback(() => {
    setNotice('')
    setLoading(true)
    spacecraftApi
      .getActiveRepair(spacecraftId)
      .then(setRepair)
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }, [spacecraftId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="schedule-hint">Consultando el estado en el taller…</p>
  if (notice) return <p className="field-error">{notice}</p>

  if (!repair) {
    return (
      <p className="schedule-hint">
        No hay ninguna reparación activa registrada en el taller para esta nave todavía.
      </p>
    )
  }

  const needsBudgetDecision = repair.status === 'ESPERANDO_APROBACION_PRESUPUESTO'
  const readyToReceive = repair.status === 'LISTA_PARA_SALIR'

  return (
    <div className="repair-status-panel">
      <span className={`status-badge status-${repair.status.toLowerCase()}`}>
        {repairStatusLabel(repair.status)}
      </span>

      {repair.damages?.length > 0 && (
        <div className="damage-chip-list">
          {repair.damages.map((d, i) => (
            <span className="damage-chip" key={i}>
              {d.subtype}
            </span>
          ))}
        </div>
      )}

      {needsBudgetDecision && (
        <button type="button" className="btn btn-ghost btn-schedule" onClick={() => setShowBudget(true)}>
          💰 Ver presupuesto
        </button>
      )}

      {readyToReceive && (
        <ReceiveShipButton
          repairId={repair.id}
          spacecraftId={spacecraftId}
          onReceived={() => {
            load()
            onReceived?.()
          }}
        />
      )}

      {!needsBudgetDecision && !readyToReceive && (
        <p className="schedule-hint">El taller está trabajando en tu nave.</p>
      )}

      <BudgetApprovalModal
        open={showBudget}
        repairId={repair.id}
        onClose={() => setShowBudget(false)}
        onDecided={() => {
          setShowBudget(false)
          load()
        }}
      />
    </div>
  )
}
