import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Plus, ShoppingCart, X } from 'lucide-react'
import { useAddMovCaja, useCaja, useServicios, useTurnos } from '@/hooks/useEntities'
import { Badge, Button, EmptyState, ErrorBanner, Input, Modal, PageHeader, Select } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatCurrency, formatDate } from '@/lib/format'
import { comprimirImagen } from '@/lib/imagen'
import { ImagenConFallback } from '@/components/ImagenConFallback'
import { SelectorDrive } from '@/components/SelectorDrive'
import { CobrarTurnoModal } from '@/components/CobrarTurnoModal'
import { ArqueoCard } from '@/components/ArqueoCard'
import { usePaleta } from '@/hooks/useConfig'
import type { Turno } from '@/types'

export function Caja() {
  const { data: movimientos, isLoading, error } = useCaja()
  const addMov = useAddMovCaja()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'movimientos' | 'arqueo'>('movimientos')
  const paleta = usePaleta()
  const [tipoNuevoMov, setTipoNuevoMov] = useState<'ingreso' | 'egreso'>('ingreso')
  const [fotoGastoBase64, setFotoGastoBase64] = useState<string | null>(null)
  const [fotoGastoPreview, setFotoGastoPreview] = useState<string | null>(null)
  const [fotoGastoDriveUrl, setFotoGastoDriveUrl] = useState<string | null>(null)
  const [comprimiendoFotoGasto, setComprimiendoFotoGasto] = useState(false)

  const { data: turnosCompletados } = useTurnos({ estado: 'completado' })
  const { data: servicios } = useServicios()
  const pendientes = (turnosCompletados || []).filter((t) => !t.cobrado)
  const [turnoACobrar, setTurnoACobrar] = useState<Turno | null>(null)

  const saldoActual = movimientos && movimientos.length > 0 ? movimientos[movimientos.length - 1].saldoAcumulado : 0

  async function handleFotoGasto(file: File) {
    setComprimiendoFotoGasto(true)
    try {
      const base64 = await comprimirImagen(file)
      setFotoGastoBase64(base64)
      setFotoGastoPreview(`data:image/jpeg;base64,${base64}`)
    } finally {
      setComprimiendoFotoGasto(false)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    addMov.mutate(
      {
        fecha: new Date().toISOString(),
        tipo: String(form.get('tipo')) as 'ingreso' | 'egreso',
        concepto: String(form.get('concepto')),
        categoria: String(form.get('categoria') || ''),
        monto: Number(form.get('monto')),
        medioPago: String(form.get('medioPago') || ''),
        ...(fotoGastoBase64 ? { fotoBase64: fotoGastoBase64, fotoMimeType: 'image/jpeg', fotoNombre: 'ticket.jpg' } : {}),
        ...(fotoGastoDriveUrl ? { fotoUrlExistente: fotoGastoDriveUrl } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false)
          setFotoGastoBase64(null)
          setFotoGastoPreview(null)
          setTipoNuevoMov('ingreso')
        },
      }
    )
  }

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle={`Saldo actual: ${formatCurrency(saldoActual)}`}
        action={
          <div className="flex gap-2">
            <Link to="/ventas?nueva=1">
              <Button variant="secondary">
                <ShoppingCart className="h-4 w-4" /> Nueva venta
              </Button>
            </Link>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Nuevo movimiento
            </Button>
          </div>
        }
      />

      {pendientes.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-semibold text-amber-800">
            Pendientes de cobro ({pendientes.length})
          </p>
          <div className="space-y-2">
            {pendientes.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border-l-4 p-3"
                style={{ backgroundColor: paleta[i % paleta.length].bg, borderLeftColor: paleta[i % paleta.length].dot }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: paleta[i % paleta.length].text }}>{t.cliente}</p>
                  <p className="truncate text-xs opacity-70" style={{ color: paleta[i % paleta.length].text }}>
                    {t.servicio} · {formatDate(t.fecha)}
                  </p>
                </div>
                <Button onClick={() => setTurnoACobrar(t)} className="shrink-0">
                  Cobrar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab('movimientos')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'movimientos' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Movimientos
        </button>
        <button
          onClick={() => setTab('arqueo')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'arqueo' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Arqueo de caja
        </button>
      </div>

      {tab === 'arqueo' ? (
        <ArqueoCard />
      ) : (
        <>
          {isLoading && <Spinner full />}
          {error && <ErrorBanner message={(error as Error).message} />}

          {movimientos && movimientos.length === 0 && <EmptyState message="No hay movimientos de caja registrados." />}

          {movimientos && movimientos.length > 0 && (
            <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...movimientos].reverse().map((m) => (
                    <tr
                      key={m.id}
                      className="border-l-4 hover:bg-slate-50"
                      style={{ borderLeftColor: m.tipo === 'ingreso' ? '#10b981' : '#ef4444' }}
                    >
                      <td className="px-4 py-3 text-slate-600">{formatDate(m.fecha)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <span className="flex items-center gap-2">
                          {m.fotoUrl && (
                            <a href={m.fotoUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              <ImagenConFallback
                                src={m.fotoUrl}
                                alt="Comprobante"
                                className="h-8 w-8 shrink-0 rounded-lg object-cover"
                                Icono={Camera}
                                iconoClassName="h-3.5 w-3.5 text-slate-400"
                              />
                            </a>
                          )}
                          {m.concepto}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.categoria || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={m.tipo === 'ingreso' ? 'success' : 'danger'}>{m.tipo}</Badge>
                      </td>
                      <td className={`px-4 py-3 font-medium ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.tipo === 'ingreso' ? '+' : '-'}
                        {formatCurrency(m.monto)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{formatCurrency(m.saldoAcumulado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo movimiento de caja">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Tipo" name="tipo" value={tipoNuevoMov} onChange={(e) => setTipoNuevoMov(e.target.value as 'ingreso' | 'egreso')}>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </Select>
          <Input label="Concepto" name="concepto" required />
          <Input label="Categoría" name="categoria" />
          <Input label="Monto" name="monto" type="number" step="0.01" required />
          <Input label="Medio de pago" name="medioPago" />

          {tipoNuevoMov === 'egreso' && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Foto del ticket/factura <span className="font-normal text-slate-400">(opcional)</span>
              </span>
              {!fotoGastoPreview ? (
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-4 text-slate-400 hover:border-slate-400 hover:text-slate-500">
                  <Camera className="h-5 w-5" />
                  <span className="text-xs font-medium">{comprimiendoFotoGasto ? 'Procesando...' : 'Sacar foto o subir del dispositivo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={comprimiendoFotoGasto}
                    onChange={(e) => e.target.files?.[0] && handleFotoGasto(e.target.files[0])}
                  />
                </label>
              ) : (
                <div className="relative inline-block">
                  <img src={fotoGastoPreview} alt="Comprobante" className="h-24 w-24 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFotoGastoBase64(null); setFotoGastoPreview(null); setFotoGastoDriveUrl(null) }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="mt-1.5">
                <SelectorDrive
                  onSeleccionar={(url) => { setFotoGastoBase64(null); setFotoGastoPreview(url); setFotoGastoDriveUrl(url) }}
                  disabled={comprimiendoFotoGasto}
                />
              </div>
            </div>
          )}

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

      {turnoACobrar && (
        <CobrarTurnoModal
          turno={turnoACobrar}
          precioSugerido={servicios?.find((s) => s.nombre === turnoACobrar.servicio)?.precio}
          onClose={() => setTurnoACobrar(null)}
        />
      )}
    </div>
  )
}
