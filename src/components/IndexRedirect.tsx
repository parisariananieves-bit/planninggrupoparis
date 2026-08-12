import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Dashboard } from '@/pages/Dashboard'
import { MODULOS } from '@/types'

const RUTA_POR_MODULO: Record<string, string> = {
  dashboard: '/',
  ventas: '/ventas',
  productos: '/productos',
  caja: '/caja',
  inventario: '/inventario',
  clientes: '/clientes',
  cuotas: '/cuotas',
  turnos: '/turnos',
  configuracion: '/configuracion',
}

export function IndexRedirect() {
  const { tienePermiso } = useAuth()

  if (tienePermiso('dashboard')) return <Dashboard />

  const primerModulo = MODULOS.find((m) => m.key !== 'usuarios' && tienePermiso(m.key))
  if (primerModulo) return <Navigate to={RUTA_POR_MODULO[primerModulo.key]} replace />

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-medium text-slate-700">Todavía no tenés ningún módulo habilitado</p>
      <p className="mt-1 text-sm text-slate-500">Pedile a quien administra el sistema que te dé acceso a alguno.</p>
    </div>
  )
}
