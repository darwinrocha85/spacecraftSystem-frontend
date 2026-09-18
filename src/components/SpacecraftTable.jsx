import { isOperativa, statusLabel } from '../constants/repairStatus'

const SORTABLE_COLUMNS = [
  { field: 'name', label: 'Nombre' },
  { field: 'franchise', label: 'Franquicia' },
  { field: 'spacecraftType', label: 'Tipo' },
  { field: 'crewCapacity', label: 'Tripulación' },
  { field: 'speed', label: 'Velocidad' },
]

function SortIcon({ active, direction }) {
  if (!active) return <span className="sort-icon idle">↕</span>
  return <span className="sort-icon active">{direction === 'asc' ? '↑' : '↓'}</span>
}

export default function SpacecraftTable({
  items,
  loading,
  sortBy,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onShowMuseumSales,
  onShowTheaterSales,
  onShowRepairHistory,
  onShowWorkshopStatus,
  onShowDashboard,
}) {
  if (loading) {
    return (
      <div className="table-state">
        <div className="spinner" aria-hidden="true" />
        <p>Escaneando la flota…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="table-state">
        <p className="empty-icon" aria-hidden="true">🌌</p>
        <p>No se encontraron naves. Prueba con otro término o registra una nueva.</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="spacecraft-table">
        <thead>
          <tr>
            {SORTABLE_COLUMNS.map((col) => (
              <th
                key={col.field}
                className={['spacecraftType', 'crewCapacity', 'speed'].includes(col.field) ? 'col-optional' : ''}
              >
                <button
                  type="button"
                  className="sort-button"
                  onClick={() => onSort(col.field)}
                >
                  {col.label} <SortIcon active={sortBy === col.field} direction={sortDirection} />
                </button>
              </th>
            ))}
            <th className="col-optional">Armamento</th>
            <th>Recinto</th>
            <th>Estado</th>
            <th className="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td className="col-name">{s.name}</td>
              <td>
                <span className="franchise-badge">{s.franchise}</span>
              </td>
              <td className="col-optional">{s.spacecraftType || '—'}</td>
              <td className="col-optional">{s.crewCapacity ?? '—'}</td>
              <td className="col-optional">{s.speed != null ? `${s.speed}` : '—'}</td>
              <td className="col-optional">
                <span className={`armed-badge ${s.isArmed ? 'armed' : 'unarmed'}`}>
                  {s.isArmed ? '⚔ Armada' : '☮ Desarmada'}
                </span>
              </td>
              <td>
                <div className="venue-badge-group">
                  {s.isMuseum && (
                    <button
                      type="button"
                      className="venue-badge venue-museum venue-badge-clickable"
                      onClick={() => onShowMuseumSales(s)}
                      title="Ver entradas vendidas de museo"
                    >
                      🏛 Museo
                    </button>
                  )}
                  {s.isTheater && (
                    <button
                      type="button"
                      className="venue-badge venue-theater venue-badge-clickable"
                      onClick={() => onShowTheaterSales(s)}
                      title="Ver entradas vendidas de teatro"
                    >
                      🎭 Teatro
                    </button>
                  )}
                  {!s.isMuseum && !s.isTheater && <span className="venue-badge venue-none">—</span>}
                </div>
              </td>
              <td>
                {isOperativa(s.status) ? (
                  <button
                    type="button"
                    className={`status-badge status-badge-clickable status-${(s.status || 'OPERATIVA').toLowerCase()}`}
                    onClick={() => onShowRepairHistory(s)}
                    title="Ver historial de taller"
                  >
                    {statusLabel(s.status)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`status-badge status-badge-clickable status-${(s.status || 'OPERATIVA').toLowerCase()}`}
                    onClick={() => onShowWorkshopStatus(s)}
                    title="Ver estado en el taller"
                  >
                    {statusLabel(s.status)}
                  </button>
                )}
              </td>
              <td className="col-actions">
                <button
                  className="btn-icon"
                  onClick={() => onShowDashboard(s)}
                  aria-label={`Ver dashboard de ${s.name}`}
                  title="Ver dashboard de esta nave"
                >
                  📊
                </button>
                <button
                  className="btn-icon"
                  onClick={() => onEdit(s)}
                  aria-label={`Editar ${s.name}`}
                  disabled={!isOperativa(s.status)}
                  title={isOperativa(s.status) ? `Editar ${s.name}` : 'No se puede editar: nave en taller'}
                >
                  ✎
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => onDelete(s)}
                  aria-label={`Eliminar ${s.name}`}
                  disabled={!isOperativa(s.status)}
                  title={isOperativa(s.status) ? `Eliminar ${s.name}` : 'No se puede eliminar: nave en taller'}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
