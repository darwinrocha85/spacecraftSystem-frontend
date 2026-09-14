import axios from 'axios'

// Base URL configurable por variable de entorno (ver .env.example), pero el propio
// modo de Vite ya distingue el entorno sin depender de que exista un .env: en `npm run dev`
// (import.meta.env.DEV) usa el backend local, en `npm run build` (producción) usa Render.
// Un VITE_API_URL explícito (.env.local, variable de entorno en CI, etc.) siempre gana.
const DEFAULT_API_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api'
  : 'https://spacecraftsystem.onrender.com/api'
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL

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

  async getVenues(type) {
    try {
      const { data } = await client.get('/spacecrafts/venues', { params: type ? { type } : {} })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getMuseumSchedule(spacecraftId) {
    try {
      const { data } = await client.get('/museum-schedules', { params: { spacecraftId } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async saveMuseumScheduleDay(payload) {
    try {
      const { data } = await client.post('/museum-schedules', payload)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async listTheaterEvents(spacecraftId) {
    try {
      const { data } = await client.get('/theater-events', { params: { spacecraftId } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async createTheaterEvent(payload) {
    try {
      const { data } = await client.post('/theater-events', payload)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async updateTheaterEvent(id, payload) {
    try {
      const { data } = await client.put(`/theater-events/${id}`, payload)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async deleteTheaterEvent(id) {
    try {
      await client.delete(`/theater-events/${id}`)
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getMuseumAvailability(spacecraftId, date) {
    try {
      const { data } = await client.get(`/museum/${spacecraftId}/availability`, { params: { date } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getTheaterEventSales(eventId) {
    try {
      const { data } = await client.get(`/theater-events/${eventId}/sales`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },
}

export default spacecraftApi
