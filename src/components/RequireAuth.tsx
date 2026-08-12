import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { ModuloKey } from '@/types'

export function RequireAuth({ children, modulo }: { children: ReactNode; modulo?: ModuloKey }) {
  const { usuario, tienePermiso } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (modulo && !tienePermiso(modulo)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ShieldAlert className="mb-3 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700">No tenés acceso a este módulo</p>
        <p className="mt-1 text-sm text-slate-500">Pedile a quien administra el sistema que te habilite el permiso.</p>
      </div>
    )
  }

  return <>{children}</>
}
