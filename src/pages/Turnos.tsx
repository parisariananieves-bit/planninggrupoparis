import { useState, type FormEvent } from 'react'
import { Copy, HeartPulse, ImagePlus, MessageCircle, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import {
  useAddServicio,
  useDeleteTurno,
  useInsumos,
  useServicios,
  useTurnos,
  useUpdateServicio,
  useUpdateTurno,
} from '@/hooks/useEntities'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Modal, PageHeader } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { useConfig, usePaleta } from '@/hooks/useConfig'
import { formatCurrency, formatDate, filtrarHorariosDisponibles, generarHorarios } from '@/lib/format'
import { calcularCostoServicio, nuevaLineaReceta } from '@/lib/costoServicio'
import { comprimirImagen } from '@/lib/imagen'
import { SelectorDrive } from '@/components/SelectorDrive'
import { CobrarTurnoModal, linkWhatsapp } from '@/components/CobrarTurnoModal'
import { CalendarioTurnos } from '@/components/CalendarioTurnos'
import type { EstadoTurno, Pregunta, RecetaItem, Servicio, Turno } from '@/types'

const toneByEstado: Record<EstadoTurno, 'success' | 'warning' | 'danger'> = {
  confirmado: 'warning',
  completado: 'success',
  cancelado: 'danger',
}

function copiarLinkReserva() {
  const url = `${window.location.origin}/reservar`
  navigator.clipboard?.writeText(url)
}

export function Turnos() {
  const [tab, setTab] = useState<'agenda' | 'servicios'>('agenda')

  return (
    <div>
      <PageHeader
        title="Turnos"
        subtitle="Agenda y servicios disponibles para reserva online"
        action={
          <Button variant="secondary" onClick={copiarLinkReserva}>
            <Copy className="h-4 w-4" /> Copiar link de reserva
          </Button>
        }
      />

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab('agenda')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'agenda' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setTab('servicios')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'servicios' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Servicios
        </button>
      </div>

      {tab === 'agenda' ? <Agenda /> : <Servicios />}
    </div>
  )
}

