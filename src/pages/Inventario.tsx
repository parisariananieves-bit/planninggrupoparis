import { useState, type FormEvent } from 'react'
import { Plus, Search, DollarSign, Package, AlertTriangle, XCircle } from 'lucide-react'
import { useAddMovStock, useInventario, useProductos } from '@/hooks/useEntities'
import { Badge, Button, EmptyState, ErrorBanner, Input, Modal, PageHeader, Select } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { StatCard } from '@/components/StatCard'
import { usePaleta } from '@/hooks/useConfig'
import { formatCurrency, formatDate } from '@/lib/format'

export function Inventario() {
  const { data: movimientos, isLoading, error } = useInventario()
  const { data: productos } = useProductos(true)
  const addMov = useAddMovStock()
  const paleta = usePaleta()
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'bajo' | 'sin'>('todos')

  const valorStock = (productos || []).reduce((a, p) => a + p.precioCompra * p.stock, 0)
  const stockBajo = (productos || []).filter((p) => p.stockMinimo > 0 && p.stock <= p.stockMinimo && p.stock > 0)
  const sinStock = (productos || []).filter((p) => p.stock <= 0)

  const movimientosFiltrados = (movimientos || []).filter((m) => {
    const q = busqueda.trim().toLowerCase()
    const coincideTexto = !q || (m.nombreProducto || '').toLowerCase().includes(q) || m.sku.toLowerCase().includes(q)
    if (!coincideTexto) return false
    if (filtro === 'bajo') return stockBajo.some((p) => p.sku === m.sku)
    if (filtro === 'sin') return sinStock.some((p) => p.sku === m.sku)
    return true
  })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const sku = String(form.get('sku'))
    const producto = productos?.find((p) => p.sku === sku)
    addMov.mutate(
      {
        fecha: new Date().toISOString(),
        tipo: String(form.get('tipo')) as 'entrada' | 'salida',
        sku,
        nombreProducto: producto?.nombre || '',
        cantidad: Number(form.get('cantidad')),
        motivo: String(form.get('motivo') || ''),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Entradas y salidas de stock"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo movimiento
          </Button>
        }
      />

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Valor del stock" value={formatCurrency(valorStock)} icon={DollarSign} variante={paleta[0]} />
        <StatCard label="Productos" value={String((productos || []).length)} icon={Package} variante={paleta[1]} />
        <StatCard label="Stock bajo" value={String(stockBajo.length)} icon={AlertTriangle} tone={stockBajo.length > 0 ? 'warning' : 'default'} variante={paleta[2]} />
        <StatCard label="Sin stock" value={String(sinStock.length)} icon={XCircle} tone={sinStock.length > 0 ? 'danger' : 'default'} variante={paleta[3]} />
      </div>

      {movimientos && movimientos.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'bajo', label: 'Stock bajo' },
              { key: 'sin', label: 'Sin stock' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key as typeof filtro)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === f.key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {movimientos && movimientos.length === 0 && <EmptyState message="No hay movimientos de stock registrados." />}
      {movimientos && movimientos.length > 0 && movimientosFiltrados.length === 0 && (
        <EmptyState message="No encontré ningún movimiento con esa búsqueda." />
      )}

      {movimientosFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Stock resultante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...movimientosFiltrados].reverse().map((m) => (
                <tr key={m.id} className="border-l-4 hover:bg-slate-50" style={{ borderLeftColor: m.tipo === 'entrada' ? '#10b981' : '#f59e0b' }}>
                  <td className="px-4 py-3 text-slate-600">{formatDate(m.fecha)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.nombreProducto || m.sku}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.tipo === 'entrada' ? 'success' : 'warning'}>{m.tipo}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-900">{m.cantidad}</td>
                  <td className="px-4 py-3 text-slate-600">{m.motivo || '—'}</td>
                  <td className="px-4 py-3 text-slate-900">{m.stockResultante}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo movimiento de stock">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Producto" name="sku" required defaultValue="">
            <option value="" disabled>
              Elegí un producto...
            </option>
            {productos?.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.nombre}
              </option>
            ))}
          </Select>
          <Select label="Tipo" name="tipo" defaultValue="entrada">
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </Select>
          <Input label="Cantidad" name="cantidad" type="number" min={1} required />
          <Input label="Motivo" name="motivo" placeholder="Compra a proveedor, ajuste, etc." />
          {addMov.isError && <ErrorBanner message={(addMov.error as Error).message} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addMov.isPending}>
              {addMov.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
