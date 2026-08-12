import { useState } from 'react'
import { useCuotas, usePagarCuota } from '@/hooks/useEntities'
import { usePaleta } from '@/hooks/useConfig'
import { Badge, Button, EmptyState, ErrorBanner, Input, Modal, PageHeader, Select } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Cuota, EstadoCuota } from '@/types'

const toneByEstado: Record<EstadoCuota, 'success' | 'warning' | 'danger' | 'default'> = {
  pagada: 'success',
  parcial: 'warning',
  vencida: 'danger',
  pendiente: 'default',
}

export function Cuotas() {
  const [filtro, setFiltro] = useState<string>('')
  const { data: cuotas, isLoading, error } = useCuotas(filtro || undefined)
  const pagar = usePagarCuota()
  const paleta = usePaleta()
  const [cuotaSel, setCuotaSel] = useState<Cuota | null>(null)

  function confirmarPago(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cuotaSel) return
    const form = new FormData(e.currentTarget)
    pagar.mutate(
      {
        cuotaId: cuotaSel.id,
        montoPago: Number(form.get('montoPago')),
        medioPago: String(form.get('medioPago') || ''),
        fecha: new Date().toISOString(),
      },
      { onSuccess: () => setCuotaSel(null) }
    )
  }

  return (
    <div>
      <PageHeader
        title="Cuotas"
        subtitle="Seguimiento de pagos en cuotas"
        action={
          <Select label="" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="min-w-[160px]">
            <option value="">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="parcial">Parciales</option>
            <option value="vencida">Vencidas</option>
            <option value="pagada">Pagadas</option>
          </Select>
        }
      />

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {cuotas && cuotas.length === 0 && <EmptyState message="No hay cuotas para mostrar." />}

      {cuotas && cuotas.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Cuota</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuotas.map((c, i) => (
                <tr key={c.id} className="border-l-4 hover:opacity-90" style={{ borderLeftColor: paleta[i % paleta.length].dot }}>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.cliente}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.numeroCuota}/{c.totalCuotas}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.fechaVencimiento)}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(c.saldoPendiente)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneByEstado[c.estado]}>{c.estado}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.estado !== 'pagada' && (
                      <button
                        onClick={() => setCuotaSel(c)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Registrar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!cuotaSel} onClose={() => setCuotaSel(null)} title="Registrar pago de cuota">
        {cuotaSel && (
          <form onSubmit={confirmarPago} className="space-y-4">
            <p className="text-sm text-slate-600">
              {cuotaSel.cliente} — Cuota {cuotaSel.numeroCuota}/{cuotaSel.totalCuotas} — saldo{' '}
              {formatCurrency(cuotaSel.saldoPendiente)}
            </p>
            <Input
              label="Monto a pagar"
              name="montoPago"
              type="number"
              step="0.01"
              max={cuotaSel.saldoPendiente}
              defaultValue={cuotaSel.saldoPendiente}
              required
            />
            <Input label="Medio de pago" name="medioPago" placeholder="Efectivo, transferencia..." />
            {pagar.isError && <ErrorBanner message={(pagar.error as Error).message} />}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setCuotaSel(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pagar.isPending}>
                {pagar.isPending ? 'Guardando...' : 'Confirmar pago'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
