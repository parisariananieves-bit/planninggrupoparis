import { useState } from 'react'
import { useReporteFinanciero, useReportePeriodo, useBalanceGeneral, useAddPasivo, useUpdatePasivo, useEstadisticasNPS } from '@/hooks/useEntities'
import { useConfig, usePaleta } from '@/hooks/useConfig'
import { Button, Card, ErrorBanner, Input, Modal, PageHeader } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatCurrency } from '@/lib/format'
import { exportarReporteExcel } from '@/lib/exportarExcel'
import { TrendingUp, Target, Award, LineChart, FileSpreadsheet, FileText, Wallet2, Scale, Trash2, Heart, Star } from 'lucide-react'

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof TrendingUp; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

// Anillo circular de progreso, como los medidores de las apps de
// referencia (Weekly progress / Month progress).
function AnilloProgreso({ porcentaje, color }: { porcentaje: number; color: string }) {
  const radio = 42
  const circunferencia = 2 * Math.PI * radio
  const recorrido = Math.min(100, Math.max(0, porcentaje))
  const offset = circunferencia - (recorrido / 100) * circunferencia

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0 -rotate-90">
      <circle cx="50" cy="50" r={radio} fill="none" stroke="#f1f5f9" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={radio}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(90 50 50)"
        className="fill-slate-900 text-lg font-bold"
      >
        {recorrido.toFixed(0)}%
      </text>
    </svg>
  )
}

export function Reportes() {
  const { data: reporte, isLoading, error } = useReporteFinanciero()

  if (isLoading) return <Spinner full />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!reporte) return null

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Rentabilidad, ventas y caja" />

      <div className="space-y-6">
        <BalanceCard />
        <RentabilidadCard reporte={reporte} />
        <NPSCard />
        <FlujoCajaCard flujo={reporte.flujoCaja} />
        <TopVentasCard topProductos={reporte.topProductos} topServicios={reporte.topServicios} />
        <PeriodoCard />
      </div>
    </div>
  )
}

