import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button, ErrorBanner, Input } from '@/components/ui'

export function Login() {
  const { usuario, login, cargando, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [usuarioInput, setUsuarioInput] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarLogin, setMostrarLogin] = useState(false)

  if (usuario) {
    const destino = (location.state as { from?: string })?.from || '/'
    return <Navigate to={destino} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(usuarioInput, password)
      navigate('/', { replace: true })
    } catch {
      // el error ya queda en el contexto y se muestra abajo
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F7F5] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Oletha Beauty" className="mb-3 h-20 w-20 rounded-full object-contain shadow-sm" />
          <h1 className="font-serif text-2xl font-semibold text-slate-900">Oletha Beauty</h1>
          <p className="text-sm text-slate-500">¿Qué necesitás hoy?</p>
        </div>

        {/* Los dos botones que usan las clientas, grandes y arriba de todo */}
        <a
          href="/reservar"
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-slate-900">Reservar un turno</p>
            <p className="text-sm text-slate-500">Sin necesidad de cuenta</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </a>

        <a
          href="/tienda"
          className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-slate-900">Ver la tienda</p>
            <p className="text-sm text-slate-500">Mirá y pedí nuestros productos</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </a>

        {/* Acceso del equipo, más discreto, al final */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          {!mostrarLogin ? (
            <button
              onClick={() => setMostrarLogin(true)}
              className="w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              ¿Sos parte del equipo? Ingresá acá
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">Ingreso del equipo</p>
              <Input
                label="Usuario o email"
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                autoFocus
                required
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <ErrorBanner message={error} />}
              <Button type="submit" disabled={cargando} className="w-full justify-center">
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