function Agenda() {
  const { data: turnos, isLoading, error } = useTurnos()
  const updateTurno = useUpdateTurno()
  const deleteTurno = useDeleteTurno()
  const { data: servicios } = useServicios()
  const { data: config } = useConfig()
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista')
  const [turnoDetalle, setTurnoDetalle] = useState<Turno | null>(null)
  const [turnoCobrar, setTurnoCobrar] = useState<Turno | null>(null)
  const [turnoReprogramar, setTurnoReprogramar] = useState<Turno | null>(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

  return (
    <div>
      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}
      {turnos && turnos.length === 0 && (
        <EmptyState message="No hay turnos reservados todavía. Compartí el link de reserva con tus clientas." />
      )}

      {turnos && turnos.length > 0 && (
        <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setVista('lista')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              vista === 'lista' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setVista('calendario')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              vista === 'calendario' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Calendario
          </button>
        </div>
      )}

      {turnos && turnos.length > 0 && vista === 'calendario' && (
        <CalendarioTurnos
          turnos={turnos}
          fechasBloqueadas={config?.fechasBloqueadas || []}
          onSelectTurno={setTurnoDetalle}
          onCobrar={setTurnoCobrar}
          onReprogramar={setTurnoReprogramar}
          onCancelar={(id) => updateTurno.mutate({ id, estado: 'cancelado' })}
        />
      )}

      {turnos && turnos.length > 0 && vista === 'lista' && (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Clienta</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {turnos.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{formatDate(t.fecha)}</td>
                  <td className="px-4 py-3 text-slate-900">{t.hora}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setTurnoDetalle(t)}
                      className="flex items-center gap-1.5 font-medium text-slate-900 hover:text-primary-600"
                    >
                      {t.cliente}
                      {(t.alergias || t.condiciones) && (
                        <HeartPulse className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.servicio}</td>
                  <td className="px-4 py-3 text-slate-600">{t.telefono || t.email || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneByEstado[t.estado]}>{t.estado}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.estado === 'confirmado' && (
                      <div className="flex justify-end gap-3 text-xs font-medium">
                        <button
                          onClick={() => setTurnoReprogramar(t)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => setTurnoCobrar(t)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          Cobrar y finalizar
                        </button>
                        <button
                          onClick={() => updateTurno.mutate({ id: t.id, estado: 'cancelado' })}
                          className="text-red-500 hover:text-red-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {t.estado === 'completado' && t.telefono && (
                      <a
                        href={linkWhatsapp(
                          t.telefono,
                          `¡Hola ${t.cliente.split(' ')[0]}! Gracias por tu visita hoy 💜 Del 1 al 10, ¿qué tan probable es que nos recomiendes?`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Pedir opinión
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!turnoDetalle} onClose={() => { setTurnoDetalle(null); setConfirmandoEliminar(false) }} title={turnoDetalle?.cliente || ''}>
        {turnoDetalle && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Servicio</p>
              <p className="font-medium text-slate-900">
                {turnoDetalle.servicio} — {formatDate(turnoDetalle.fecha)} {turnoDetalle.hora}hs
              </p>
            </div>
            <div>
              <p className="text-slate-500">Contacto</p>
              <p className="text-slate-900">{turnoDetalle.telefono || '—'} {turnoDetalle.email && `· ${turnoDetalle.email}`}</p>
            </div>
            {turnoDetalle.fotoUrl && (
              <a href={turnoDetalle.fotoUrl} target="_blank" rel="noreferrer" className="block">
                <p className="mb-1.5 text-slate-500">Foto enviada</p>
                <span className="inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-slate-50">
                  Ver foto en Drive →
                </span>
              </a>
            )}
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 font-medium text-amber-800">
                <HeartPulse className="h-4 w-4" /> Ficha de salud
              </p>
              <p className="text-amber-900">
                <span className="font-medium">Alergias:</span> {turnoDetalle.alergias || 'No informó'}
              </p>
              <p className="text-amber-900">
                <span className="font-medium">Condiciones:</span> {turnoDetalle.condiciones || 'No informó'}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {turnoDetalle.consentimiento ? 'Consentimiento otorgado ✓' : 'Sin consentimiento registrado'}
              </p>
            </div>
            {Object.keys(turnoDetalle.respuestas || {}).length > 0 && (
              <div>
                <p className="mb-1.5 text-slate-500">Cuestionario previo</p>
                <div className="space-y-1">
                  {Object.entries(turnoDetalle.respuestas).map(([pregunta, respuesta]) => (
                    <div key={pregunta} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-slate-600">{pregunta}</span>
                      <Badge tone={respuesta === 'Sí' ? 'warning' : 'default'}>{respuesta}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {turnoDetalle.notas && (
              <div>
                <p className="text-slate-500">Notas</p>
                <p className="text-slate-900">{turnoDetalle.notas}</p>
              </div>
            )}
            {turnoDetalle.notaEncuesta !== null && (
              <div className="rounded-xl bg-primary-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-primary-800">
                  <Star className="h-4 w-4" /> Encuesta de satisfacción
                </p>
                <p className="text-primary-900">
                  Nota: <strong>{turnoDetalle.notaEncuesta}/10</strong>
                </p>
                {turnoDetalle.comentarioEncuesta && (
                  <p className="mt-1 text-primary-800">"{turnoDetalle.comentarioEncuesta}"</p>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-3">
              {!confirmandoEliminar ? (
                <button
                  onClick={() => setConfirmandoEliminar(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar este turno
                </button>
              ) : (
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="mb-2 text-xs text-red-700">
                    Esto borra el turno de la planilla para siempre, no se puede deshacer. ¿Seguro?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirmandoEliminar(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() =>
                        deleteTurno.mutate(turnoDetalle.id, {
                          onSuccess: () => {
                            setConfirmandoEliminar(false)
                            setTurnoDetalle(null)
                          },
                        })
                      }
                      disabled={deleteTurno.isPending}
                      className="!bg-red-600 hover:!bg-red-700"
                    >
                      {deleteTurno.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                    </Button>
                  </div>
                  {deleteTurno.isError && <ErrorBanner message={(deleteTurno.error as Error).message} />}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {turnoCobrar && (
        <CobrarTurnoModal
          turno={turnoCobrar}
          precioSugerido={servicios?.find((s) => s.nombre === turnoCobrar.servicio)?.precio}
          onClose={() => setTurnoCobrar(null)}
        />
      )}

      {turnoReprogramar && (
        <ReprogramarModal turno={turnoReprogramar} onClose={() => setTurnoReprogramar(null)} />
      )}
    </div>
  )
}

function ReprogramarModal({ turno, onClose }: { turno: Turno; onClose: () => void }) {
  const updateTurno = useUpdateTurno()
  const { data: config } = useConfig()
  const [fecha, setFecha] = useState(turno.fecha)
  const [hora, setHora] = useState(turno.hora)

  const { data: turnosDelDia } = useTurnos({ desde: fecha, hasta: fecha }, !!fecha)
  const todosLosHorarios = config
    ? generarHorarios(config.turnos.horaInicio, config.turnos.horaFin, config.turnos.duracionSlot)
    : []
  const horariosDisponibles = filtrarHorariosDisponibles(
    todosLosHorarios,
    turno.duracion || 60,
    config?.turnos.horaFin || '18:00',
    (turnosDelDia || [])
      .filter((t) => t.estado !== 'cancelado' && t.id !== turno.id)
      .map((t) => ({ hora: t.hora, duracion: t.duracion || 60 }))
  )

  function confirmar() {
    updateTurno.mutate({ id: turno.id, fecha, hora }, { onSuccess: onClose })
  }

  return (
    <Modal open onClose={onClose} title={`Reprogramar: ${turno.cliente}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {turno.servicio} — actualmente {formatDate(turno.fecha)} a las {turno.hora}hs
        </p>
        <Input label="Nueva fecha" type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setHora('') }} />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Nuevo horario</span>
          {horariosDisponibles.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              No quedan horarios libres ese día para la duración de este servicio.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {horariosDisponibles.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                    hora === h ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>
        {updateTurno.isError && <ErrorBanner message={(updateTurno.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!fecha || !hora || updateTurno.isPending}>
            {updateTurno.isPending ? 'Guardando...' : 'Confirmar nuevo horario'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Servicios() {
  const { data: servicios, isLoading, error } = useServicios()
  const addServicio = useAddServicio()
  const updateServicio = useUpdateServicio()
  const paleta = usePaleta()
  const [open, setOpen] = useState(false)
  const [servicioEdit, setServicioEdit] = useState<Servicio | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    addServicio.mutate(
      {
        nombre: String(form.get('nombre')),
        duracion: Number(form.get('duracion')),
        precio: Number(form.get('precio')),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo servicio
        </Button>
      </div>

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {servicios && servicios.length === 0 && <EmptyState message="Todavía no cargaste servicios." />}

      {servicios && servicios.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {servicios.map((s, i) => {
            const c = paleta[i % paleta.length]
            return (
              <Card key={s.id} className="border-l-4 p-4" style={{ backgroundColor: c.bg, borderLeftColor: c.dot, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}>
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => setServicioEdit(s)} className="min-w-0 flex-1 text-left">
                    <p className="font-medium hover:opacity-70" style={{ color: c.text }}>{s.nombre}</p>
                    <p className="text-sm opacity-70" style={{ color: c.text }}>
                      {s.duracion} min · {formatCurrency(s.precio)}
                    </p>
                  </button>
                  <button
                    onClick={() => updateServicio.mutate({ id: s.id, activo: !s.activo })}
                    className="shrink-0"
                  >
                    <Badge tone={s.activo ? 'success' : 'default'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </button>
                </div>
              <div className="mt-2 flex items-center gap-3 text-xs opacity-60" style={{ color: c.text }}>
                {s.descripcion && <span>Con descripción</span>}
                {s.cuidados.antes.length > 0 && <span>· Cuidados cargados</span>}
                {s.preguntas.length > 0 && <span>· {s.preguntas.length} preguntas previas</span>}
                <button onClick={() => setServicioEdit(s)} className="ml-auto flex items-center gap-1 font-medium opacity-100 hover:underline" style={{ color: c.text }}>
                  <Pencil className="h-3 w-3" /> Editar
                </button>
              </div>
            </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo servicio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" name="nombre" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duración (min)" name="duracion" type="number" required />
            <Input label="Precio" name="precio" type="number" step="0.01" required />
          </div>
          <p className="text-xs text-slate-400">
            Después de crearlo podés sumarle descripción, cuidados post-servicio y preguntas previas tocando "Editar".
          </p>
          {addServicio.isError && <ErrorBanner message={(addServicio.error as Error).message} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addServicio.isPending}>
              {addServicio.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {servicioEdit && (
        <EditarServicioModal servicio={servicioEdit} onClose={() => setServicioEdit(null)} />
      )}
    </div>
  )
}

function listaATexto(lista: string[]) {
  return lista.join('\n')
}

function textoALista(texto: string) {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function EditarServicioModal({ servicio, onClose }: { servicio: Servicio; onClose: () => void }) {
  const updateServicio = useUpdateServicio()
  const { data: insumos } = useInsumos(true)

  const [nombre, setNombre] = useState(servicio.nombre)
  const [descripcion, setDescripcion] = useState(servicio.descripcion)
  const [duracion, setDuracion] = useState(servicio.duracion)
  const [precio, setPrecio] = useState(servicio.precio)
  const [cuidadosAntes, setCuidadosAntes] = useState(listaATexto(servicio.cuidados.antes))
  const [cuidadosDespues, setCuidadosDespues] = useState(listaATexto(servicio.cuidados.despues))
  const [cuidadosImportante, setCuidadosImportante] = useState(servicio.cuidados.importante)
  const [preguntas, setPreguntas] = useState<Pregunta[]>(servicio.preguntas)
  const [costoManoObra, setCostoManoObra] = useState(servicio.costoManoObra || 0)
  const [receta, setReceta] = useState<RecetaItem[]>(servicio.receta || [])
  const [insumoNuevo, setInsumoNuevo] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(servicio.fotoUrl || null)
  const [fotoBase64, setFotoBase64] = useState<string | null>(null)
  const [fotoDriveUrl, setFotoDriveUrl] = useState<string | null>(null)
  const [comprimiendoFoto, setComprimiendoFoto] = useState(false)

  const costo = calcularCostoServicio({ ...servicio, precio, costoManoObra, receta }, insumos)

  function agregarInsumoALaReceta() {
    const insumo = insumos?.find((i) => i.id === insumoNuevo)
    if (!insumo) return
    setReceta((prev) => [...prev, nuevaLineaReceta(insumo)])
    setInsumoNuevo('')
  }

  function actualizarLinea(idx: number, cambios: Partial<RecetaItem>) {
    setReceta((prev) => prev.map((l, i) => (i === idx ? { ...l, ...cambios } : l)))
  }

  function quitarLinea(idx: number) {
    setReceta((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateServicio.mutate(
      {
        id: servicio.id,
        nombre,
        descripcion,
        duracion,
        precio,
        cuidados: {
          antes: textoALista(cuidadosAntes),
          despues: textoALista(cuidadosDespues),
          importante: cuidadosImportante,
        },
        preguntas,
        costoManoObra,
        receta,
        ...(fotoBase64 ? { fotoBase64, fotoMimeType: 'image/jpeg', fotoNombre: 'foto.jpg' } : {}),
        ...(fotoDriveUrl ? { fotoUrlExistente: fotoDriveUrl } : {}),
      },
      { onSuccess: onClose }
    )
  }

  async function handleFoto(file: File) {
    setComprimiendoFoto(true)
    try {
      const base64 = await comprimirImagen(file)
      setFotoBase64(base64)
      setFotoPreview(`data:image/jpeg;base64,${base64}`)
    } finally {
      setComprimiendoFoto(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Editar: ${servicio.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Foto <span className="font-normal text-slate-400">(se muestra al reservar el turno)</span>
          </span>
          {!fotoPreview ? (
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-4 text-slate-400 hover:border-slate-400 hover:text-slate-500">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">{comprimiendoFoto ? 'Procesando...' : 'Tocá para subir una foto'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={comprimiendoFoto}
                onChange={(e) => e.target.files?.[0] && handleFoto(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="relative inline-block">
              <img src={fotoPreview} alt="Foto del servicio" className="h-20 w-20 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => { setFotoBase64(null); setFotoPreview(null) }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="mt-1.5">
            <SelectorDrive
              onSeleccionar={(url) => { setFotoBase64(null); setFotoPreview(url); setFotoDriveUrl(url) }}
              disabled={comprimiendoFoto}
            />
          </div>
        </div>

        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Descripción</span>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            placeholder="Lo que ve la clienta al elegir este servicio"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Duración (min)" type="number" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} required />
          <Input label="Precio" type="number" step="0.01" value={precio} onChange={(e) => setPrecio(Number(e.target.value))} required />
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-1 text-sm font-medium text-slate-700">
            Costo real y margen — qué insumos usa este servicio
          </p>
          <p className="mb-3 text-xs text-slate-500">
            Ej: una tinta de $3.000 que rinde para 3 clientas cuesta $1.000 por servicio. Cargá tus insumos (tinta,
            pinceles, guantes, etc.) en la pestaña <strong>Insumos</strong> de Productos, con su precio de costo y
            stock — después van a aparecer acá para elegir.
          </p>

          {receta.length > 0 && (
            <div className="mb-3 space-y-2">
              {receta.map((linea, idx) => {
                const insumoLinea = insumos?.find((i) => i.id === linea.insumoId)
                const costoLinea = insumoLinea
                  ? (insumoLinea.precioCosto / (linea.rendimiento || 1)) * linea.cantidadPorServicio
                  : 0
                return (
                  <div key={linea.insumoId} className="rounded-lg bg-slate-50 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{linea.nombre}</span>
                      <button type="button" onClick={() => quitarLinea(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-xs text-slate-500">¿Para cuántos servicios rinde?</span>
                        <input
                          type="number"
                          min={1}
                          value={linea.rendimiento}
                          onChange={(e) => actualizarLinea(idx, { rendimiento: Number(e.target.value) || 1 })}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-slate-500">Cuántas unidades usás por vez</span>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={linea.cantidadPorServicio}
                          onChange={(e) => actualizarLinea(idx, { cantidadPorServicio: Number(e.target.value) || 0 })}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                    {insumoLinea && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {formatCurrency(insumoLinea.precioCosto)} ÷ {linea.rendimiento} ={' '}
                        <strong className="text-slate-700">{formatCurrency(costoLinea)} por este servicio</strong>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={insumoNuevo}
              onChange={(e) => setInsumoNuevo(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Elegí un insumo ya cargado...</option>
              {insumos
                ?.filter((i) => !receta.some((l) => l.insumoId === i.id))
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} — costo {formatCurrency(i.precioCosto)}
                  </option>
                ))}
            </select>
            <Button type="button" variant="secondary" onClick={agregarInsumoALaReceta}>
              Agregar
            </Button>
          </div>
          {insumos?.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Todavía no tenés insumos cargados. Andá a Productos → pestaña Insumos → Nuevo insumo y cargá la tinta,
              la keratina, etc., con su precio de costo — después va a aparecer acá para elegir.
            </p>
          )}

          <div className="mt-3">
            <Input
              label="Costo de mano de obra por servicio ($)"
              type="number"
              step="0.01"
              value={costoManoObra || ''}
              onChange={(e) => setCostoManoObra(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="mt-3 space-y-1 rounded-lg bg-primary-50 p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Costo insumos</span>
              <span>{formatCurrency(costo.costoInsumos)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Costo mano de obra</span>
              <span>{formatCurrency(costo.costoManoObra)}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-800">
              <span>Costo total</span>
              <span>{formatCurrency(costo.costoTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-primary-200 pt-1 font-semibold text-primary-800">
              <span>Margen real</span>
              <span>{costo.margenReal.toFixed(1)}% ({formatCurrency(costo.gananciaReal)})</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-3 text-sm font-medium text-slate-700">Guía de cuidados (editable, la recibe la clienta por mail al finalizar)</p>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Durante las primeras 24 hs (una línea por punto)</span>
            <textarea
              value={cuidadosAntes}
              onChange={(e) => setCuidadosAntes(e.target.value)}
              rows={4}
              placeholder={'No mojar la zona.\nNo aplicar aceites ni cremas.\n...'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Después de las 24 hs (una línea por punto)</span>
            <textarea
              value={cuidadosDespues}
              onChange={(e) => setCuidadosDespues(e.target.value)}
              rows={3}
              placeholder={'Aplicar serum nutritivo.\nPeinar diariamente.'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Nota "Importante" (duración del efecto, etc.)</span>
            <textarea
              value={cuidadosImportante}
              onChange={(e) => setCuidadosImportante(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Preguntas previas al turno</span>

          {preguntas.length > 0 && (
            <div className="mb-2 space-y-2">
              {preguntas.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                  <input
                    value={p.texto}
                    onChange={(e) =>
                      setPreguntas((prev) => prev.map((q, i) => (i === idx ? { ...q, texto: e.target.value } : q)))
                    }
                    placeholder="Texto de la pregunta"
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <select
                    value={p.tipo}
                    onChange={(e) =>
                      setPreguntas((prev) =>
                        prev.map((q, i) => (i === idx ? { ...q, tipo: e.target.value as 'si_no' | 'texto' } : q))
                      )
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="si_no">Sí / No</option>
                    <option value="texto">Respuesta libre</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setPreguntas((prev) => prev.filter((_, i) => i !== idx))}
                    className="shrink-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => setPreguntas((prev) => [...prev, { texto: '', tipo: 'si_no' }])}
          >
            <Plus className="h-3.5 w-3.5" /> Agregar pregunta
          </Button>
          <p className="mt-1.5 text-xs text-slate-400">
            "Sí / No" muestra dos botones. "Respuesta libre" deja un campo de texto — usalo para preguntas como
            "¿Cuál producto usás?".
          </p>
        </div>

        {updateServicio.isError && <ErrorBanner message={(updateServicio.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateServicio.isPending}>
            {updateServicio.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
