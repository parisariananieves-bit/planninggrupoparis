import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConfig } from '@/hooks/useConfig'
import { useReportePeriodo } from '@/hooks/useEntities'
import { Spinner } from '@/components/Spinner'
import { formatCurrency, formatDate } from '@/lib/format'

// Ruta pensada para abrirse en una pestaña e imprimir/guardar como PDF
// desde el navegador (Ctrl/Cmd+P) — sin depender de ninguna librería de
// PDF, así siempre se ve prolijo y funciona en cualquier dispositivo.
export function ReporteImprimible() {
  const [searchParams] = useSearchParams()
  const desde = searchParams.get('desde') || ''
  const hasta = searchParams.get('hasta') || ''
  const { data: config } = useConfig()
  const { data: reporte, isLoading } = useReportePeriodo(desde, hasta)

  useEffect(() => {
    document.title = `Reporte ${desde} a ${hasta}`
  }, [desde, hasta])

  if (isLoading || !reporte) return <Spinner full />

  const nombreNegocio = config?.nombreNegocio || 'Oletha Beauty'

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-slate-900 print:p-0">
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white; }
        }
      `}</style>

      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold">{nombreNegocio}</h1>
          <p className="text-sm text-slate-500">Reporte financiero</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>{formatDate(reporte.desde)} — {formatDate(reporte.hasta)}</p>
          <p>Generado el {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Total ingresos</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(reporte.totalIngresos)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Total egresos</p>
          <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(reporte.totalEgresos)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Saldo neto</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(reporte.saldoNeto)}</p>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Desglose por medio de pago</h2>
      <table className="mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            <th className="py-1.5">Medio de pago</th>
            <th className="py-1.5 text-right">Ingresos</th>
            <th className="py-1.5 text-right">Egresos</th>
            <th className="py-1.5 text-right">Neto</th>
          </tr>
        </thead>
        <tbody>
          {reporte.porMedioPago.map((m) => (
            <tr key={m.medioPago} className="border-b border-slate-100">
              <td className="py-1.5">{m.medioPago}</td>
              <td className="py-1.5 text-right">{formatCurrency(m.ingresos)}</td>
              <td className="py-1.5 text-right">{formatCurrency(m.egresos)}</td>
              <td className="py-1.5 text-right font-medium">{formatCurrency(m.ingresos - m.egresos)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Por canal de venta</h2>
      <table className="mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            <th className="py-1.5">Canal</th>
            <th className="py-1.5 text-right">Cantidad</th>
            <th className="py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {reporte.porCanal.map((c) => (
            <tr key={c.canal} className="border-b border-slate-100">
              <td className="py-1.5">{c.canal}</td>
              <td className="py-1.5 text-right">{c.cantidad}</td>
              <td className="py-1.5 text-right">{formatCurrency(c.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">
        Ventas del período ({reporte.cantidadVentas})
      </h2>
      <table className="mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            <th className="py-1.5">Fecha</th>
            <th className="py-1.5">Cliente</th>
            <th className="py-1.5">Medio de pago</th>
            <th className="py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {reporte.ventas.map((v) => (
            <tr key={v.id} className="border-b border-slate-100">
              <td className="py-1.5">{formatDate(v.fecha)}</td>
              <td className="py-1.5">{v.cliente || 'Consumidor final'}</td>
              <td className="py-1.5">{v.medioPago}</td>
              <td className="py-1.5 text-right">{formatCurrency(v.total)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-1.5" colSpan={3}>Total</td>
            <td className="py-1.5 text-right">{formatCurrency(reporte.totalVentas)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Movimientos de caja</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            <th className="py-1.5">Fecha</th>
            <th className="py-1.5">Concepto</th>
            <th className="py-1.5">Tipo</th>
            <th className="py-1.5 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {reporte.movimientos.map((m) => (
            <tr key={m.id} className="border-b border-slate-100">
              <td className="py-1.5">{formatDate(m.fecha)}</td>
              <td className="py-1.5">{m.concepto}</td>
              <td className="py-1.5 capitalize">{m.tipo}</td>
              <td className={`py-1.5 text-right ${m.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}`}>
                {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg print:hidden"
      >
        Imprimir / Guardar como PDF
      </button>
    </div>
  )
}
