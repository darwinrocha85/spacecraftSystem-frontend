export default function Header({ totalElements, view, onViewChange, onNewSpacecraft }) {
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

      <div className="header-actions">
        <nav className="view-toggle" aria-label="Vista">
          <button
            type="button"
            className={`view-toggle-button${view === 'fleet' ? ' view-toggle-active' : ''}`}
            onClick={() => onViewChange('fleet')}
          >
            🛰️ Flota
          </button>
          <button
            type="button"
            className={`view-toggle-button${view === 'dashboard' ? ' view-toggle-active' : ''}`}
            onClick={() => onViewChange('dashboard')}
          >
            📊 Dashboard
          </button>
        </nav>

        {view === 'fleet' && (
          <button className="btn btn-primary" onClick={onNewSpacecraft}>
            <span aria-hidden="true">+</span> Nueva nave
          </button>
        )}
      </div>
    </header>
  )
}
