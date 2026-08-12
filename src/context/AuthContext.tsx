import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '@/api/client'
import type { ModuloKey, UsuarioSesion } from '@/types'

const STORAGE_KEY = 'oletha_sesion'

interface AuthContextValue {
  usuario: UsuarioSesion | null
  cargando: boolean
  error: string | null
  login: (usuario: string, password: string) => Promise<void>
  logout: () => void
  tienePermiso: (modulo: ModuloKey) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function leerSesionGuardada(): UsuarioSesion | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UsuarioSesion
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => leerSesionGuardada())
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login(usuarioInput: string, password: string) {
    setCargando(true)
    setError(null)
    try {
      const data = await api.post<UsuarioSesion>('login', { usuario: usuarioInput, password })
      setUsuario(data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setCargando(false)
    }
  }

  function logout() {
    setUsuario(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  function tienePermiso(modulo: ModuloKey) {
    if (!usuario) return false
    return usuario.permisos.includes(modulo)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, error, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
