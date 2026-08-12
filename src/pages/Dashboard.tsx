import { Link } from 'react-router-dom'
import {
  DollarSign,
  CalendarDays,
  Clock,
  HeartPulse,
  ArrowRight,
  Package,
  Wallet2,
} from 'lucide-react'
import { useCuotas, useKPIs, useProductos, useTurnos } from '@/hooks/useEntities'
import { StatCard } from '@/components/StatCard'
import { Card } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { ErrorBanner } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePaleta } from '@/hooks/useConfig'
import { formatCurrency } from '@/lib/format'
import type { EstadoTurno } from '@/types'

function hoyISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().split('T')[0]
}

function saludoDelDia() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const toneByEstado: Record<EstadoTurno, 'success' | 'warning' | 'danger'> = {
  confirmado: 'warning',
  completado: 'success',
  cancelado: 'danger',
}

export function Dashboard() {
  const { usuario } = useAuth()
  const { data: kpis, isLoading, error } = useKPIs()
  const hoy = hoyISO()
  const { data: turnosHoy } = useTurnos({ desde: hoy, hasta: hoy })
  const { data: turnosCompletados } = useTurnos({ estado: 'completado' })
  const { data: cuotasVencidas } = useCuotas('vencida')
  const { data: productos } = useProductos(true)
  const paleta = usePaleta()

  if (isLoading) return <Spinner full />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!kpis) return null

  const turnosActivosHoy = (turnosHoy || [])
    .filter((t) => t.estado !== 'cancelado')
    .sort((a, b) => a.hora.localeCompare(b.hora))

  const pendientesCobro = (turnosCompletados || []).filter((t) => !t.cobrado)
  const stockCritico = (productos || []).filter((p) => p.stockMinimo > 0 && p.stock <= p.stockMinimo)
  const totalPendientes = pendientesCobro.length + (cuotasVencidas?.length || 0) + stockCritico.length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">
            {saludoDelDia()}, {usuario?.nombre?.split(' ')[0] || ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Esto es lo que está pasando hoy en tu negocio</p>
        </div>
      </div>

      {/* Las 3 métricas principales, de un vistazo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ventas del mes" value={formatCurrency(kpis.ventasMes)} icon={DollarSign} variante={paleta[0]} to="/ventas" />
        <StatCard label="Turnos hoy" value={String(turnosActivosHoy.length)} icon={CalendarDays} variante={paleta[3]} to="/turnos" />
        <StatCard
          label="Pendientes"
          value={String(totalPendientes)}
          icon={Wallet2}
          tone={totalPendientes > 0 ? 'warning' : 'default'}
          variante={paleta[1]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Turnos de hoy */}
        <Card className="p-5 lg:col-span-3 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Hoy</h2>
            <Link to="/turnos" className="text-xs font-medium text-primary-600 hover:underline">
              Ver todos →
            </Link>
          </div>

          {turnosActivosHoy.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No hay turnos agendados para hoy.</p>
          ) : (
            <div className="space-y-2">
              {turnosActivosHoy.map((t) => (
                <Link
                  key={t.id}
                  to="/turnos"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <div className="w-14 shrink-0 text-sm font-semibold text-slate-700">{t.hora}</div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">
                      {t.cliente}
                      {(t.alergias || t.condiciones) && <HeartPulse className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                    </p>
                    <p className="truncate text-xs text-slate-500">{t.servicio}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      toneByEstado[t.estado] === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : toneByEstado[t.estado] === 'danger'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {t.estado}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Pendientes: cobros, cuotas, stock — todo junto */}
        <Card className="p-5 lg:col-span-2 md:p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Pendientes</h2>

          {totalPendientes === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No tenés nada pendiente. 🎉</p>
          ) : (
            <div className="space-y-4">
              {pendientesCobro.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                    <Wallet2 className="h-3.5 w-3.5" /> Cobros ({pendientesCobro.length})
                  </p>
                  {pendientesCobro.slice(0, 2).map((t) => (
                    <Link key={t.id} to="/caja" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <span className="truncate text-slate-700">{t.cliente}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
              {cuotasVencidas && cuotasVencidas.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                    <Clock className="h-3.5 w-3.5" /> Cuotas vencidas ({cuotasVencidas.length})
                  </p>
                  {cuotasVencidas.slice(0, 2).map((c) => (
                    <Link key={c.id} to="/cuotas" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <span className="truncate text-slate-700">{c.cliente}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
              {stockCritico.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                    <Package className="h-3.5 w-3.5" /> Stock crítico ({stockCritico.length})
                  </p>
                  {stockCritico.slice(0, 2).map((p) => (
                    <Link key={p.sku} to="/productos" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <span className="truncate text-slate-700">{p.nombre} — quedan {p.stock}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {stockCritico.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Productos con poco stock</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stockCritico.slice(0, 4).map((p, i) => (
              <Link
                key={p.sku}
                to="/productos"
                className="rounded-2xl border p-3 transition-shadow hover:shadow-md"
                style={{ backgroundColor: paleta[(i + 2) % paleta.length].bg, borderColor: 'transparent' }}
              >
                <p className="truncate text-sm font-medium" style={{ color: paleta[(i + 2) % paleta.length].text }}>{p.nombre}</p>
                <p className="text-xs opacity-70" style={{ color: paleta[(i + 2) % paleta.length].text }}>{p.stock} unidad{p.stock === 1 ? '' : 'es'}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
