import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'
import { statusLabel } from '../constants/repairStatus'
import { formatMoney, formatPercent } from '../utils/format'
import TicketDetailModal from './TicketDetailModal'

// Fase 6: mismos KPIs que el dashboard general, acotados a una nave puntual (se abre desde el
// botón 📊 de la tabla, mismo patrón que MuseumSalesModal/RepairHistoryModal).
export default function SpacecraftDashboardModal({ open, spacecraft, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTicketDetail, setShowTicketDetail] = useState(false)

  useEffect(() => {
    if (!open || !spacecraft) return
    setData(null)
    setError('')
    setShowTicketDetail(false)
    setLoading(true)
    spacecraftApi
      .getSpacecraftDashboard(spacecraft.id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [open, spacecraft])

  if (!open) return null

  const activeTicketsTotal = data ? data.tickets.activeMuseum + data.tickets.activeTheater : 0
  const cancelledTicketsTotal = data ? data.tickets.cancelledMuseum + data.tickets.cancelledTheater : 0

  return (
    <>
      <div
        className="modal-overlay modal-overlay-top"
        role="presentation"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <div className="modal-card dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
          <h2>Dashboard — {spacecraft?.name}</h2>

        {loading && <p className="schedule-hint">Calculando métricas…</p>}
        {error && <p className="field-error">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="kpi-grid kpi-grid-compact">
              <div className="kpi-tile kpi-tile-accent">
                <span className="kpi-value">{formatMoney(data.revenue.total)}</span>
                <span className="kpi-label">Ingresos totales</span>
                <span className="kpi-sub">
                  Museo {formatMoney(data.revenue.museum)} · Teatro {formatMoney(data.revenue.theater)}
                </span>
              </div>

              {data.isMuseum && (
                <div className="kpi-tile">
                  <span className="kpi-value">{formatPercent(data.occupancy.museumPercent)}</span>
                  <span className="kpi-label">Ocupación hoy (museo)</span>
                  <span className="kpi-sub">
                    {data.occupancy.museumReservedToday}/{data.occupancy.museumCapacityToday} cupos
                  </span>
                </div>
              )}

              {data.isTheater && (
                <div className="kpi-tile">
                  <span className="kpi-value">{formatPercent(data.occupancy.theaterPercent)}</span>
                  <span className="kpi-label">Ocupación hoy (teatro)</span>
                  <span className="kpi-sub">
                    {data.occupancy.theaterSeatsSoldToday}/{data.occupancy.theaterSeatsAvailableToday} asientos
                  </span>
                </div>
              )}

              <button
                type="button"
                className="kpi-tile kpi-tile-clickable"
                onClick={() => setShowTicketDetail(true)}
              >
                <span className="kpi-value">{activeTicketsTotal}</span>
                <span className="kpi-label">Entradas activas</span>
                <span className="kpi-sub">
                  {cancelledTicketsTotal} cancelada{cancelledTicketsTotal === 1 ? '' : 's'}
                </span>
                <span className="kpi-hint">Ver detalle →</span>
              </button>
            </div>

            <div className="dashboard-repairs-summary">
              <span className={`status-badge status-${(data.status || 'OPERATIVA').toLowerCase()}`}>
                {statusLabel(data.status)}
              </span>
              <span className="dashboard-total-hint">
                {data.repairs.totalVisits} visita{data.repairs.totalVisits === 1 ? '' : 's'} al taller en total
              </span>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      </div>

      <TicketDetailModal
        open={showTicketDetail}
        spacecraftId={spacecraft?.id}
        title={spacecraft?.name}
        onClose={() => setShowTicketDetail(false)}
      />
    </>
  )
}
