import { useCallback, useEffect, useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

const PAGE_SIZE = 8

// Encapsula toda la lógica de datos: listado paginado, búsqueda por nombre,
// orden, y las operaciones de alta/edición/borrado con recarga automática.
export function useSpacecrafts() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, size: PAGE_SIZE, sortBy, sortDirection }
      const result = searchTerm.trim()
        ? await spacecraftApi.search({ ...params, name: searchTerm.trim() })
        : await spacecraftApi.getPage(params)

      setItems(result.items)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)

      // Si tras borrar/filtrar la página actual queda vacía pero hay páginas antes, retrocede.
      if (result.items.length === 0 && page > 0 && result.totalPages > 0 && page >= result.totalPages) {
        setPage(result.totalPages - 1)
      }
    } catch (err) {
      setError(err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDirection, searchTerm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const search = useCallback((term) => {
    setSearchTerm(term)
    setPage(0)
  }, [])

  const toggleSort = useCallback((field) => {
    setPage(0)
    setSortBy((currentField) => {
      if (currentField === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'))
        return currentField
      }
      setSortDirection('asc')
      return field
    })
  }, [])

  const createSpacecraft = useCallback(async (payload) => {
    await spacecraftApi.create(payload)
    await fetchData()
  }, [fetchData])

  const updateSpacecraft = useCallback(async (id, payload) => {
    await spacecraftApi.update(id, payload)
    await fetchData()
  }, [fetchData])

  const deleteSpacecraft = useCallback(async (id) => {
    await spacecraftApi.remove(id)
    await fetchData()
  }, [fetchData])

  return {
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
    refetch: fetchData,
    createSpacecraft,
    updateSpacecraft,
    deleteSpacecraft,
  }
}

export default useSpacecrafts
