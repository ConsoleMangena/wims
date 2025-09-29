import axios from 'axios'

// Base URLs can be overridden via Vite env vars
// Vite env usage: VITE_PLAT_BASE_URL, VITE_BACKEND_BASE_URL
const PLAT_BASE_URL = import.meta.env.VITE_PLAT_BASE_URL || 'http://localhost:4001'
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:4000'

export const platApi = axios.create({
  baseURL: PLAT_BASE_URL,
  withCredentials: false,
})

export const backendApi = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: false,
})

export function extractList<T = any>(data: any): T[] {
  // Platformatic DB may return an array or an envelope; try to handle both
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray(data.data)) return data.data as T[]
  if (data && Array.isArray(data.items)) return data.items as T[]
  return []
}
