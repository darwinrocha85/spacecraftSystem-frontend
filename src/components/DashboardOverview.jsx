import { useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'
import { statusLabel } from '../constants/repairStatus'
import { formatMoney, formatPercent } from '../utils/format'
import TicketDetailModal from './TicketDetailModal'

// Fase 6: KPIs generales de toda la flota — ingresos, ocupación de hoy, entradas activas,
// estado de la flota y top naves por ingresos.
export default function DashboardOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTicketDetail, setShowTicketDetail] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    spacecraftApi
      .getDashboardOverview()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="table-state">
        <div className="spinner" aria-hidden="true" />
        <p>Calculando métricas de la flota…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inline-error" role="alert">
        ⚠ {error}
      </div>
    )
  }

  if (!data) return null

  const { fleet, revenue, tickets, occupancy, topSpacecraftsByRevenue } = data
  const activeTicketsTotal = tickets.activeMuseum + tickets.activeTheater
  const cancelledTicketsTotal = tickets.cancelledMuseum + tickets.cancelledTheater

  return (
    <div className="dashboard">
      <section className="kpi-grid">
        <div className="kpi-tile kpi-tile-accent">
          <span className="kpi-value">{formatMoney(revenue.total)}</span>
          <span className="kpi-label">Ingresos totales</span>
          <span className="kpi-sub">
            Museo {formatMoney(revenue.museum)} · Teatro {formatMoney(revenue.theater)}
          </span>
        </div>

        <div className="kpi-tile">
          <span className="kpi-value">{formatPercent(occupancy.museumPercent)}</span>
          <span className="kpi-label">Ocupación de museos hoy</span>
          <span className="kpi-sub">
            {occupancy.museumReservedToday}/{occupancy.museumCapacityToday} cupos reservados
          </span>
        </div>

        <div className="kpi-tile">
          <span className="kpi-value">{formatPercent(occupancy.theaterPercent)}</span>
          <span className="kpi-label">Ocupación de teatro hoy</span>
          <span className="kpi-sub">
            {occupancy.theaterSeatsSoldToday}/{occupancy.theaterSeatsAvailableToday} asientos ·{' '}
            {occupancy.eventsToday} función{occupancy.eventsToday === 1 ? '' : 'es'} hoy
          </span>
        </div>

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
      </section>

      <TicketDetailModal
        open={showTicketDetail}
        spacecraftId={null}
        onClose={() => setShowTicketDetail(false)}
      />

      <section className="dashboard-section">
        <h2>Estado de la flota</h2>
        <div className="fleet-status-grid">
          {Object.entries(fleet.byStatus).map(([status, count]) => (
            <div key={status} className="fleet-status-chip-row">
              <span className={`status-badge status-${status.toLowerCase()}`}>{statusLabel(status)}</span>
              <span className="fleet-status-count">{count}</span>
            </div>
          ))}
        </div>
        <p className="dashboard-total-hint">
          {fleet.total} nave{fleet.total === 1 ? '' : 's'} en total
        </p>
      </section>

      <section className="dashboard-section">
        <h2>Top naves por ingresos</h2>
        {topSpacecraftsByRevenue.length === 0 ? (
          <p className="schedule-hint">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="top-ships-list">
            {topSpacecraftsByRevenue.map((ship, index) => (
              <div key={ship.spacecraftId} className="top-ship-row">
                <span className="top-ship-rank">#{index + 1}</span>
                <div className="top-ship-info">
                  <span className="top-ship-name">{ship.name}</span>
                  <span className="franchise-badge">{ship.franchise}</span>
                </div>
                <span className="top-ship-revenue">{formatMoney(ship.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
