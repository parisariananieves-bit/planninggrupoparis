import { useEffect, useState } from 'react'
import { Save, Palette, Store, Percent, CreditCard, ImageIcon, Users as UsersIcon, Plus, Pencil, CalendarClock, Calculator, CalendarOff, X, Globe, Tag } from 'lucide-react'
import { useConfig, useUpdateConfig } from '@/hooks/useConfig'
import { useAddUsuario, useUpdateUsuario, useUsuarios } from '@/hooks/useEntities'
import { useAuth } from '@/context/AuthContext'
import { Badge, Button, Card, ErrorBanner, Input, Modal, PageHeader } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatDate } from '@/lib/format'
import { comprimirImagen } from '@/lib/imagen'
import { SelectorDrive } from '@/components/SelectorDrive'
import type { Config, ModuloKey, Usuario } from '@/types'
import { MODULOS } from '@/types'

const MEDIOS_PAGO_LABELS: { key: keyof Config['comisiones']; label: string }[] = [
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'debito', label: 'Débito' },
  { key: 'credito1', label: 'Crédito 1 pago' },
  { key: 'credito3', label: 'Crédito 3 cuotas' },
  { key: 'credito6', label: 'Crédito 6 cuotas' },
  { key: 'mercadoPago', label: 'Mercado Pago' },
  { key: 'transferencia', label: 'Transferencia' },
  { key: 'cuentaCorriente', label: 'Cuenta corriente' },
]

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Store; title: string; subtitle: string }) {
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

const CONFIG_TURNOS_POR_DEFECTO: Config['turnos'] = {
  horaInicio: '09:00',
  horaFin: '18:00',
  duracionSlot: 60,
  requiereFichaSalud: true,
  politicasReserva: '',
}

export function Configuracion() {
  const { data: config, isLoading, error } = useConfig()
  const update = useUpdateConfig()
  const { tienePermiso } = useAuth()

  const [form, setForm] = useState<Config | null>(null)
  const [nuevaFechaBloqueada, setNuevaFechaBloqueada] = useState('')
  const [nuevoCanal, setNuevoCanal] = useState('')
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)

  useEffect(() => {
    // Si el backend todavía no tiene algún campo nuevo (falta redesplegar
    // Apps Script), completamos con valores por defecto en vez de romper.
    if (config) {
      setForm({
        ...config,
        whatsappContacto: config.whatsappContacto ?? '',
        turnos: { ...CONFIG_TURNOS_POR_DEFECTO, ...(config.turnos || {}) },
        fechasBloqueadas: config.fechasBloqueadas ?? [],
        sitioUrl: config.sitioUrl ?? '',
        mensajeBanner: config.mensajeBanner ?? '',
        canalesVenta: config.canalesVenta ?? [],
        googleClientId: config.googleClientId ?? '',
        googleApiKey: config.googleApiKey ?? '',
      })
    }
  }, [config])

  if (isLoading) return <Spinner full />
  if (error) return <ErrorBanner message={(error as Error).message} />
  if (!form) return null

  function setField<K extends keyof Config>(key: K, value: Config[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function setComision(key: keyof Config['comisiones'], value: number) {
    setForm((prev) => (prev ? { ...prev, comisiones: { ...prev.comisiones, [key]: value } } : prev))
  }

  function setTurnosField<K extends keyof Config['turnos']>(key: K, value: Config['turnos'][K]) {
    setForm((prev) => (prev ? { ...prev, turnos: { ...prev.turnos, [key]: value } } : prev))
  }

  function handleSave() {
    if (!form) return
    update.mutate(
      { ...form, ...(logoBase64 ? { logoBase64, logoMimeType: 'image/jpeg', logoNombre: 'logo.jpg' } : {}) },
      { onSuccess: () => setLogoBase64(null) }
    )
  }

  async function handleLogo(file: File) {
    setSubiendoLogo(true)
    try {
      const base64 = await comprimirImagen(file)
      setLogoBase64(base64)
    } finally {
      setSubiendoLogo(false)
    }
  }

  const logoPreview = logoBase64 ? `data:image/jpeg;base64,${logoBase64}` : form.logoUrl?.trim() || '/logo.png'

  return (
    <div className="pb-24">
      <PageHeader title="Configuración" subtitle="Personalizá tu negocio, sin depender de nadie más" />

      <div className="space-y-6">
        {/* Identidad de marca */}
        <Card className="p-5 md:p-6">
          <SectionHeader icon={Palette} title="Identidad de marca" subtitle="Logo y colores que ve todo el equipo" />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <ImageIcon className="h-3 w-3" /> Vista previa
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Logo</span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {subiendoLogo ? 'Procesando...' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={subiendoLogo}
                      onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
                    />
                  </label>
                  <SelectorDrive
                    onSeleccionar={(url) => { setLogoBase64(null); setField('logoUrl', url) }}
                    disabled={subiendoLogo}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Se guarda automáticamente al tocar "Guardar cambios" más abajo. Esta es la imagen que se usa en
                  toda la app y también en los mails que se mandan a las clientas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorField
                  label="Color primario"
                  value={form.colorPrimario}
                  onChange={(v) => setField('colorPrimario', v)}
                />
                <ColorField
                  label="Color secundario"
                  value={form.colorSecundario}
                  onChange={(v) => setField('colorSecundario', v)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Datos del negocio */}
        <Card className="p-5 md:p-6">
          <SectionHeader icon={Store} title="Datos del negocio" subtitle="Nombre y contacto" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nombre del negocio"
              value={form.nombreNegocio}
              onChange={(e) => setField('nombreNegocio', e.target.value)}
            />
            <Input
              label="Email de notificaciones"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
            <div>
              <Input
                label="WhatsApp de contacto"
                value={form.whatsappContacto}
                onChange={(e) => setField('whatsappContacto', e.target.value)}
                placeholder="5492664123456"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Con código de país, sin +, espacios ni guiones. Aparece como botón en la reserva pública para que te escriban directo.
              </p>
            </div>
          </div>
        </Card>

        {/* Impuestos */}
        <Card className="p-5 md:p-6">
          <SectionHeader icon={Percent} title="Impuestos" subtitle="Se aplica automáticamente en cada venta" />
          <div className="max-w-xs">
            <Input
              label="IVA (%)"
              type="number"
              step="0.01"
              value={form.iva}
              onChange={(e) => setField('iva', Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Rentabilidad */}
        <Card className="p-5 md:p-6">
          <SectionHeader icon={Calculator} title="Rentabilidad" subtitle="Para calcular el punto de equilibrio en Reportes" />
          <div className="max-w-xs">
            <Input
              label="Gastos fijos mensuales ($)"
              type="number"
              step="0.01"
              value={form.gastosFijosMensuales || ''}
              onChange={(e) => setField('gastosFijosMensuales', Number(e.target.value))}
              placeholder="Alquiler, servicios, etc."
            />
          </div>
        </Card>

        {/* Medios de pago */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={CreditCard}
            title="Medios de pago y comisiones"
            subtitle="El % que te descuenta cada medio, se resta sola de la ganancia real"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {MEDIOS_PAGO_LABELS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                type="number"
                step="0.01"
                value={form.comisiones[key]}
                onChange={(e) => setComision(key, Number(e.target.value))}
              />
            ))}
          </div>
        </Card>

        {/* Horarios de turnos */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={CalendarClock}
            title="Horarios de turnos"
            subtitle="Define qué horarios se ofrecen en la reserva pública"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Hora de inicio"
              type="time"
              value={form.turnos.horaInicio}
              onChange={(e) => setTurnosField('horaInicio', e.target.value)}
            />
            <Input
              label="Hora de fin"
              type="time"
              value={form.turnos.horaFin}
              onChange={(e) => setTurnosField('horaFin', e.target.value)}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Cada cuánto mostrar un horario</span>
              <select
                value={form.turnos.duracionSlot}
                onChange={(e) => setTurnosField('duracionSlot', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Esto es solo la "grilla" de opciones que ve la clienta (ej: cada 30 min). Cuánto dura de verdad cada
            servicio (y por lo tanto cuánto bloquea la agenda) se define aparte, en <strong>Turnos → Servicios</strong>,
            porque no todos duran lo mismo.
          </p>

          <label className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={form.turnos.requiereFichaSalud}
              onChange={(e) => setTurnosField('requiereFichaSalud', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">
              Pedir ficha de salud (alergias, condiciones) al reservar un turno
            </span>
          </label>

          <p className="mt-3 text-xs text-slate-400">
            Los horarios ya reservados por otra clienta se bloquean solos — nunca se puede agendar dos turnos a la misma hora.
          </p>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Políticas de reserva</span>
            <textarea
              value={form.turnos.politicasReserva}
              onChange={(e) => setTurnosField('politicasReserva', e.target.value)}
              rows={3}
              placeholder="Seña, política de cancelación, descuentos por efectivo, etc. Se muestra al elegir el servicio en la reserva pública."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </label>
        </Card>

        {/* Fechas bloqueadas */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={CalendarOff}
            title="Días sin atención"
            subtitle="Feriados, vacaciones o cualquier día que no tomes turnos"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <Input
                label="Agregar fecha"
                type="date"
                value={nuevaFechaBloqueada}
                onChange={(e) => setNuevaFechaBloqueada(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!nuevaFechaBloqueada || form.fechasBloqueadas.includes(nuevaFechaBloqueada)) return
                setField('fechasBloqueadas', [...form.fechasBloqueadas, nuevaFechaBloqueada].sort())
                setNuevaFechaBloqueada('')
              }}
            >
              Agregar
            </Button>
          </div>

          {form.fechasBloqueadas.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">No tenés ningún día bloqueado todavía.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.fechasBloqueadas.map((fecha) => (
                <span
                  key={fecha}
                  className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
                >
                  {formatDate(fecha)}
                  <button
                    type="button"
                    onClick={() => setField('fechasBloqueadas', form.fechasBloqueadas.filter((f) => f !== fecha))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* URL de la app */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={Globe}
            title="URL de la app"
            subtitle="Necesaria para que los botones de calificación en los mails funcionen"
          />
          <Input
            label="URL donde está publicada la app"
            value={form.sitioUrl}
            onChange={(e) => setField('sitioUrl', e.target.value)}
            placeholder="https://oletha.vercel.app"
          />
          <p className="mt-2 text-xs text-slate-500">
            Es la dirección que usás para entrar a esta app desde el navegador. Sin esto, el mail de "Gracias por tu
            visita" no puede armar los botones de calificación del 1 al 10.
          </p>
        </Card>

        {/* Tienda */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={Store}
            title="Tienda online"
            subtitle="El mensaje que se ve en la barra de arriba de /tienda"
          />
          <Input
            label="Mensaje del banner"
            value={form.mensajeBanner}
            onChange={(e) => setField('mensajeBanner', e.target.value)}
            placeholder="✨ Coordinamos tu pedido directo por WhatsApp"
          />
        </Card>

        {/* Canales de venta */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={Tag}
            title="Canales de venta"
            subtitle="De dónde salió cada venta — mostrador, ferias, redes, otra sucursal, lo que uses"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <Input
                label="Agregar canal"
                value={nuevoCanal}
                onChange={(e) => setNuevoCanal(e.target.value)}
                placeholder="Ej: Feria de San Luis"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!nuevoCanal.trim() || form.canalesVenta.includes(nuevoCanal.trim())) return
                setField('canalesVenta', [...form.canalesVenta, nuevoCanal.trim()])
                setNuevoCanal('')
              }}
            >
              Agregar
            </Button>
          </div>

          {form.canalesVenta.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">No tenés ningún canal cargado todavía.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.canalesVenta.map((canal) => (
                <span
                  key={canal}
                  className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700"
                >
                  {canal}
                  <button
                    type="button"
                    onClick={() => setField('canalesVenta', form.canalesVenta.filter((c) => c !== canal))}
                    className="text-primary-400 hover:text-primary-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Google Drive */}
        <Card className="p-5 md:p-6">
          <SectionHeader
            icon={Globe}
            title="Elegir fotos desde Google Drive"
            subtitle="Opcional — sin esto, igual podés subir fotos nuevas o sacarlas con la cámara"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Google Client ID"
              value={form.googleClientId}
              onChange={(e) => setField('googleClientId', e.target.value)}
              placeholder="xxxxx.apps.googleusercontent.com"
            />
            <Input
              label="Google API Key"
              value={form.googleApiKey}
              onChange={(e) => setField('googleApiKey', e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Estas credenciales las sacás vos en{' '}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-primary-600 underline">
              Google Cloud Console
            </a>
            {' '}— hay que crear un proyecto, habilitar "Google Picker API" y "Google Drive API", y generar un OAuth
            Client ID (tipo "Aplicación web") y una API Key. Si no las cargás, el botón "Elegir desde Drive" no va a
            aparecer, pero todo lo demás sigue funcionando normal.
          </p>
        </Card>

        {/* Usuarios y permisos */}
        {tienePermiso('usuarios') && <UsuariosSection />}
      </div>

      {update.isError && (
        <div className="mt-4">
          <ErrorBanner message={(update.error as Error).message} />
        </div>
      )}

      {/* Barra de guardado fija, siempre accesible en cualquier tamaño de pantalla */}
      <div className="fixed bottom-16 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:sticky md:bottom-0 md:mt-6 md:rounded-2xl md:border md:px-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          {update.isSuccess ? (
            <span className="text-sm font-medium text-emerald-600">Guardado ✓</span>
          ) : (
            <span className="text-sm text-slate-400">Los cambios se aplican al instante para todo el equipo</span>
          )}
          <Button onClick={handleSave} disabled={update.isPending}>
            <Save className="h-4 w-4" />
            {update.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
        />
      </div>
    </label>
  )
}

function UsuariosSection() {
  const { data: usuarios, isLoading, error } = useUsuarios()
  const [modalNuevo, setModalNuevo] = useState(false)
  const [usuarioEdit, setUsuarioEdit] = useState<Usuario | null>(null)

  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SectionHeader icon={UsersIcon} title="Usuarios y permisos" subtitle="Quién entra al sistema y qué puede ver" />
        <Button onClick={() => setModalNuevo(true)} className="shrink-0">
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {usuarios && (
        <div className="divide-y divide-slate-100">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{u.nombre}</p>
                <p className="truncate text-xs text-slate-500">
                  @{u.usuario} · {u.rol} · {u.permisos.length} módulos
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={u.activo ? 'success' : 'default'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                <button
                  onClick={() => setUsuarioEdit(u)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NuevoUsuarioModal open={modalNuevo} onClose={() => setModalNuevo(false)} />
      {usuarioEdit && (
        <EditarUsuarioModal usuario={usuarioEdit} onClose={() => setUsuarioEdit(null)} />
      )}
    </Card>
  )
}

function PermisosCheckboxes({
  seleccionados,
  onChange,
}: {
  seleccionados: ModuloKey[]
  onChange: (permisos: ModuloKey[]) => void
}) {
  function toggle(modulo: ModuloKey) {
    if (seleccionados.includes(modulo)) {
      onChange(seleccionados.filter((m) => m !== modulo))
    } else {
      onChange([...seleccionados, modulo])
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">Módulos a los que accede</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MODULOS.map((m) => (
          <label
            key={m.key}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={seleccionados.includes(m.key)}
              onChange={() => toggle(m.key)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            {m.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function NuevoUsuarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addUsuario = useAddUsuario()
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('')
  const [permisos, setPermisos] = useState<ModuloKey[]>(['dashboard'])

  function resetAndClose() {
    setNombre('')
    setUsuario('')
    setEmail('')
    setPassword('')
    setRol('')
    setPermisos(['dashboard'])
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addUsuario.mutate(
      { nombre, usuario, email, password, rol, permisos },
      { onSuccess: resetAndClose }
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Usuario (para login)" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          <Input label="Email (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contraseña inicial" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Rol (texto libre)" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Recepción, Profesional..." />
        </div>
        <PermisosCheckboxes seleccionados={permisos} onChange={setPermisos} />
        {addUsuario.isError && <ErrorBanner message={(addUsuario.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={addUsuario.isPending}>
            {addUsuario.isPending ? 'Creando...' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditarUsuarioModal({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const updateUsuario = useUpdateUsuario()
  const [permisos, setPermisos] = useState<ModuloKey[]>(usuario.permisos as ModuloKey[])
  const [activo, setActivo] = useState(usuario.activo)
  const [nuevaPassword, setNuevaPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateUsuario.mutate(
      {
        id: usuario.id,
        permisos,
        activo,
        ...(nuevaPassword ? { password: nuevaPassword } : {}),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal open onClose={onClose} title={`Editar ${usuario.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PermisosCheckboxes seleccionados={permisos} onChange={setPermisos} />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Usuario activo (desmarcalo para bloquear el acceso sin borrarlo)
        </label>

        <Input
          label="Nueva contraseña (opcional)"
          type="password"
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
          placeholder="Dejar vacío para no cambiarla"
        />

        {updateUsuario.isError && <ErrorBanner message={(updateUsuario.error as Error).message} />}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateUsuario.isPending}>
            {updateUsuario.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
