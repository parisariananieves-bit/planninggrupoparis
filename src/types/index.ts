export interface Config {
  nombreNegocio: string
  email: string
  logoUrl: string
  whatsappContacto: string
  iva: number
  colorPrimario: string
  colorSecundario: string
  comisiones: {
    efectivo: number
    debito: number
    credito1: number
    credito3: number
    credito6: number
    mercadoPago: number
    transferencia: number
    cuentaCorriente: number
  }
  turnos: {
    horaInicio: string
    horaFin: string
    duracionSlot: number
    requiereFichaSalud: boolean
    politicasReserva: string
  }
  gastosFijosMensuales: number
  fechasBloqueadas: string[]
  sitioUrl: string
  mensajeBanner: string
  canalesVenta: string[]
  googleClientId: string
  googleApiKey: string
}

export interface Producto {
  sku: string
  nombre: string
  descripcion: string
  categoria: string
  precioCompra: number
  precioVentaSinIva: number
  precioVentaConIva: number
  margen: number
  stock: number
  stockMinimo: number
  proveedor: string
  activo: boolean
  fotoUrl: string
  fotos?: string[]
  stockInicial?: number
  fotoBase64?: string
  fotoMimeType?: string
  fotoNombre?: string
}

export type MedioPago =
  | 'efectivo'
  | 'debito'
  | 'credito1'
  | 'credito3'
  | 'credito6'
  | 'mercadoPago'
  | 'transferencia'
  | 'cuentaCorriente'

export interface VentaItem {
  sku: string
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Venta {
  id: string
  fecha: string
  cliente: string
  subtotal: number
  descuentoGeneral: number
  iva: number
  total: number
  medioPago: MedioPago | string
  canalVenta: string
  comision: number
  montoComision: number
  gananciaReal: number
  margenNeto: number
  tipoPago: 'contado' | 'cuotas'
  notas: string
  items: VentaItem[]
}

export type TipoMovCaja = 'ingreso' | 'egreso'

export interface MovimientoCaja {
  id: string
  fecha: string
  tipo: TipoMovCaja
  concepto: string
  categoria: string
  monto: number
  medioPago: string
  referencia: string
  fotoUrl: string
  saldoAcumulado: number
}

export type TipoMovStock = 'entrada' | 'salida'

export interface MovimientoStock {
  id: string
  fecha: string
  tipo: TipoMovStock
  sku: string
  nombreProducto: string
  cantidad: number
  motivo: string
  referencia: string
  stockResultante: number
}

export interface Cliente {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion: string
  fechaAlta: string
  totalCompras: number
  cantidadCompras: number
  ultimaCompra: string
  saldoCuentaCorriente: number
  notas: string
}

export type EstadoCuota = 'pendiente' | 'parcial' | 'vencida' | 'pagada'

export interface Cuota {
  id: string
  ventaId: string
  cliente: string
  fechaVencimiento: string
  montoCuota: number
  montoPagado: number
  saldoPendiente: number
  estado: EstadoCuota
  numeroCuota: number
  totalCuotas: number
}

export interface KPIs {
  ventasMes: number
  ventasMesAnterior: number
  gananciasMes: number
  saldoCaja: number
  productosStockCritico: number
  cuotasVencidas: number
  cuotasPendientesMes: number
  topProductos: { nombre: string; cantidad: number }[]
}

export const MODULOS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'productos', label: 'Productos' },
  { key: 'caja', label: 'Caja' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'cuotas', label: 'Cuotas' },
  { key: 'turnos', label: 'Turnos' },
  { key: 'reportes', label: 'Reportes' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'configuracion', label: 'Configuración' },
] as const

export type ModuloKey = (typeof MODULOS)[number]['key']

export interface Usuario {
  id: string
  nombre: string
  usuario: string
  email: string
  rol: string
  permisos: string[]
  activo: boolean
}

export interface UsuarioSesion extends Usuario {
  token: string
}

export type EstadoTurno = 'confirmado' | 'completado' | 'cancelado'

export interface Turno {
  id: string
  fecha: string
  hora: string
  cliente: string
  telefono: string
  email: string
  servicio: string
  profesional: string
  estado: EstadoTurno
  notas: string
  fechaCreacion: string
  alergias: string
  condiciones: string
  consentimiento: boolean
  respuestas: Record<string, string>
  fotoUrl: string
  cobrado: boolean
  duracion: number
  notaEncuesta: number | null
  comentarioEncuesta: string
}

export interface Pregunta {
  texto: string
  tipo: 'si_no' | 'texto'
}

export interface Servicio {
  id: string
  nombre: string
  descripcion: string
  duracion: number
  precio: number
  activo: boolean
  cuidados: {
    antes: string[]
    despues: string[]
    importante: string
  }
  preguntas: Pregunta[]
  costoManoObra: number
  receta: RecetaItem[]
  fotoUrl: string
}

export interface Insumo {
  id: string
  nombre: string
  precioCosto: number
  stock: number
  stockMinimo: number
  unidad: string
  activo: boolean
}

export interface RecetaItem {
  insumoId: string
  nombre: string
  rendimiento: number // cuántos usos rinde una unidad comprada del insumo
  cantidadPorServicio: number // cuántas unidades del insumo se usan por servicio (normalmente 1)
}

export type TipoPromocion = '2x1' | 'descuentoPct'

export interface Promocion {
  id: string
  nombre: string
  tipo: TipoPromocion
  aplicaA: string // SKU puntual, o 'todos'
  valor: number // % de descuento (para descuentoPct); ignorado en 2x1
  activo: boolean
}

export interface ReporteFinanciero {
  ventasMes: number
  gananciaMes: number
  margenPromedio: number
  gastosFijosMensuales: number
  puntoEquilibrio: number
  porcentajeAlcanzado: number
  topProductos: { nombre: string; cantidad: number }[]
  topServicios: { nombre: string; cantidad: number }[]
  flujoCaja: { fecha: string; ingresos: number; egresos: number }[]
}

export interface ReportePeriodo {
  desde: string
  hasta: string
  totalIngresos: number
  totalEgresos: number
  saldoNeto: number
  totalVentas: number
  cantidadVentas: number
  porMedioPago: { medioPago: string; ingresos: number; egresos: number }[]
  porCanal: { canal: string; cantidad: number; total: number }[]
  flujoCaja: { fecha: string; ingresos: number; egresos: number }[]
  movimientos: MovimientoCaja[]
  ventas: Venta[]
  cuotas: Cuota[]
}

export interface Pasivo {
  id: string
  nombre: string
  monto: number
  categoria: string
  activo: boolean
}

export interface BalanceGeneral {
  activo: {
    caja: number
    inventario: number
    cuentasPorCobrar: number
    total: number
  }
  pasivo: {
    detalle: Pasivo[]
    total: number
  }
  patrimonioNeto: number
}

export interface EstadisticasNPS {
  totalRespuestas: number
  promedio: number
  nps: number
  promotoras: number
  pasivas: number
  detractoras: number
  comentarios: { cliente: string; servicio: string; nota: number; comentario: string; fecha: string }[]
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}
