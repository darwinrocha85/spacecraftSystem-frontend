export default function Header({ totalElements, onNewSpacecraft }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">🛰️</span>
        <div>
          <h1>Spacecraft Command</h1>
          <p className="brand-subtitle">
            Registro de naves interestelares · {totalElements} nave{totalElements === 1 ? '' : 's'} en la flota
          </p>
        </div>
      </div>
      <button className="btn btn-primary" onClick={onNewSpacecraft}>
        <span aria-hidden="true">+</span> Nueva nave
      </button>
    </header>
  )
}
