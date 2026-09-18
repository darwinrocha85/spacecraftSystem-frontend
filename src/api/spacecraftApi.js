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

// Fase 1 (extracción del taller a backend Python): el detalle fino de la reparación (estado,
// presupuestos, stock de repuestos) ahora vive en spacecraft-taller-backend, un servicio propio
// que este panel admin consulta directo (el dueño de la flota aprueba/rechaza presupuestos y
// recibe la nave sin pasar por Java para eso).
const DEFAULT_TALLER_API_URL = import.meta.env.DEV
  ? 'http://localhost:8001/api'
  : 'https://spacecraft-taller-backend.onrender.com/api'
const TALLER_API_URL = import.meta.env.VITE_TALLER_API_URL || DEFAULT_TALLER_API_URL

const tallerClient = axios.create({
  baseURL: TALLER_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Normaliza los errores de axios/backend a un mensaje legible. Java devuelve {"message": ...}
// (GlobalExceptionHandler), el backend de taller (Python/FastAPI) devuelve {"detail": ...} -
// se soportan ambos formatos según cuál backend haya respondido.
function toFriendlyError(error, apiUrl = API_URL) {
  if (error.response) {
    const backendMessage = error.response.data?.message || error.response.data?.detail
    const err = new Error(backendMessage || `Error ${error.response.status} del servidor`)
    err.status = error.response.status
    return err
  }
  if (error.request) {
    return new Error('No se pudo contactar al backend. ¿Está corriendo en ' + apiUrl + '?')
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

  // --- Taller: catálogo y envío (spacecraftSystem sigue orquestando el envío) ---

  // Fase 1: el catálogo de daños ahora vive en el backend de taller (Python), no en Java.
  async getDamageCatalog() {
    try {
      const { data } = await tallerClient.get('/catalog/damages')
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  // Cuántas entradas se cancelarían y cuántos horarios/funciones se cerrarían si se envía
  // esta nave al taller ahora (para el popup de confirmación antes de enviar) — sigue en Java,
  // es solo una vista previa sobre datos que Java ya tiene (entradas/horarios propios).
  async getRepairImpact(spacecraftId) {
    try {
      const { data } = await client.get(`/spacecrafts/${spacecraftId}/repairs/impact`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // Envía la nave al taller con los daños elegidos: [{ category, subtype }, ...]. Java cancela
  // entradas/horarios y avisa al backend de taller para que abra la reparación (queda "ENVIADA"
  // hasta que el taller confirme la recepción).
  async sendToTaller(spacecraftId, damages) {
    try {
      const { data } = await client.post(`/spacecrafts/${spacecraftId}/repairs`, { damages })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // El dueño de la flota confirma que retiró la nave del taller: Java vuelve a marcarla
  // OPERATIVA. Idempotente. Se llama después de receiveShipFromTaller() (que cierra el lado
  // del taller) — ver ReceiveShipButton.
  async confirmShipOperational(spacecraftId) {
    try {
      const { data } = await client.post(`/spacecrafts/${spacecraftId}/repairs/current/receive`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // --- Taller: estado detallado, presupuestos y recepción (todo esto vive en Python) ---

  // Historial completo de reparaciones de una nave (incluye la activa, si está en el taller).
  async getRepairsForSpacecraft(spacecraftId) {
    try {
      const { data } = await tallerClient.get('/repairs', { params: { spacecraftId } })
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  // Reparación activa de una nave (estado != ENTREGADA), o null si no hay ninguna abierta.
  async getActiveRepair(spacecraftId) {
    try {
      const { data } = await tallerClient.get('/repairs/active', { params: { spacecraftId } })
      return data
    } catch (error) {
      if (error.response?.status === 404) return null
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  async getRepairDetail(repairId) {
    try {
      const { data } = await tallerClient.get(`/repairs/${repairId}`)
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  async getBudgets(repairId) {
    try {
      const { data } = await tallerClient.get(`/repairs/${repairId}/budgets`)
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  // Aprueba un presupuesto: el backend de taller cobra directo a BankIn con esta tarjeta.
  async approveBudget(repairId, budgetId, cardId) {
    try {
      const { data } = await tallerClient.post(`/repairs/${repairId}/budgets/${budgetId}/approve`, {
        cardId,
      })
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  async rejectBudget(repairId, budgetId) {
    try {
      const { data } = await tallerClient.post(`/repairs/${repairId}/budgets/${budgetId}/reject`)
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  // Cierra el lado del taller (Python): reparación → ENTREGADA. Idempotente. Se llama antes de
  // confirmShipOperational() — ver ReceiveShipButton.
  async receiveShipFromTaller(repairId) {
    try {
      const { data } = await tallerClient.post(`/repairs/${repairId}/receive`)
      return data
    } catch (error) {
      throw toFriendlyError(error, TALLER_API_URL)
    }
  },

  // Fase 6: KPIs generales de toda la flota (ingresos, tickets, ocupación de hoy, estado de
  // flota, top naves por ingresos)
  async getDashboardOverview() {
    try {
      const { data } = await client.get('/dashboard/overview')
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // Fase 6: mismos KPIs pero acotados a una nave puntual, más su historial de reparaciones
  async getSpacecraftDashboard(spacecraftId) {
    try {
      const { data } = await client.get(`/dashboard/spacecrafts/${spacecraftId}`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // Fase 6 (fix): detalle de entradas activas (fecha/hora, comprador, código, costo). Sin
  // spacecraftId trae toda la flota; con spacecraftId, solo esa nave.
  async getDashboardTickets(spacecraftId) {
    try {
      const { data } = await client.get('/dashboard/tickets', {
        params: spacecraftId ? { spacecraftId } : {},
      })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },
}

export default spacecraftApi