function RentabilidadCard({ reporte }: { reporte: NonNullable<ReturnType<typeof useReporteFinanciero>['data']> }) {
  const sinGastosFijos = reporte.gastosFijosMensuales <= 0
  const paleta = usePaleta()

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader icon={TrendingUp} title="Rentabilidad del mes" subtitle="Margen real y punto de equilibrio" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Ventas del mes</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(reporte.ventasMes)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Ganancia real</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(reporte.gananciaMes)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Margen promedio</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{reporte.margenPromedio.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Gastos fijos/mes</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(reporte.gastosFijosMensuales)}</p>
        </div>
      </div>

      {sinGastosFijos ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          Cargá tus gastos fijos mensuales (alquiler, servicios, etc.) en Configuración para ver acá el punto de
          equilibrio — cuánto necesitás vender para cubrirlos.
        </p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
          <AnilloProgreso porcentaje={reporte.porcentajeAlcanzado} color={paleta[0].dot} />
          <div className="flex-1 text-center sm:text-left">
            <p className="flex items-center justify-center gap-1.5 font-medium text-slate-700 sm:justify-start">
              <Target className="h-4 w-4" /> Punto de equilibrio: {formatCurrency(reporte.puntoEquilibrio)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {reporte.porcentajeAlcanzado >= 100
                ? 'Ya cubriste tus gastos fijos este mes — de acá en más es ganancia neta.'
                : `Te faltan ${formatCurrency(Math.max(0, reporte.puntoEquilibrio - reporte.ventasMes))} en ventas para cubrir tus gastos fijos del mes.`}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

function FlujoCajaCard({ flujo }: { flujo: { fecha: string; ingresos: number; egresos: number }[] }) {
  if (flujo.length === 0) {
    return (
      <Card className="p-5 md:p-6">
        <SectionHeader icon={LineChart} title="Flujo de caja" subtitle="Últimos 14 días" />
        <p className="text-sm text-slate-400">Todavía no hay movimientos suficientes para graficar.</p>
      </Card>
    )
  }

  const maximo = Math.max(...flujo.map((f) => Math.max(f.ingresos, f.egresos)), 1)

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader icon={LineChart} title="Flujo de caja" subtitle="Últimos 14 días — ingresos vs. egresos" />
      <div className="flex h-32 items-end gap-1.5">
        {flujo.map((f) => (
          <div key={f.fecha} className="flex flex-1 flex-col items-center gap-0.5">
            <div className="flex h-24 w-full items-end gap-0.5">
              <div
                className="flex-1 rounded-t bg-primary-400"
                style={{ height: `${(f.ingresos / maximo) * 100}%` }}
                title={`Ingresos: ${formatCurrency(f.ingresos)}`}
              />
              <div
                className="flex-1 rounded-t bg-red-300"
                style={{ height: `${(f.egresos / maximo) * 100}%` }}
                title={`Egresos: ${formatCurrency(f.egresos)}`}
              />
            </div>
            <span className="text-[9px] text-slate-400">{f.fecha.slice(8, 10)}/{f.fecha.slice(5, 7)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary-400" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-300" /> Egresos
        </span>
      </div>
    </Card>
  )
}

function TopVentasCard({
  topProductos,
  topServicios,
}: {
  topProductos: { nombre: string; cantidad: number }[]
  topServicios: { nombre: string; cantidad: number }[]
}) {
  const paleta = usePaleta()

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader icon={Award} title="Lo más vendido este mes" subtitle="Productos y servicios con más movimiento" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Productos</p>
          {topProductos.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no hay ventas de productos este mes.</p>
          ) : (
            <ul className="space-y-1.5">
              {topProductos.map((p, i) => (
                <li
                  key={p.nombre}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm"
                  style={{ backgroundColor: paleta[i % paleta.length].bg }}
                >
                  <span style={{ color: paleta[i % paleta.length].text }}>
                    {i + 1}. {p.nombre}
                  </span>
                  <span className="font-semibold" style={{ color: paleta[i % paleta.length].text }}>{p.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Servicios</p>
          {topServicios.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no hay turnos completados este mes.</p>
          ) : (
            <ul className="space-y-1.5">
              {topServicios.map((s, i) => (
                <li
                  key={s.nombre}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm"
                  style={{ backgroundColor: paleta[i % paleta.length].bg }}
                >
                  <span style={{ color: paleta[i % paleta.length].text }}>
                    {i + 1}. {s.nombre}
                  </span>
                  <span className="font-semibold" style={{ color: paleta[i % paleta.length].text }}>{s.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}

function primerDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function hoyISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().split('T')[0]
}

const ATAJOS_PERIODO = [
  { label: 'Este mes', calcular: () => ({ desde: primerDiaMes(), hasta: hoyISO() }) },
  {
    label: 'Mes pasado',
    calcular: () => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - 1)
      const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      const finMes = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const hasta = `${finMes.getFullYear()}-${String(finMes.getMonth() + 1).padStart(2, '0')}-${String(finMes.getDate()).padStart(2, '0')}`
      return { desde, hasta }
    },
  },
  {
    label: 'Este año',
    calcular: () => ({ desde: `${new Date().getFullYear()}-01-01`, hasta: hoyISO() }),
  },
]

function PeriodoCard() {
  const { data: config } = useConfig()
  const [desde, setDesde] = useState(primerDiaMes())
  const [hasta, setHasta] = useState(hoyISO())
  const { data: reporte, isLoading, error } = useReportePeriodo(desde, hasta)

  const nombreNegocio = config?.nombreNegocio || 'Oletha Beauty'

  function abrirImprimible() {
    window.open(`/reporte-imprimible?desde=${desde}&hasta=${hasta}`, '_blank')
  }

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader
        icon={Wallet2}
        title="Medición por período"
        subtitle="Elegí el rango de fechas que quieras revisar — semana, mes, año, lo que sea"
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {ATAJOS_PERIODO.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                const { desde: d, hasta: h } = a.calcular()
                setDesde(d)
                setHasta(h)
              }}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Calculando...</p>}
      {error && <ErrorBanner message={(error as Error).message} />}

      {reporte && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Ingresos</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(reporte.totalIngresos)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Egresos</p>
              <p className="mt-1 text-lg font-semibold text-red-700">{formatCurrency(reporte.totalEgresos)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo neto</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(reporte.saldoNeto)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ventas</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{reporte.cantidadVentas}</p>
            </div>
          </div>

          {reporte.porMedioPago.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">Por medio de pago</p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Medio</th>
                      <th className="px-3 py-2 text-right">Ingresos</th>
                      <th className="px-3 py-2 text-right">Egresos</th>
                      <th className="px-3 py-2 text-right">Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reporte.porMedioPago.map((m) => (
                      <tr key={m.medioPago}>
                        <td className="px-3 py-2">{m.medioPago}</td>
                        <td className="px-3 py-2 text-right text-emerald-700">{formatCurrency(m.ingresos)}</td>
                        <td className="px-3 py-2 text-right text-red-700">{formatCurrency(m.egresos)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(m.ingresos - m.egresos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reporte.porCanal.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">Por canal de venta</p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Canal</th>
                      <th className="px-3 py-2 text-right">Cantidad de ventas</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reporte.porCanal.map((c) => (
                      <tr key={c.canal}>
                        <td className="px-3 py-2">{c.canal}</td>
                        <td className="px-3 py-2 text-right">{c.cantidad}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportarReporteExcel(reporte, nombreNegocio)}>
              <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
            </Button>
            <Button variant="secondary" onClick={abrirImprimible}>
              <FileText className="h-4 w-4" /> Ver reporte para PDF
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            El Excel trae todo bien organizado en hojas separadas (resumen, movimientos, ventas, cuotas) — pensado
            para pasarle directo a tu contadora. El PDF se genera desde "Imprimir" del navegador, en una pestaña
            nueva con todo prolijo.
          </p>
        </>
      )}
    </Card>
  )
}

function BalanceCard() {
  const { data: balance, isLoading, error } = useBalanceGeneral()
  const addPasivo = useAddPasivo()
  const updatePasivo = useUpdatePasivo()
  const [open, setOpen] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    addPasivo.mutate(
      {
        nombre: String(form.get('nombre')),
        monto: Number(form.get('monto')),
        categoria: String(form.get('categoria') || ''),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  if (isLoading) return <Card className="p-5 md:p-6"><p className="text-sm text-slate-400">Calculando balance...</p></Card>
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!balance) return null

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader icon={Scale} title="Balance General" subtitle="Todo lo que tenés (Activo) menos todo lo que debés (Pasivo)" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">Activo</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Saldo en caja</span>
              <span>{formatCurrency(balance.activo.caja)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Inventario (costo)</span>
              <span>{formatCurrency(balance.activo.inventario)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cuentas por cobrar</span>
              <span>{formatCurrency(balance.activo.cuentasPorCobrar)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-emerald-700">
              <span>Total Activo</span>
              <span>{formatCurrency(balance.activo.total)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">Pasivo</p>
            <button onClick={() => setOpen(true)} className="text-xs font-medium text-primary-600 hover:underline">
              + Agregar deuda
            </button>
          </div>
          {balance.pasivo.detalle.length === 0 ? (
            <p className="text-xs text-slate-400">No tenés deudas cargadas.</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              {balance.pasivo.detalle.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-slate-600">
                  <button
                    onClick={() => updatePasivo.mutate({ id: p.id, activo: false })}
                    className="text-slate-300 hover:text-red-500"
                    title="Marcar como pagada / quitar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <span className="flex-1 px-2 truncate">{p.nombre}</span>
                  <span>{formatCurrency(p.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-red-700">
                <span>Total Pasivo</span>
                <span>{formatCurrency(balance.pasivo.total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center rounded-2xl bg-primary-50 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Patrimonio Neto</p>
          <p className={`mt-1 text-2xl font-bold ${balance.patrimonioNeto >= 0 ? 'text-primary-800' : 'text-red-600'}`}>
            {formatCurrency(balance.patrimonioNeto)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Lo que es realmente tuyo del negocio</p>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva deuda / pasivo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" name="nombre" placeholder="Préstamo, tarjeta, proveedor..." required />
          <Input label="Monto" name="monto" type="number" step="0.01" required />
          <Input label="Categoría" name="categoria" placeholder="Préstamo, tarjeta, proveedor..." />
          {addPasivo.isError && <ErrorBanner message={(addPasivo.error as Error).message} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addPasivo.isPending}>
              {addPasivo.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}

function NPSCard() {
  const { data: nps, isLoading, error } = useEstadisticasNPS()

  if (isLoading) return <Card className="p-5 md:p-6"><p className="text-sm text-slate-400">Calculando NPS...</p></Card>
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!nps) return null

  if (nps.totalRespuestas === 0) {
    return (
      <Card className="p-5 md:p-6">
        <SectionHeader icon={Heart} title="Satisfacción de clientas (NPS)" subtitle="Todavía no tenés respuestas de la encuesta" />
        <p className="text-sm text-slate-400">
          Cuando completes turnos con "Cobrar y finalizar" y la clienta tenga email cargado, le va a llegar el mail
          de encuesta con los botones de calificación. Acá vas a ver el resumen apenas empiecen a responder.
        </p>
      </Card>
    )
  }

  const colorNPS = nps.nps >= 50 ? 'text-emerald-700' : nps.nps >= 0 ? 'text-amber-600' : 'text-red-600'

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader icon={Heart} title="Satisfacción de clientas (NPS)" subtitle={`${nps.totalRespuestas} respuesta${nps.totalRespuestas === 1 ? '' : 's'} hasta ahora`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Puntaje NPS</p>
          <p className={`mt-1 text-2xl font-bold ${colorNPS}`}>{nps.nps}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Nota promedio</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{nps.promedio.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Promotoras (9-10)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{nps.promotoras}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Detractoras (0-6)</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{nps.detractoras}</p>
        </div>
      </div>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-500" style={{ width: `${(nps.promotoras / nps.totalRespuestas) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(nps.pasivas / nps.totalRespuestas) * 100}%` }} />
        <div className="bg-red-400" style={{ width: `${(nps.detractoras / nps.totalRespuestas) * 100}%` }} />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Promotoras</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Pasivas</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Detractoras</span>
      </div>

      {nps.comentarios.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Últimos comentarios</p>
          <div className="space-y-2">
            {nps.comentarios.map((c, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{c.cliente}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary-700">
                    <Star className="h-3 w-3 fill-primary-600 text-primary-600" /> {c.nota}/10
                  </span>
                </div>
                <p className="text-slate-600">"{c.comentario}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
