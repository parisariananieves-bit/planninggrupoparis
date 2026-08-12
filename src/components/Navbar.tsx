import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Boxes,
  Users,
  CalendarClock,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useConfig } from '@/hooks/useConfig'
import { useAuth } from '@/context/AuthContext'
import type { ModuloKey } from '@/types'

const links: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; modulo: ModuloKey }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, modulo: 'dashboard' },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart, modulo: 'ventas' },
  { to: '/productos', label: 'Productos', icon: Package, modulo: 'productos' },
  { to: '/caja', label: 'Caja', icon: Wallet, modulo: 'caja' },
  { to: '/inventario', label: 'Inventario', icon: Boxes, modulo: 'inventario' },
  { to: '/clientes', label: 'Clientes', icon: Users, modulo: 'clientes' },
  { to: '/cuotas', label: 'Cuotas', icon: CalendarClock, modulo: 'cuotas' },
  { to: '/turnos', label: 'Turnos', icon: CalendarDays, modulo: 'turnos' },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, modulo: 'reportes' },
]

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium transition-all duration-200',
    isActive ? 'bg-white text-primary-700 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md'
  )

const navItemClassDrawer = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
  )

export function Navbar() {
  const { data: config } = useConfig()
  const { usuario, tienePermiso, logout } = useAuth()
  const logoSrc = config?.logoUrl?.trim() || '/logo.png'
  const visibleLinks = links.filter((l) => tienePermiso(l.modulo))
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <>
      {/* Sidebar desktop: "flotante", bordes redondeados, separada de los bordes */}
      <aside className="hidden shrink-0 p-3 md:flex">
        <div className="flex w-60 flex-col rounded-3xl bg-primary-700 shadow-lg">
          <div className="flex h-20 items-end gap-2.5 px-5 pb-4 pt-6">
            <img src={logoSrc} alt="Logo" className="h-9 w-9 shrink-0 rounded-full bg-white object-contain shadow-sm" />
            <span className="truncate font-serif text-sm font-semibold text-white">
              {config?.nombreNegocio || 'Sistema de Caja'}
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-3 pb-3">
            {visibleLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navItemClass}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-1 border-t border-white/10 p-3">
            {tienePermiso('configuracion') && (
              <NavLink to="/configuracion" className={navItemClass}>
                <Settings className="h-4.5 w-4.5" />
                Configuración
              </NavLink>
            )}
            <div className="flex items-center justify-between rounded-full px-4 py-2">
              <span className="truncate text-xs text-white/60">{usuario?.nombre}</span>
              <button onClick={logout} className="text-white/50 hover:text-white" title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Header mobile: logo + hamburguesa que abre el menú completo */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={logoSrc} alt="Logo" className="h-7 w-7 shrink-0 rounded-full object-contain" />
          <span className="truncate font-serif text-sm font-semibold text-slate-900">
            {config?.nombreNegocio || 'Sistema de Caja'}
          </span>
        </div>
        <button
          onClick={() => setMenuAbierto(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Menú mobile: se despliega completo en vez de amontonar íconos abajo */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/40 md:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMenuAbierto(false)
          }}
        >
          <div className="flex h-full w-[85%] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2.5">
                <img src={logoSrc} alt="Logo" className="h-9 w-9 rounded-full object-contain" />
                <span className="truncate font-serif font-semibold text-slate-900">
                  {config?.nombreNegocio || 'Sistema de Caja'}
                </span>
              </div>
              <button
                onClick={() => setMenuAbierto(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {visibleLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={navItemClassDrawer} onClick={() => setMenuAbierto(false)}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="space-y-1 border-t border-slate-100 p-3">
              {tienePermiso('configuracion') && (
                <NavLink to="/configuracion" className={navItemClassDrawer} onClick={() => setMenuAbierto(false)}>
                  <Settings className="h-5 w-5 shrink-0" />
                  Configuración
                </NavLink>
              )}
              <div className="flex items-center justify-between rounded-2xl px-4 py-3">
                <span className="truncate text-sm text-slate-500">{usuario?.nombre}</span>
                <button onClick={logout} className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700">
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
