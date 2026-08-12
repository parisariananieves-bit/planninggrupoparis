import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  BalanceGeneral,
  Cliente,
  Cuota,
  EstadisticasNPS,
  Insumo,
  KPIs,
  MovimientoCaja,
  MovimientoStock,
  Pasivo,
  Producto,
  Promocion,
  ReporteFinanciero,
  ReportePeriodo,
  Servicio,
  Turno,
  Usuario,
  Venta,
} from '@/types'

// ---------- KPIs ----------
export function useKPIs() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.get<KPIs>('getKPIs'),
  })
}

// ---------- Reportes ----------
export function useReporteFinanciero(mes?: number, anio?: number) {
  const params: Record<string, string> = {}
  if (mes) params.mes = String(mes)
  if (anio) params.anio = String(anio)
  return useQuery({
    queryKey: ['reporteFinanciero', mes, anio],
    queryFn: () => api.get<ReporteFinanciero>('getReporteFinanciero', params),
  })
}

export function useReportePeriodo(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['reportePeriodo', desde, hasta],
    queryFn: () => api.get<ReportePeriodo>('getReportePeriodo', { desde, hasta }),
    enabled: !!desde && !!hasta,
  })
}

export function useRegistrarArqueo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (montoContado: number) =>
      api.post<{ esperado: number; contado: number; diferencia: number }>('registrarArqueo', { montoContado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caja'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}

// ---------- Productos ----------
export function useProductos(soloActivos = true) {
  return useQuery({
    queryKey: ['productos', soloActivos],
    queryFn: () => api.get<Producto[]>('getProductos', { soloActivos: String(soloActivos) }),
  })
}

export function useAddProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      body: Omit<Partial<Producto>, 'fotos'> & {
        fotos?: { base64: string; mimeType: string; nombre: string }[]
        fotosExistentes?: string[]
      }
    ) => api.post<{ sku: string }>('addProducto', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  })
}

export function useUpdateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      body: Partial<Producto> & {
        sku: string
        nuevoStock?: number
        fotosExistentes?: string[]
        fotosNuevas?: { base64: string; mimeType: string; nombre: string }[]
      }
    ) => api.post<{ ok: boolean }>('updateProducto', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
    },
  })
}

export function useAddProductosBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productos: Partial<Producto>[]) =>
      api.post<{ creados: number; errores: { fila: number; nombre: string; error: string }[] }>(
        'addProductosBulk',
        { productos }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
    },
  })
}

// ---------- Ventas ----------
export function useVentas(mes?: number, anio?: number) {
  const params: Record<string, string> = {}
  if (mes) params.mes = String(mes)
  if (anio) params.anio = String(anio)
  return useQuery({
    queryKey: ['ventas', mes, anio],
    queryFn: () => api.get<Venta[]>('getVentas', params),
  })
}

export function useAddVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Venta> & { cantidadCuotas?: number }) => api.post<{ id: string }>('addVenta', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] })
      qc.invalidateQueries({ queryKey: ['caja'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}

// ---------- Caja ----------
export function useCaja() {
  return useQuery({
    queryKey: ['caja'],
    queryFn: () => api.get<MovimientoCaja[]>('getCaja'),
  })
}

export function useAddMovCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      body: Omit<Partial<MovimientoCaja>, 'fotoUrl'> & { fotoBase64?: string; fotoMimeType?: string; fotoNombre?: string; fotoUrlExistente?: string }
    ) => api.post<{ id: string; saldoActual: number }>('addMovCaja', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caja'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}

// ---------- Inventario ----------
export function useInventario(sku?: string) {
  const params: Record<string, string> = {}
  if (sku) params.sku = sku
  return useQuery({
    queryKey: ['inventario', sku],
    queryFn: () => api.get<MovimientoStock[]>('getInventario', params),
  })
}

export function useAddMovStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<MovimientoStock>) =>
      api.post<{ id: string; stockResultante: number }>('addMovStock', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}

// ---------- Clientes ----------
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.get<Cliente[]>('getClientes'),
  })
}

export function useAddCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Cliente>) => api.post<{ id: string }>('addCliente', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useUpdateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Cliente> & { id: string }) => api.post<{ ok: boolean }>('updateCliente', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

// ---------- Cuotas ----------
export function useCuotas(estado?: string) {
  const params: Record<string, string> = {}
  if (estado) params.estado = estado
  return useQuery({
    queryKey: ['cuotas', estado],
    queryFn: () => api.get<Cuota[]>('getCuotas', params),
  })
}

export function usePagarCuota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { cuotaId: string; montoPago: number; medioPago?: string; fecha: string }) =>
      api.post<{ ok: boolean }>('pagarCuota', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuotas'] })
      qc.invalidateQueries({ queryKey: ['caja'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}

// ---------- Pasivos y Balance General ----------
export function usePasivos(soloActivos = false) {
  return useQuery({
    queryKey: ['pasivos', soloActivos],
    queryFn: () => api.get<Pasivo[]>('getPasivos', { soloActivos: String(soloActivos) }),
  })
}

export function useAddPasivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Pasivo>) => api.post<{ id: string }>('addPasivo', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pasivos'] })
      qc.invalidateQueries({ queryKey: ['balanceGeneral'] })
    },
  })
}

export function useUpdatePasivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Pasivo> & { id: string }) => api.post<{ ok: boolean }>('updatePasivo', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pasivos'] })
      qc.invalidateQueries({ queryKey: ['balanceGeneral'] })
    },
  })
}

export function useBalanceGeneral() {
  return useQuery({
    queryKey: ['balanceGeneral'],
    queryFn: () => api.get<BalanceGeneral>('getBalanceGeneral'),
  })
}

