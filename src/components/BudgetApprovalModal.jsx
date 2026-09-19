import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

// Fase 3: el dueño de la flota ve el presupuesto que armó el taller y decide. Aprobar cobra
// directo contra BankIn desde el backend de taller (spacecraftSystem no interviene en el cobro).
// Rechazar libera al taller para armar un segundo presupuesto.
export default function BudgetApprovalModal({ open, repairId, onClose, onDecided }) {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cardId, setCardId] = useState('')
  const [deciding, setDeciding] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open || !repairId) return
    setNotice('')
    setCardId('')
    setLoading(true)
    spacecraftApi
      .getBudgets(repairId)
      .then((budgets) => {
        const pending = budgets.find((b) => b.status === 'PENDIENTE') ?? budgets[budgets.length - 1] ?? null
        setBudget(pending)
      })
      .catch((err) => setNotice(err.message))
      .finally(() => setLoading(false))
  }, [open, repairId])

  if (!open) return null

  const isPending = budget?.status === 'PENDIENTE'

  async function handleApprove() {
    if (!cardId.trim()) return
    setDeciding(true)
    setNotice('')
    try {
      await spacecraftApi.approveBudget(repairId, budget.id, cardId.trim())
      onDecided?.()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setDeciding(false)
    }
  }

  async function handleReject() {
    setDeciding(true)
    setNotice('')
    try {
      await spacecraftApi.rejectBudget(repairId, budget.id)
      onDecided?.()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setDeciding(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        e.stopPropagation()
        if (!deciding) onClose()
      }}
    >
      <div className="modal-card schedule-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>💰 Presupuesto del taller</h2>

        {notice && <p className="field-error">{notice}</p>}
        {loading && <p className="schedule-hint">Cargando presupuesto…</p>}

        {!loading && !budget && (
          <p className="schedule-hint">No hay ningún presupuesto para esta reparación todavía.</p>
        )}

        {!loading && budget && (
          <>
            <div className="budget-parts-list">
              {budget.lineItems.map((item) => (
                <div className="budget-part-row" key={item.id}>
                  <span className="budget-part-name">
                    {item.sparePartName} × {item.quantity}
                  </span>
                  <span className="budget-part-price">{item.subtotal.toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <p className="budget-total">
              Total: <strong>{budget.totalAmount.toFixed(2)} €</strong>
            </p>

            {isPending ? (
              <label className="field">
                <span>Número de tarjeta (BankIn)</span>
                <input
                  type="text"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  placeholder="Ej. 4111111111111111"
                  disabled={deciding}
                />
              </label>
            ) : (
              <p className="schedule-hint">
                Este presupuesto ya fue {budget.status === 'APROBADO' ? 'aprobado y cobrado' : 'rechazado'}.
              </p>
            )}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deciding}>
            Cerrar
          </button>
          {isPending && (
            <>
              <button type="button" className="btn btn-danger" onClick={handleReject} disabled={deciding}>
                Rechazar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={deciding || !cardId.trim()}
              >
                {deciding ? 'Procesando…' : 'Aprobar y cobrar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
