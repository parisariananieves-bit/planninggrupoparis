import { useState, type FormEvent } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import { useAddVenta, useProductos, usePromociones, useUpdateTurno } from '@/hooks/useEntities'
import { useConfig } from '@/hooks/useConfig'
import { Button, ErrorBanner, Input, Modal, Select } from '@/components/ui'
import { formatCurrency } from '@/lib/format'
import { buscarPromocion, calcularSubtotalConPromo } from '@/lib/promociones'
import type { Turno, VentaItem } from '@/types'

export function linkWhatsapp(telefono: string, mensaje: string) {
  const digitos = String(telefono || '').replace(/\D/g, '')
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`
}

export function CobrarTurnoModal({
  turno,
  precioSugerido,
  onClose,
}: {
  turno: Turno
  precioSugerido?: number
  onClose: () => void
}) {
  const { data: productos } = useProductos(true)
  const { data: promociones } = usePromociones(true)
  const { data: config } = useConfig()
  const addVenta = useAddVenta()
  const updateTurno = useUpdateTurno()
  const [finalizado, setFinalizado] = useState(false)

  const [cobrarAhora, setCobrarAhora] = useState(true)
  const [montoServicio, setMontoServicio] = useState(precioSugerido ?? 0)
  const [medioPago, setMedioPago] = useState('efectivo')
  const [descuentoPct, setDescuentoPct] = useState(0)
  const [items, setItems] = useState<(VentaItem & { etiquetaPromo?: string | null })[]>([])
  const [skuSel, setSkuSel] = useState('')
  const [cantSel, setCantSel] = useState(1)

  const ivaPct = config?.iva ?? 0
  const subtotalBruto = montoServicio + items.reduce((a, it) => a + it.subtotal, 0)
  const descuentoMonto = subtotalBruto * (descuentoPct / 100)
  const subtotal = subtotalBruto - descuentoMonto
  const iva = subtotal * (ivaPct / 100)
  const total = subtotal + iva

  const yaEstabaCompletado = turno.estado === 'completado'

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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!cobrarAhora) {
      // Dejar pendiente: solo marca el turno como completado (si no lo
      // estaba ya) sin generar venta ni movimiento de caja todavía.
      updateTurno.mutate(
        { id: turno.id, estado: 'completado', cobrado: false },
        { onSuccess: () => setFinalizado(true) }
      )
      return
    }

    const gananciaProductos = items.reduce((a, it) => {
      const p = productos?.find((p) => p.sku === it.sku)
      return a + (it.subtotal - (p?.precioCompra || 0) * it.cantidad)
    }, 0)

    addVenta.mutate(
      {
        fecha: new Date().toISOString(),
        cliente: turno.cliente,
        subtotal: subtotalBruto,
        descuentoGeneral: descuentoMonto,
        iva,
        total,
        medioPago,
        canalVenta: 'Turno',
        gananciaReal: montoServicio + gananciaProductos - descuentoMonto,
        tipoPago: 'contado',
        notas: `Turno: ${turno.servicio}`,
        items,
      },
      {
        onSuccess: () => {
          updateTurno.mutate(
            { id: turno.id, estado: 'completado', cobrado: true },
            { onSuccess: () => setFinalizado(true) }
          )
        },
      }
    )
  }

  const mensajeWhatsapp = `¡Hola ${turno.cliente.split(' ')[0]}! Gracias por tu visita hoy 💜 Del 1 al 10, ¿qué tan probable es que nos recomiendes?`

  return (
    <Modal
      open
      onClose={onClose}
      title={finalizado ? 'Listo' : yaEstabaCompletado ? 'Cobrar turno pendiente' : 'Cobrar y finalizar'}
    >
      {!finalizado ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">
            {turno.cliente} — {turno.servicio}
          </p>

          {!yaEstabaCompletado && (
            <div className="flex rounded-xl border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setCobrarAhora(true)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  cobrarAhora ? 'bg-primary-600 text-white' : 'text-slate-500'
                }`}
              >
                Cobrar ahora
              </button>
              <button
                type="button"
                onClick={() => setCobrarAhora(false)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  !cobrarAhora ? 'bg-primary-600 text-white' : 'text-slate-500'
                }`}
              >
                Dejar pendiente de cobro
              </button>
            </div>
          )}

          {cobrarAhora ? (
            <>
              <Input
                label="Monto del servicio"
                type="number"
                step="0.01"
                value={montoServicio}
                onChange={(e) => setMontoServicio(Number(e.target.value))}
                required
              />

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium text-slate-700">¿Se llevó algún producto?</p>
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
                          <button type="button" onClick={() => quitarItem(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Select label="Medio de pago" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito1">Crédito 1 pago</option>
                <option value="mercadoPago">Mercado Pago</option>
                <option value="transferencia">Transferencia</option>
              </Select>

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
            </>
          ) : (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              El turno queda marcado como finalizado y va a aparecer en Caja, en "Pendientes de cobro", para cobrarlo cuando quieras.
            </p>
          )}

          {(addVenta.isError || updateTurno.isError) && (
            <ErrorBanner message={((addVenta.error || updateTurno.error) as Error).message} />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addVenta.isPending || updateTurno.isPending}>
              {addVenta.isPending || updateTurno.isPending
                ? 'Guardando...'
                : cobrarAhora
                  ? 'Confirmar cobro'
                  : 'Marcar como finalizado'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600">
            {cobrarAhora
              ? `El turno quedó cobrado y marcado como completado. La venta ya está en Caja${items.length > 0 ? ', el stock se descontó' : ''} y en el historial de Ventas.`
              : 'El turno quedó marcado como finalizado y pendiente de cobro en Caja.'}
          </p>
          {turno.telefono ? (
            <a
              href={linkWhatsapp(turno.telefono, mensajeWhatsapp)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" /> Enviar encuesta por WhatsApp
            </a>
          ) : (
            <p className="text-xs text-slate-400">Esta clienta no dejó teléfono para enviarle WhatsApp.</p>
          )}
          <div>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
