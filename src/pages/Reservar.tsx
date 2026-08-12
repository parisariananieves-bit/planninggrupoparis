import { useMemo, useState } from 'react'
import { Camera, Check, ChevronLeft, Clock, HeartPulse, MessageCircle, Sparkles, Star, X } from 'lucide-react'
import { useAddTurno, useServicios, useTurnos } from '@/hooks/useEntities'
import { useConfig, usePaleta } from '@/hooks/useConfig'
import { Button, ErrorBanner, Input } from '@/components/ui'
import { ImagenConFallback } from '@/components/ImagenConFallback'
import { formatCurrency, filtrarHorariosDisponibles, generarHorarios } from '@/lib/format'
import { comprimirImagen } from '@/lib/imagen'
import type { Servicio } from '@/types'

export function Reservar() {
  const { data: config } = useConfig()
  const { data: servicios, isLoading } = useServicios(true)
  const addTurno = useAddTurno()
  const paleta = usePaleta()

  const requiereSalud = config?.turnos?.requiereFichaSalud ?? true
  const totalPasos = requiereSalud ? 4 : 3
  const pasoConfirmacion = totalPasos + 1

  const [paso, setPaso] = useState(1)
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [alergias, setAlergias] = useState('')
  const [condiciones, setCondiciones] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [fotoBase64, setFotoBase64] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoError, setFotoError] = useState<string | null>(null)
  const [comprimiendoFoto, setComprimiendoFoto] = useState(false)

  const logoSrc = config?.logoUrl?.trim() || '/logo.png'
  const minFecha = new Date().toISOString().split('T')[0]

  const todosLosHorarios = useMemo(
    () =>
      config
        ? generarHorarios(config.turnos.horaInicio, config.turnos.horaFin, config.turnos.duracionSlot)
        : [],
    [config]
  )

  const { data: turnosDelDia, isLoading: cargandoHorarios } = useTurnos(
    { desde: fecha, hasta: fecha },
    !!fecha
  )
  const fechaBloqueada = !!fecha && (config?.fechasBloqueadas || []).includes(fecha)

  const horariosDisponibles = servicioSel && !fechaBloqueada
    ? filtrarHorariosDisponibles(
        todosLosHorarios,
        servicioSel.duracion || 60,
        config?.turnos.horaFin || '18:00',
        (turnosDelDia || [])
          .filter((t) => t.estado !== 'cancelado')
          .map((t) => ({ hora: t.hora, duracion: t.duracion || 60 }))
      )
    : []

  async function handleFoto(file: File) {
    setFotoError(null)
    setComprimiendoFoto(true)
    try {
      const base64 = await comprimirImagen(file)
      setFotoBase64(base64)
      setFotoPreview(`data:image/jpeg;base64,${base64}`)
    } catch {
      setFotoError('No pudimos procesar esa imagen, probá con otra.')
    } finally {
      setComprimiendoFoto(false)
    }
  }

  function confirmar() {
    if (!servicioSel || !fecha || !hora || !cliente) return
    if (requiereSalud && !consentimiento) return
    addTurno.mutate(
      {
        fecha,
        hora,
        cliente,
        telefono,
        email,
        servicio: servicioSel.nombre,
        alergias,
        condiciones,
        consentimiento,
        respuestas,
        ...(fotoBase64 ? { fotoBase64, fotoMimeType: 'image/jpeg', fotoNombre: `${cliente}.jpg` } : {}),
      },
      { onSuccess: () => setPaso(pasoConfirmacion) }
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F7F5] px-4 py-8">
      {/* Fondo decorativo con manchas de color difuminadas, igual que Login/Tienda */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent-500/12 blur-3xl" />

      <div className="relative mx-auto max-w-lg">
        {paso < pasoConfirmacion && (
          <a
            href={paso === 1 ? '/login' : undefined}
            onClick={paso > 1 ? (e) => { e.preventDefault(); setPaso(paso - 1) } : undefined}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" /> {paso === 1 ? 'Volver al inicio' : 'Volver'}
          </a>
        )}

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-white p-1.5 shadow-lg">
            <img src={logoSrc} alt={config?.nombreNegocio} className="h-16 w-16 rounded-full object-contain" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            {config?.nombreNegocio || 'Oletha Beauty'}
          </h1>
          {paso < pasoConfirmacion && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary-700">
              <Sparkles className="h-3.5 w-3.5" /> Reservá tu turno online
            </p>
          )}
        </div>

        {paso < pasoConfirmacion && (
          <div className="mb-5 flex items-center justify-center gap-2">
            {Array.from({ length: totalPasos }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 max-w-12 rounded-full transition-all ${
                  i + 1 < paso ? 'bg-primary-500' : i + 1 === paso ? 'bg-primary-600 shadow-sm' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl">
          {paso === 1 && (
            <StepServicio
              servicios={servicios}
              isLoading={isLoading}
              seleccionado={servicioSel}
              onSelect={setServicioSel}
              onContinuar={() => setPaso(2)}
              politicas={config?.turnos?.politicasReserva}
              whatsappContacto={config?.whatsappContacto}
              paleta={paleta}
            />
          )}

          {paso === 2 && (
            <StepFechaHora
              fecha={fecha}
              hora={hora}
              minFecha={minFecha}
              horarios={horariosDisponibles}
              fechaBloqueada={fechaBloqueada}
              cargandoHorarios={fecha ? cargandoHorarios : false}
              onFecha={(v) => { setFecha(v); setHora('') }}
              onHora={setHora}
              onVolver={() => setPaso(1)}
              onContinuar={() => setPaso(3)}
            />
          )}

          {paso === 3 && (
            <StepDatos
              cliente={cliente}
              telefono={telefono}
              email={email}
              onCliente={setCliente}
              onTelefono={setTelefono}
              onEmail={setEmail}
              onVolver={() => setPaso(2)}
              esUltimoPaso={!requiereSalud}
              onContinuar={() => (requiereSalud ? setPaso(4) : confirmar())}
              cargando={!requiereSalud && addTurno.isPending}
              error={!requiereSalud && addTurno.isError ? (addTurno.error as Error).message : null}
            />
          )}

          {paso === 4 && requiereSalud && (
            <StepSalud
              servicio={servicioSel}
              alergias={alergias}
              condiciones={condiciones}
              consentimiento={consentimiento}
              respuestas={respuestas}
              fotoPreview={fotoPreview}
              comprimiendoFoto={comprimiendoFoto}
              fotoError={fotoError}
              onFoto={handleFoto}
              onQuitarFoto={() => { setFotoBase64(null); setFotoPreview(null) }}
              onAlergias={setAlergias}
              onCondiciones={setCondiciones}
              onConsentimiento={setConsentimiento}
              onRespuesta={(pregunta, valor) => setRespuestas((prev) => ({ ...prev, [pregunta]: valor }))}
              onVolver={() => setPaso(3)}
              onConfirmar={confirmar}
              cargando={addTurno.isPending}
              error={addTurno.isError ? (addTurno.error as Error).message : null}
            />
          )}

          {paso === pasoConfirmacion && servicioSel && (
            <StepConfirmacion servicio={servicioSel.nombre} fecha={fecha} hora={hora} conFichaSalud={requiereSalud} />
          )}
        </div>
      </div>
    </div>
  )
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}

function StepServicio({
  servicios,
  isLoading,
  seleccionado,
  onSelect,
  onContinuar,
  politicas,
  whatsappContacto,
  paleta,
}: {
  servicios?: Servicio[]
  isLoading: boolean
  seleccionado: Servicio | null
  onSelect: (s: Servicio) => void
  onContinuar: () => void
  politicas?: string
  whatsappContacto?: string
  paleta: ReturnType<typeof usePaleta>
}) {
  return (
    <div>
      <StepHeader title="Elegí tu servicio" subtitle="¿Qué te gustaría hacerte?" />
      {isLoading && <p className="text-sm text-slate-400">Cargando servicios...</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {servicios?.map((s, i) => {
          const c = paleta[i % paleta.length]
          const activo = seleccionado?.id === s.id
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => onSelect(s)}
              className={`overflow-hidden rounded-2xl border-2 text-left text-sm transition-all ${
                activo ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.01] hover:shadow-md'
              }`}
              style={{
                backgroundColor: activo ? c.bg : '#fff',
                borderColor: activo ? c.dot : '#e2e8f0',
              }}
            >
              {s.fotoUrl && (
                <ImagenConFallback
                  src={s.fotoUrl}
                  alt={s.nombre}
                  className="h-28 w-full object-cover"
                  Icono={Sparkles}
                  iconoClassName="h-8 w-8 text-primary-200"
                />
              )}
              <div className="p-3.5">
                <p className="font-semibold" style={{ color: activo ? c.text : '#0f172a' }}>{s.nombre}</p>
                <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: activo ? c.text : '#64748b' }}>
                  <Clock className="h-3 w-3" /> {s.duracion} min · <strong>{formatCurrency(s.precio)}</strong>
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {seleccionado?.descripcion && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{seleccionado.descripcion}</p>
      )}

      {politicas && (
        <p className="mt-3 text-xs text-slate-400">
          <span className="font-medium text-slate-500">Antes de reservar: </span>
          {politicas}
        </p>
      )}

      <Button className="mt-5 w-full justify-center py-3.5 text-base font-semibold" disabled={!seleccionado} onClick={onContinuar}>
        Continuar
      </Button>

      {whatsappContacto && (
        <a
          href={`https://wa.me/${String(whatsappContacto || '').replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola! Tengo una consulta antes de reservar mi turno.')}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <MessageCircle className="h-4 w-4" /> ¿Preguntas? Escribinos por WhatsApp
        </a>
      )}
    </div>
  )
}

function StepFechaHora({
  fecha,
  hora,
  minFecha,
  horarios,
  fechaBloqueada,
  cargandoHorarios,
  onFecha,
  onHora,
  onVolver,
  onContinuar,
}: {
  fecha: string
  hora: string
  minFecha: string
  horarios: string[]
  fechaBloqueada: boolean
  cargandoHorarios: boolean
  onFecha: (v: string) => void
  onHora: (v: string) => void
  onVolver: () => void
  onContinuar: () => void
}) {
  return (
    <div>
      <StepHeader title="Elegí día y horario" subtitle="¿Cuándo te queda mejor?" />
      <div className="space-y-4">
        <Input label="Fecha" type="date" min={minFecha} value={fecha} onChange={(e) => onFecha(e.target.value)} required />
        {fecha && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Horario</span>
            {fechaBloqueada && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Ese día no atendemos. Elegí otra fecha, por favor.
              </p>
            )}
            {!fechaBloqueada && cargandoHorarios && <p className="text-sm text-slate-400">Buscando horarios disponibles...</p>}
            {!fechaBloqueada && !cargandoHorarios && horarios.length === 0 && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                No quedan horarios libres ese día. Probá con otra fecha.
              </p>
            )}
            {!fechaBloqueada && !cargandoHorarios && horarios.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {horarios.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => onHora(h)}
                    className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                      hora === h
                        ? 'scale-[1.03] border-primary-500 bg-primary-500 text-white shadow-md'
                        : 'border-slate-200 text-slate-600 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    {h}hs
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" onClick={onVolver}>
          <ChevronLeft className="h-4 w-4" /> Volver
        </Button>
        <Button className="flex-1 justify-center py-3.5 text-base font-semibold" disabled={!fecha || !hora} onClick={onContinuar}>
          Continuar
        </Button>
      </div>
    </div>
  )
}

function StepDatos({
  cliente,
  telefono,
  email,
  onCliente,
  onTelefono,
  onEmail,
  onVolver,
  onContinuar,
  esUltimoPaso,
  cargando,
  error,
}: {
  cliente: string
  telefono: string
  email: string
  onCliente: (v: string) => void
  onTelefono: (v: string) => void
  onEmail: (v: string) => void
  onVolver: () => void
  onContinuar: () => void
  esUltimoPaso: boolean
  cargando: boolean
  error: string | null
}) {
  return (
    <div>
      <StepHeader title="Tus datos" subtitle="Para poder confirmarte el turno" />
      <div className="space-y-4">
        <Input label="Tu nombre" value={cliente} onChange={(e) => onCliente(e.target.value)} required />
        <Input label="Teléfono / WhatsApp" value={telefono} onChange={(e) => onTelefono(e.target.value)} />
        <Input label="Email (opcional)" type="email" value={email} onChange={(e) => onEmail(e.target.value)} />
      </div>
      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" onClick={onVolver}>
          <ChevronLeft className="h-4 w-4" /> Volver
        </Button>
        <Button className="flex-1 justify-center py-3.5 text-base font-semibold" disabled={!cliente || cargando} onClick={onContinuar}>
          {esUltimoPaso ? (cargando ? 'Reservando...' : 'Confirmar turno') : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}

function StepSalud({
  servicio,
  alergias,
  condiciones,
  consentimiento,
  respuestas,
  fotoPreview,
  comprimiendoFoto,
  fotoError,
  onFoto,
  onQuitarFoto,
  onAlergias,
  onCondiciones,
  onConsentimiento,
  onRespuesta,
  onVolver,
  onConfirmar,
  cargando,
  error,
}: {
  servicio: Servicio | null
  alergias: string
  condiciones: string
  consentimiento: boolean
  respuestas: Record<string, string>
  fotoPreview: string | null
  comprimiendoFoto: boolean
  fotoError: string | null
  onFoto: (file: File) => void
  onQuitarFoto: () => void
  onAlergias: (v: string) => void
  onCondiciones: (v: string) => void
  onConsentimiento: (v: boolean) => void
  onRespuesta: (pregunta: string, valor: string) => void
  onVolver: () => void
  onConfirmar: () => void
  cargando: boolean
  error: string | null
}) {
  const preguntas = servicio?.preguntas || []
  const faltaResponder = preguntas.some((p) => !respuestas[p.texto])

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">Ficha de salud</h2>
          <p className="text-sm text-slate-500">Nos ayuda a cuidarte mejor durante el servicio</p>
        </div>
      </div>

      <div className="space-y-4">
        {preguntas.length > 0 && (
          <div className="space-y-3">
            {preguntas.map((pregunta) => (
              <div key={pregunta.texto} className="rounded-2xl border border-slate-200 p-3">
                <p className="mb-2 text-sm text-slate-700">{pregunta.texto}</p>
                {pregunta.tipo === 'texto' ? (
                  <input
                    type="text"
                    value={respuestas[pregunta.texto] || ''}
                    onChange={(e) => onRespuesta(pregunta.texto, e.target.value)}
                    placeholder="Tu respuesta..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                ) : (
                  <div className="flex gap-2">
                    {['Sí', 'No'].map((opcion) => (
                      <button
                        type="button"
                        key={opcion}
                        onClick={() => onRespuesta(pregunta.texto, opcion)}
                        className={`flex-1 rounded-xl border-2 py-1.5 text-sm font-semibold transition-all ${
                          respuestas[pregunta.texto] === opcion
                            ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">¿Tenés alguna alergia?</span>
          <textarea
            value={alergias}
            onChange={(e) => onAlergias(e.target.value)}
            placeholder="Ej: alergia a algún producto, pegamento, látex... (dejalo vacío si no tenés)"
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">¿Alguna otra condición que debamos saber?</span>
          <textarea
            value={condiciones}
            onChange={(e) => onCondiciones(e.target.value)}
            placeholder="Lo que quieras contarnos antes del turno (opcional)"
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Foto sin maquillaje ni filtros <span className="font-normal text-slate-400">(opcional, nos ayuda a preparar tu turno)</span>
          </span>

          {!fotoPreview ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 py-6 text-primary-400 hover:border-primary-300 hover:text-primary-500">
              <Camera className="h-6 w-6" />
              <span className="text-xs font-medium">{comprimiendoFoto ? 'Procesando...' : 'Tocá para subir una foto'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={comprimiendoFoto}
                onChange={(e) => e.target.files?.[0] && onFoto(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="relative inline-block">
              <img src={fotoPreview} alt="Foto subida" className="h-28 w-28 rounded-2xl object-cover shadow-md" />
              <button
                type="button"
                onClick={onQuitarFoto}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {fotoError && <p className="mt-1.5 text-xs text-red-600">{fotoError}</p>}
        </div>

        <label className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => onConsentimiento(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-xs text-slate-600">
            Confirmo que la información es correcta y autorizo su uso para brindarme el servicio de forma segura.
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" onClick={onVolver}>
          <ChevronLeft className="h-4 w-4" /> Volver
        </Button>
        <Button
          className="flex-1 justify-center py-3.5 text-base font-semibold"
          disabled={!consentimiento || faltaResponder || cargando}
          onClick={onConfirmar}
        >
          {cargando ? 'Reservando...' : 'Confirmar turno'}
        </Button>
      </div>
    </div>
  )
}

function StepConfirmacion({
  servicio,
  fecha,
  hora,
  conFichaSalud,
}: {
  servicio: string
  fecha: string
  hora: string
  conFichaSalud: boolean
}) {
  return (
    <div>
      <div className="flex flex-col items-center py-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg">
          <Check className="h-9 w-9" />
        </div>
        <p className="font-serif text-2xl font-bold text-slate-900">¡Turno confirmado!</p>
        <p className="mt-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
          {servicio} · {fecha} a las {hora}hs
        </p>
      </div>

      <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <MessageCircle className="h-3.5 w-3.5" /> Te contactamos para confirmar por WhatsApp
        </p>
        {conFichaSalud && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <HeartPulse className="h-3.5 w-3.5" /> Tu ficha de salud quedó guardada junto a tu turno
          </p>
        )}
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Star className="h-3.5 w-3.5" /> Al finalizar te vamos a pedir tu opinión
        </p>
      </div>

      <Button variant="secondary" className="mt-5 w-full justify-center py-3 text-base" onClick={() => window.location.reload()}>
        Reservar otro turno
      </Button>
      <a href="/login" className="mt-3 block text-center text-sm text-slate-400 hover:text-slate-600">
        Volver al inicio
      </a>
    </div>
  )
}
