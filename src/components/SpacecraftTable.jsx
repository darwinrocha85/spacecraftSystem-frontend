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
              <th key={col.field}>
                <button
                  type="button"
                  className="sort-button"
                  onClick={() => onSort(col.field)}
                >
                  {col.label} <SortIcon active={sortBy === col.field} direction={sortDirection} />
                </button>
              </th>
            ))}
            <th>Armamento</th>
            <th>Recinto</th>
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
              <td>{s.spacecraftType || '—'}</td>
              <td>{s.crewCapacity ?? '—'}</td>
              <td>{s.speed != null ? `${s.speed}` : '—'}</td>
              <td>
                <span className={`armed-badge ${s.isArmed ? 'armed' : 'unarmed'}`}>
                  {s.isArmed ? '⚔ Armada' : '☮ Desarmada'}
                </span>
              </td>
              <td>
                {s.isMuseum && <span className="venue-badge venue-museum">🏛 Museo</span>}
                {s.isTheater && <span className="venue-badge venue-theater">🎭 Teatro</span>}
                {!s.isMuseum && !s.isTheater && <span className="venue-badge venue-none">—</span>}
              </td>
              <td className="col-actions">
                <button className="btn-icon" onClick={() => onEdit(s)} aria-label={`Editar ${s.name}`}>
                  ✎
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => onDelete(s)}
                  aria-label={`Eliminar ${s.name}`}
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
