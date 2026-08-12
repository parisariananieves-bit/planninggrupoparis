import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAddVenta, useProductos, usePromociones, useVentas } from '@/hooks/useEntities'
import { useConfig, usePaleta } from '@/hooks/useConfig'
import { Badge, Button, EmptyState, ErrorBanner, Input, Modal, PageHeader, Select } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatCurrency, formatDate } from '@/lib/format'
import { buscarPromocion, calcularSubtotalConPromo } from '@/lib/promociones'
import type { VentaItem } from '@/types'

const MEDIOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito1', label: 'Crédito 1 pago' },
  { value: 'credito3', label: 'Crédito 3 cuotas' },
  { value: 'credito6', label: 'Crédito 6 cuotas' },
  { value: 'mercadoPago', label: 'Mercado Pago' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cuentaCorriente', label: 'Cuenta corriente' },
]

export function Ventas() {
  const { data: ventas, isLoading, error } = useVentas()
  const { data: productos } = useProductos(true)
  const { data: promociones } = usePromociones(true)
  const { data: config } = useConfig()
  const addVenta = useAddVenta()
  const paleta = usePaleta()
  const [searchParams, setSearchParams] = useSearchParams()

  const [open, setOpen] = useState(false)
  const [cliente, setCliente] = useState('')
  const [medioPago, setMedioPago] = useState('efectivo')
  const [tipoPago, setTipoPago] = useState<'contado' | 'cuotas'>('contado')
  const [cantidadCuotas, setCantidadCuotas] = useState(3)
  const [descuentoPct, setDescuentoPct] = useState(0)
  const [canalVenta, setCanalVenta] = useState('Mostrador')
  const [items, setItems] = useState<(VentaItem & { etiquetaPromo?: string | null })[]>([])
  const [skuSel, setSkuSel] = useState('')
  const [cantSel, setCantSel] = useState(1)

  // Permite abrir el formulario de venta directo desde otras pantallas
  // (ej: el botón "Nueva venta" de Caja) con /ventas?nueva=1
  useEffect(() => {
    if (searchParams.get('nueva') === '1') {
      setOpen(true)
      searchParams.delete('nueva')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const ivaPct = config?.iva ?? 0

  const subtotalBruto = useMemo(() => items.reduce((a, it) => a + it.subtotal, 0), [items])
  const descuentoMonto = subtotalBruto * (descuentoPct / 100)
  const subtotal = subtotalBruto - descuentoMonto
  const iva = subtotal * (ivaPct / 100)
  const total = subtotal + iva

  function agregarItem() {
    const p = productos?.find((p) => p.sku === skuSel)
    if (!p || cantSel <= 0) return
    const promo = buscarPromocion(promociones, p.sku)
    const { subtotal, etiqueta } = calcularSubtotalConPromo(p.precioVentaSinIva, cantSel, promo)
    setItems((prev) => [
      ...prev,
      {
        sku: p.sku,
        nombre: p.nombre,
        cantidad: cantSel,
        precioUnitario: p.precioVentaSinIva,
        subtotal,
        etiquetaPromo: etiqueta,
      },
    ])
    setSkuSel('')
    setCantSel(1)
  }

  function quitarItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function resetForm() {
    setCliente('')
    setMedioPago('efectivo')
    setTipoPago('contado')
    setCantidadCuotas(3)
    setDescuentoPct(0)
    setCanalVenta('Mostrador')
    setItems([])
  }

  function confirmarVenta() {
    if (items.length === 0) return
    addVenta.mutate(
      {
        fecha: new Date().toISOString(),
        cliente,
        subtotal: subtotalBruto,
        descuentoGeneral: descuentoMonto,
        iva,
        total,
        medioPago,
        canalVenta: canalVenta,
        gananciaReal: items.reduce((a, it) => {
          const p = productos?.find((p) => p.sku === it.sku)
          return a + (it.subtotal - (p?.precioCompra || 0) * it.cantidad)
        }, 0) - descuentoMonto,
        tipoPago,
        notas: '',
        items,
        ...(tipoPago === 'cuotas' ? { cantidadCuotas } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false)
          resetForm()
        },
      }
    )
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="Historial de ventas del mes"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva venta
          </Button>
        }
      />

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {ventas && ventas.length === 0 && <EmptyState message="Todavía no registraste ninguna venta este mes." />}

      {ventas && ventas.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Medio de pago</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventas.map((v, i) => (
                <tr key={v.id} className="border-l-4 hover:opacity-90" style={{ borderLeftColor: paleta[i % paleta.length].dot }}>
                  <td className="px-4 py-3 text-slate-600">{formatDate(v.fecha)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{v.cliente || 'Consumidor final'}</td>
                  <td className="px-4 py-3 text-slate-600">{v.medioPago}</td>
                  <td className="px-4 py-3 text-slate-600">{v.canalVenta || '—'}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(v.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={v.tipoPago === 'contado' ? 'success' : 'warning'}>{v.tipoPago}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva venta">
        <div className="space-y-4">
          <Input label="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Consumidor final" />

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Agregar producto</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={skuSel}
                onChange={(e) => setSkuSel(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Elegí un producto...</option>
                {productos?.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.nombre} — {formatCurrency(p.precioVentaConIva)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={cantSel}
                  onChange={(e) => setCantSel(Number(e.target.value))}
                  className="w-16 rounded-xl border border-slate-200 px-2 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button type="button" variant="secondary" onClick={agregarItem} className="flex-1 justify-center sm:flex-none">
                  Agregar
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {items.map((it, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span>
                      {it.cantidad}× {it.nombre}
                      {it.etiquetaPromo && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          🏷️ {it.etiquetaPromo}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      {formatCurrency(it.subtotal)}
                      <button onClick={() => quitarItem(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Medio de pago" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              {MEDIOS_PAGO.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select
              label="Tipo de pago"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value as 'contado' | 'cuotas')}
            >
              <option value="contado">Contado</option>
              <option value="cuotas">Cuotas</option>
            </Select>
          </div>

          <Select label="Canal — ¿de dónde salió esta venta?" value={canalVenta} onChange={(e) => setCanalVenta(e.target.value)}>
            {(config?.canalesVenta || ['Mostrador']).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          {tipoPago === 'cuotas' && (
            <div>
              <Select
                label="Cantidad de cuotas"
                value={cantidadCuotas}
                onChange={(e) => setCantidadCuotas(Number(e.target.value))}
              >
                {[2, 3, 4, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} cuotas de {formatCurrency(total / n)}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-slate-400">
                Los vencimientos se generan automáticamente, uno por mes, y aparecen en el módulo Cuotas.
              </p>
            </div>
          )}

          <Input
            label="Descuento general (%)"
            type="number"
            min={0}
            max={100}
            value={descuentoPct || ''}
            onChange={(e) => setDescuentoPct(Number(e.target.value))}
            placeholder="0"
          />

          <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalBruto)}</span>
            </div>
            {descuentoPct > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento ({descuentoPct}%)</span>
                <span>-{formatCurrency(descuentoMonto)}</span>
              </div>
            )}
            {ivaPct > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>IVA ({ivaPct}%)</span>
                <span>{formatCurrency(iva)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {addVenta.isError && <ErrorBanner message={(addVenta.error as Error).message} />}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarVenta} disabled={items.length === 0 || addVenta.isPending}>
              {addVenta.isPending ? 'Guardando...' : 'Confirmar venta'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
