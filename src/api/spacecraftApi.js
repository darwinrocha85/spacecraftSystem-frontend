import axios from 'axios'

// Base URL configurable por variable de entorno (ver .env.example).
// Por defecto apunta al backend spacecraftSystem corriendo local.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Normaliza los errores de axios/backend a un mensaje legible,
// reutilizando el "message" que devuelve GlobalExceptionHandler cuando existe.
function toFriendlyError(error) {
  if (error.response) {
    const backendMessage = error.response.data?.message
    const err = new Error(backendMessage || `Error ${error.response.status} del servidor`)
    err.status = error.response.status
    return err
  }
  if (error.request) {
    return new Error(
      'No se pudo contactar al backend. ¿Está corriendo en ' + API_URL + '?'
    )
  }
  return error
}

// Adapta la respuesta paginada de Spring Data (Page<Spacecraft>) a una forma simple.
function adaptPage(data) {
  return {
    items: data.content ?? [],
    page: data.number ?? 0,
    size: data.size ?? data.content?.length ?? 0,
    totalPages: data.totalPages ?? 0,
    totalElements: data.totalElements ?? data.content?.length ?? 0,
    first: data.first ?? true,
    last: data.last ?? true,
  }
}

export const spacecraftApi = {
  async getAll() {
    try {
      const { data } = await client.get('/spacecrafts')
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getPage({ page = 0, size = 10, sortBy = 'id', sortDirection = 'asc' } = {}) {
    try {
      const { data } = await client.get('/spacecrafts/page', {
        params: { page, size, sortBy, sortDirection },
      })
      return adaptPage(data)
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async search({ name, page = 0, size = 10, sortBy = 'id', sortDirection = 'asc' }) {
    try {
      const { data } = await client.get('/spacecrafts/search', {
        params: { name, page, size, sortBy, sortDirection },
      })
      return adaptPage(data)
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getById(id) {
    try {
      const { data } = await client.get(`/spacecrafts/${id}`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async create(spacecraft) {
    try {
      const { data } = await client.post('/spacecrafts', spacecraft)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async update(id, spacecraft) {
    try {
      const { data } = await client.put(`/spacecrafts/${id}`, spacecraft)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async remove(id) {
    try {
      await client.delete(`/spacecrafts/${id}`)
    } catch (error) {
      throw toFriendlyError(error)
    }
  },
}

export default spacecraftApi