export function useEstadisticasNPS() {
  return useQuery({
    queryKey: ['estadisticasNPS'],
    queryFn: () => api.get<EstadisticasNPS>('getEstadisticasNPS'),
  })
}

// ---------- Insumos ----------
export function useInsumos(soloActivos = false) {
  return useQuery({
    queryKey: ['insumos', soloActivos],
    queryFn: () => api.get<Insumo[]>('getInsumos', { soloActivos: String(soloActivos) }),
  })
}

export function useAddInsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Insumo>) => api.post<{ id: string }>('addInsumo', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insumos'] }),
  })
}

export function useUpdateInsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Insumo> & { id: string }) => api.post<{ ok: boolean }>('updateInsumo', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insumos'] }),
  })
}

export function useAddInsumosBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (insumos: Partial<Insumo>[]) =>
      api.post<{ creados: number; errores: { fila: number; nombre: string; error: string }[] }>(
        'addInsumosBulk',
        { insumos }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insumos'] }),
  })
}

// ---------- Promociones ----------
export function usePromociones(soloActivas = false) {
  return useQuery({
    queryKey: ['promociones', soloActivas],
    queryFn: () => api.get<Promocion[]>('getPromociones', { soloActivas: String(soloActivas) }),
  })
}

export function useAddPromocion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Promocion>) => api.post<{ id: string }>('addPromocion', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promociones'] }),
  })
}

export function useUpdatePromocion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Promocion> & { id: string }) => api.post<{ ok: boolean }>('updatePromocion', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promociones'] }),
  })
}
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get<Usuario[]>('getUsuarios'),
  })
}

export function useAddUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { nombre: string; usuario: string; email?: string; password: string; rol: string; permisos: string[] }) =>
      api.post<{ id: string }>('addUsuario', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function useUpdateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      id: string
      nombre?: string
      email?: string
      rol?: string
      activo?: boolean
      permisos?: string[]
      password?: string
    }) => api.post<{ ok: boolean }>('updateUsuario', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

// ---------- Servicios ----------
// Mismo criterio que en useConfig: si el backend todavía no manda
// cuidados/preguntas/descripción (falta redesplegar Apps Script), no
// rompemos la pantalla — completamos con valores vacíos.
function normalizarServicio(raw: Partial<Servicio>): Servicio {
  return {
    id: raw.id || '',
    nombre: raw.nombre || '',
    descripcion: raw.descripcion || '',
    duracion: raw.duracion || 0,
    precio: raw.precio || 0,
    activo: raw.activo ?? true,
    cuidados: {
      antes: raw.cuidados?.antes || [],
      despues: raw.cuidados?.despues || [],
      importante: raw.cuidados?.importante || '',
    },
    preguntas: raw.preguntas || [],
    costoManoObra: raw.costoManoObra || 0,
    receta: raw.receta || [],
    fotoUrl: raw.fotoUrl || '',
  }
}

export function useServicios(soloActivos = false) {
  return useQuery({
    queryKey: ['servicios', soloActivos],
    queryFn: () => api.get<Servicio[]>('getServicios', { soloActivos: String(soloActivos) }),
    select: (data) => data.map(normalizarServicio),
  })
}

export function useAddServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      body: Partial<Servicio> & { fotoBase64?: string; fotoMimeType?: string; fotoNombre?: string }
    ) => api.post<{ id: string }>('addServicio', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicios'] }),
  })
}

export function useUpdateServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      body: Partial<Servicio> & { id: string; fotoBase64?: string; fotoMimeType?: string; fotoNombre?: string; fotoUrlExistente?: string }
    ) => api.post<{ ok: boolean }>('updateServicio', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicios'] }),
  })
}

// ---------- Turnos ----------
function normalizarTurno(raw: Partial<Turno>): Turno {
  return {
    id: raw.id || '',
    fecha: raw.fecha || '',
    hora: raw.hora || '',
    cliente: raw.cliente || '',
    telefono: raw.telefono || '',
    email: raw.email || '',
    servicio: raw.servicio || '',
    profesional: raw.profesional || '',
    estado: raw.estado || 'confirmado',
    notas: raw.notas || '',
    fechaCreacion: raw.fechaCreacion || '',
    alergias: raw.alergias || '',
    condiciones: raw.condiciones || '',
    consentimiento: raw.consentimiento ?? false,
    respuestas: raw.respuestas || {},
    fotoUrl: raw.fotoUrl || '',
    cobrado: raw.cobrado ?? true,
    duracion: raw.duracion || 0,
    notaEncuesta: raw.notaEncuesta ?? null,
    comentarioEncuesta: raw.comentarioEncuesta || '',
  }
}

export function useTurnos(params?: { desde?: string; hasta?: string; estado?: string }, enabled = true) {
  return useQuery({
    queryKey: ['turnos', params],
    queryFn: () => api.get<Turno[]>('getTurnos', params as Record<string, string>),
    select: (data) => data.map(normalizarTurno),
    enabled,
  })
}

export function useAddTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Turno> & { fotoBase64?: string; fotoMimeType?: string; fotoNombre?: string }) =>
      api.post<{ id: string }>('addTurno', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] }),
  })
}

export function useUpdateTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Turno> & { id: string }) => api.post<{ ok: boolean }>('updateTurno', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] }),
  })
}

export function useDeleteTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean }>('deleteTurno', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] }),
  })
}

export function useRegistrarEncuesta() {
  return useMutation({
    mutationFn: (body: { turnoId: string; nota?: number; comentario?: string }) =>
      api.post<{ cliente: string; servicio: string; nota: number | null }>('registrarEncuesta', body),
  })
}
