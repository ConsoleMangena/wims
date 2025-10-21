import axios from 'axios'

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: false,
})

// Request interceptor for error handling
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const role = localStorage.getItem('userRole')
  if (role) {
    (config.headers as any)['X-Role'] = role
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const apiEndpoints = {
  // Species
  species: {
    list: () => api.get('/api/species'),
    create: (data: any) => api.post('/api/species', data),
    update: (id: number, data: any) => api.put(`/api/species/${id}`, data),
    delete: (id: number) => api.delete(`/api/species/${id}`),
  },

  // Sightings
  sightings: {
    list: () => api.get('/api/sightings'),
    create: (data: any) => api.post('/api/sightings', data),
    update: (id: number, data: any) => api.put(`/api/sightings/${id}`, data),
    delete: (id: number) => api.delete(`/api/sightings/${id}`),
  },

  // Reserves
  reserves: {
    list: () => api.get('/api/reserves'),
    create: (data: any) => api.post('/api/reserves', data),
    update: (id: number, data: any) => api.put(`/api/reserves/${id}`, data),
    delete: (id: number) => api.delete(`/api/reserves/${id}`),
  },

  // Hunters
  hunters: {
    list: () => api.get('/api/hunters'),
    create: (data: any) => api.post('/api/hunters', data),
    update: (id: number, data: any) => api.put(`/api/hunters/${id}`, data),
    delete: (id: number) => api.delete(`/api/hunters/${id}`),
  },

  // Licenses
  licenses: {
    list: () => api.get('/api/licences'),
    create: (data: any) => api.post('/api/licences', data),
    update: (id: number, data: any) => api.put(`/api/licences/${id}`, data),
    delete: (id: number) => api.delete(`/api/licences/${id}`),
  },

  // Quotas
  quotas: {
    list: () => api.get('/api/quotas'),
    create: (data: any) => api.post('/api/quotas', data),
    update: (id: number, data: any) => api.put(`/api/quotas/${id}`, data),
    delete: (id: number) => api.delete(`/api/quotas/${id}`),
  },

  // Poaching Incidents
  poaching: {
    list: () => api.get('/api/poaching'),
    create: (data: any) => api.post('/api/poaching', data),
    update: (id: number, data: any) => api.put(`/api/poaching/${id}`, data),
    delete: (id: number) => api.delete(`/api/poaching/${id}`),
  },

  // Stats
  stats: {
    getDashboard: () => api.get('/api/stats'),
  },

  // Health check
  health: {
    check: () => api.get('/health'),
  },
}
