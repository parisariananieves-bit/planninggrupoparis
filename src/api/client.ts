import type { ApiResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY

class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * GET a la Web App de Apps Script. Todas las lecturas van por acá.
 * Apps Script no soporta bien los headers custom en CORS simple requests,
 * así que la apiKey y la action viajan como query params.
 */
async function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError('Falta configurar VITE_API_URL')
  }

  const url = new URL(API_URL)
  url.searchParams.set('apiKey', API_KEY)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  const json: ApiResponse<T> = await res.json()

  if (!json.ok) {
    throw new ApiError(json.error || 'Error desconocido en la API')
  }

  return json.data as T
}

/**
 * POST a la Web App de Apps Script. Todas las escrituras van por acá.
 * Se manda como text/plain para evitar el preflight OPTIONS, que
 * Apps Script Web Apps no responden bien.
 */
async function apiPost<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError('Falta configurar VITE_API_URL')
  }

  const url = new URL(API_URL)
  url.searchParams.set('apiKey', API_KEY)
  url.searchParams.set('action', action)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<T> = await res.json()

  if (!json.ok) {
    throw new ApiError(json.error || 'Error desconocido en la API')
  }

  return json.data as T
}

export const api = { get: apiGet, post: apiPost }
export { ApiError }
