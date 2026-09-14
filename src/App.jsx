import { useState } from 'react'
import Starfield from './components/Starfield'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SpacecraftTable from './components/SpacecraftTable'
import Pagination from './components/Pagination'
import SpacecraftForm from './components/SpacecraftForm'
import ConfirmDialog from './components/ConfirmDialog'
import Toast from './components/Toast'
import MuseumSalesModal from './components/MuseumSalesModal'
import TheaterSalesModal from './components/TheaterSalesModal'
import RepairHistoryModal from './components/RepairHistoryModal'
import useSpacecrafts from './hooks/useSpacecrafts'

export default function App() {
  const {
    items,
    page,
    setPage,
    totalPages,
    totalElements,
    sortBy,
    sortDirection,
    toggleSort,
    searchTerm,
    search,
    loading,
    error,
    createSpacecraft,
    updateSpacecraft,
    deleteSpacecraft,
    refetch,
  } = useSpacecrafts()

  const [formOpen, setFormOpen] = useState(false)
  const [editingSpacecraft, setEditingSpacecraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState(null) // { message, type }

  const [museumSalesTarget, setMuseumSalesTarget] = useState(null)
  const [theaterSalesTarget, setTheaterSalesTarget] = useState(null)
  const [repairHistoryTarget, setRepairHistoryTarget] = useState(null)

  function openCreateForm() {
    setEditingSpacecraft(null)
    setFormOpen(true)
  }

  function openEditForm(spacecraft) {
    setEditingSpacecraft(spacecraft)
    setFormOpen(true)
  }

  function closeForm() {
    if (saving) return
    setFormOpen(false)
    setEditingSpacecraft(null)
  }

  async function handleSubmitForm(payload) {
    setSaving(true)
    try {
      if (editingSpacecraft) {
        await updateSpacecraft(editingSpacecraft.id, payload)
        setToast({ message: `"${payload.name}" actualizada correctamente.`, type: 'success' })
      } else {
        await createSpacecraft(payload)
        setToast({ message: `"${payload.name}" añadida a la flota.`, type: 'success' })
      }
      setFormOpen(false)
      setEditingSpacecraft(null)
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSentToTaller(name) {
    setFormOpen(false)
    setEditingSpacecraft(null)
    setToast({ message: `"${name}" fue enviada al taller.`, type: 'success' })
    await refetch()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSpacecraft(deleteTarget.id)
      setToast({ message: `"${deleteTarget.name}" fue eliminada.`, type: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="app-shell">
      <Starfield />

      <main className="app-content">
        <Header totalElements={totalElements} onNewSpacecraft={openCreateForm} />

        <div className="toolbar">
          <SearchBar value={searchTerm} onSearch={search} />
        </div>

        {error && (
          <div className="inline-error" role="alert">
            ⚠ {error}
          </div>
        )}

        <SpacecraftTable
          items={items}
          loading={loading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={toggleSort}
          onEdit={openEditForm}
          onDelete={setDeleteTarget}
          onShowMuseumSales={setMuseumSalesTarget}
          onShowTheaterSales={setTheaterSalesTarget}
          onShowRepairHistory={setRepairHistoryTarget}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <SpacecraftForm
        open={formOpen}
        spacecraft={editingSpacecraft}
        saving={saving}
        onSubmit={handleSubmitForm}
        onCancel={closeForm}
        onSentToTaller={handleSentToTaller}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar nave"
        message={
          deleteTarget
            ? `¿Seguro que quieres eliminar "${deleteTarget.name}" de la flota? Esta acción no se puede deshacer.`
            : ''
        }
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <MuseumSalesModal
        open={Boolean(museumSalesTarget)}
        spacecraft={museumSalesTarget}
        onClose={() => setMuseumSalesTarget(null)}
      />

      <TheaterSalesModal
        open={Boolean(theaterSalesTarget)}
        spacecraft={theaterSalesTarget}
        onClose={() => setTheaterSalesTarget(null)}
      />

      <RepairHistoryModal
        open={Boolean(repairHistoryTarget)}
        spacecraft={repairHistoryTarget}
        onClose={() => setRepairHistoryTarget(null)}
      />
    </div>
  )
}
