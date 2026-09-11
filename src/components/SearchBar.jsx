import { useEffect, useState } from 'react'

// Búsqueda por nombre con "debounce" para no golpear /search en cada tecla.
export default function SearchBar({ value, onSearch }) {
  const [term, setTerm] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => {
      if (term !== value) onSearch(term)
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        placeholder="Buscar nave por nombre… (ej. Millennium Falcon)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Buscar nave por nombre"
      />
      {term && (
        <button
          type="button"
          className="search-clear"
          onClick={() => setTerm('')}
          aria-label="Limpiar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  )
}
