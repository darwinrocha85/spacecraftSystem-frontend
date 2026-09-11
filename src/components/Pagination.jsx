export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const canPrev = page > 0
  const canNext = page < totalPages - 1

  // Ventana corta de páginas alrededor de la actual para no saturar la UI.
  const pages = []
  const start = Math.max(0, page - 2)
  const end = Math.min(totalPages - 1, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav className="pagination" aria-label="Paginación de naves">
      <button disabled={!canPrev} onClick={() => onPageChange(0)} aria-label="Primera página">
        «
      </button>
      <button disabled={!canPrev} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">
        ‹
      </button>

      {start > 0 && <span className="pagination-ellipsis">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? 'active' : ''}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p + 1}
        </button>
      ))}
      {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}

      <button disabled={!canNext} onClick={() => onPageChange(page + 1)} aria-label="Página siguiente">
        ›
      </button>
      <button disabled={!canNext} onClick={() => onPageChange(totalPages - 1)} aria-label="Última página">
        »
      </button>
    </nav>
  )
}
