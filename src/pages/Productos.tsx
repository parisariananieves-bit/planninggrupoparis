import { useState, type ChangeEvent, type FormEvent } from 'react'
import { FileUp, ImagePlus, Plus, Search } from 'lucide-react'
import { useAddProducto, useAddProductosBulk, useAddPromocion, useAddInsumo, useInsumos, useProductos, usePromociones, useUpdateProducto, useUpdatePromocion, useUpdateInsumo, useAddInsumosBulk } from '@/hooks/useEntities'
import { useConfig, usePaleta } from '@/hooks/useConfig'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Modal, PageHeader } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatCurrency } from '@/lib/format'
import { ImagenConFallback } from '@/components/ImagenConFallback'
import { SelectorFotos, type FotoNueva } from '@/components/SelectorFotos'
import { leerFilasDeArchivo } from '@/lib/parseoArchivo'
import type { Insumo, Producto } from '@/types'

type FilaImportada = Partial<Producto> & { _fila: number }

// Nombres de columna aceptados en el Excel/CSV, en minúscula y sin
// tildes, para no depender de que el archivo venga con el encabezado
// exacto. Cubre variantes comunes de cómo la gente nombra sus columnas.
const ALIAS_COLUMNAS: Record<string, keyof Producto> = {
  nombre: 'nombre',
  producto: 'nombre',
  descripcion: 'descripcion',
  categoria: 'categoria',
  rubro: 'categoria',
  'precio compra': 'precioCompra',
  costo: 'precioCompra',
  'precio costo': 'precioCompra',
  'precio venta': 'precioVentaSinIva',
  'precio venta s/iva': 'precioVentaSinIva',
  'precio venta sin iva': 'precioVentaSinIva',
  precio: 'precioVentaSinIva',
  'stock minimo': 'stockMinimo',
  'stock min': 'stockMinimo',
  proveedor: 'proveedor',
  stock: 'stockInicial',
  'stock inicial': 'stockInicial',
  cantidad: 'stockInicial',
  margen: 'margen' as unknown as keyof Producto,
  'margen %': 'margen' as unknown as keyof Producto,
}

function normalizarEncabezado(h: string) {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function parsearArchivo(file: File): Promise<FilaImportada[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = async () => {
      try {
        // Import dinámico: la librería de Excel (~600kb) solo se descarga
        // cuando alguien realmente usa "Importar stock", no en la carga inicial.
        const XLSX = await import('xlsx')
        const wb = XLSX.read(reader.result, { type: 'binary' })
        const hoja = wb.Sheets[wb.SheetNames[0]]
        const filas: Record<string, unknown>[] = XLSX.utils.sheet_to_json(hoja, { defval: '' })

        const productos: FilaImportada[] = filas.map((fila, i) => {
          const producto: FilaImportada = { _fila: i + 2 } // +2: fila 1 es encabezado
          Object.entries(fila).forEach(([columna, valor]) => {
            const key = ALIAS_COLUMNAS[normalizarEncabezado(columna)]
            if (!key) return
            if (key === 'nombre' || key === 'descripcion' || key === 'categoria' || key === 'proveedor') {
              ;(producto as Record<string, unknown>)[key] = String(valor).trim()
            } else {
              ;(producto as Record<string, unknown>)[key] = Number(valor) || 0
            }
          })

          // Si vino "Margen" pero no un precio de venta directo, lo calculamos
          // igual que en el alta manual: precio compra × (1 + margen/100).
          const conMargen = producto as Record<string, unknown>
          if (conMargen.margen && !producto.precioVentaSinIva && producto.precioCompra) {
            producto.precioVentaSinIva = producto.precioCompra * (1 + Number(conMargen.margen) / 100)
          }

          return producto
        })

        resolve(productos.filter((p) => p.nombre))
      } catch {
        reject(new Error('El archivo no tiene un formato reconocible. Probá exportarlo como .xlsx o .csv'))
      }
    }
    reader.readAsBinaryString(file)
  })
}

export function Productos() {
  const [tab, setTab] = useState<'catalogo' | 'promociones' | 'insumos'>('catalogo')

  return (
    <div>
      <PageHeader title="Productos" subtitle="Catálogo, stock, insumos y promociones" />

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab('catalogo')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'catalogo' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab('insumos')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'insumos' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Insumos
        </button>
        <button
          onClick={() => setTab('promociones')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'promociones' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Promociones
        </button>
      </div>

      {tab === 'catalogo' && <Catalogo />}
      {tab === 'insumos' && <InsumosTab />}
      {tab === 'promociones' && <PromocionesTab />}
    </div>
  )
}

function Catalogo() {
  const { data: productos, isLoading, error } = useProductos(false)
  const addProducto = useAddProducto()
  const updateProducto = useUpdateProducto()
  const addProductosBulk = useAddProductosBulk()
  const paleta = usePaleta()
  const [open, setOpen] = useState(false)
  const [openImportar, setOpenImportar] = useState(false)
  const [productoEdit, setProductoEdit] = useState<Producto | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState<'grilla' | 'lista'>('grilla')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

  const categorias = ['todas', ...Array.from(new Set((productos || []).map((p) => p.categoria).filter(Boolean)))]

  const productosFiltrados = (productos || []).filter((p) => {
    const q = busqueda.trim().toLowerCase()
    const coincideTexto = !q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const coincideCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro
    return coincideTexto && coincideCategoria
  })

  function handleSubmit(
    precioVentaSinIva: number,
    form: FormData,
    fotosDrive: string[],
    fotosSubir: FotoNueva[]
  ) {
    addProducto.mutate(
      {
        nombre: String(form.get('nombre')),
        descripcion: String(form.get('descripcion') || ''),
        categoria: String(form.get('categoria') || ''),
        precioCompra: Number(form.get('precioCompra')),
        precioVentaSinIva,
        stockMinimo: Number(form.get('stockMinimo') || 0),
        proveedor: String(form.get('proveedor') || ''),
        stockInicial: Number(form.get('stockInicial') || 0),
        fotosExistentes: fotosDrive,
        fotos: fotosSubir.map((f) => ({ base64: f.base64, mimeType: f.mimeType, nombre: f.nombre })),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setVista('grilla')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              vista === 'grilla' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Cuadrícula
          </button>
          <button
            onClick={() => setVista('lista')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              vista === 'lista' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lista
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpenImportar(true)}>
            <FileUp className="h-4 w-4" /> Importar stock
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        </div>
      </div>

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {productos && productos.length > 0 && (
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
          {categorias.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoriaFiltro(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    categoriaFiltro === c ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c === 'todas' ? 'Todas' : c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {productos && productos.length === 0 && (
        <EmptyState message="Todavía no cargaste ningún producto." />
      )}
      {productos && productos.length > 0 && productosFiltrados.length === 0 && (
        <EmptyState message="No encontré ningún producto con esa búsqueda." />
      )}

      {vista === 'grilla' && productosFiltrados.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {productosFiltrados.map((p, i) => {
            const stockBajo = p.stockMinimo > 0 && p.stock <= p.stockMinimo
            return (
              <button
                key={p.sku}
                onClick={() => setProductoEdit(p)}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-slate-50">
                  <ImagenConFallback
                    src={p.fotoUrl}
                    alt={p.nombre}
                    className="h-full w-full object-cover"
                    style={{ backgroundColor: paleta[i % paleta.length].bg }}
                    Icono={ImagePlus}
                    iconoClassName="h-8 w-8 text-slate-300"
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-slate-900">{p.nombre}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(p.precioVentaConIva)}</p>
                  <p className={`mt-1 flex items-center gap-1 text-xs ${stockBajo ? 'text-red-600' : 'text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stockBajo ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {p.stock} disponibles
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {vista === 'lista' && productosFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio c/IVA</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productosFiltrados.map((p, i) => (
                <tr
                  key={p.sku}
                  onClick={() => setProductoEdit(p)}
                  className="cursor-pointer border-l-4 hover:opacity-90"
                  style={{ borderLeftColor: paleta[i % paleta.length].dot }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <ImagenConFallback
                        src={p.fotoUrl}
                        alt={p.nombre}
                        className="h-8 w-8 rounded-lg object-cover text-white"
                        style={{ backgroundColor: paleta[i % paleta.length].dot }}
                        Icono={ImagePlus}
                        iconoClassName="h-4 w-4"
                      />
                      <span className="font-medium text-slate-900">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.categoria || '—'}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(p.precioVentaConIva)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.stock <= p.stockMinimo && p.stockMinimo > 0 ? 'danger' : 'default'}>
                      {p.stock}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.activo ? 'success' : 'default'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NuevoProductoModal open={open} onClose={() => setOpen(false)} addProducto={addProducto} onConfirm={handleSubmit} />

      {productoEdit && (
        <EditarProductoModal
          producto={productoEdit}
          updateProducto={updateProducto}
          onClose={() => setProductoEdit(null)}
        />
      )}

      <ImportarModal
        open={openImportar}
        onClose={() => setOpenImportar(false)}
        addProductosBulk={addProductosBulk}
      />
    </div>
  )
}

const ETIQUETAS_TIPO_PROMO: Record<string, string> = {
  '2x1': '2x1',
  descuentoPct: '% de descuento',
}

function PromocionesTab() {
  const { data: productos } = useProductos(true)
  const { data: promociones, isLoading, error } = usePromociones()
  const addPromocion = useAddPromocion()
  const updatePromocion = useUpdatePromocion()
  const [open, setOpen] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    addPromocion.mutate(
      {
        nombre: String(form.get('nombre')),
        tipo: form.get('tipo') as 'descuentoPct' | '2x1',
        aplicaA: String(form.get('aplicaA')),
        valor: Number(form.get('valor') || 0),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva promoción
        </Button>
      </div>

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}
      {promociones && promociones.length === 0 && (
        <EmptyState message="No hay promociones cargadas. Se aplican solas cuando agregás el producto a una venta." />
      )}

      {promociones && promociones.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {promociones.map((promo) => (
            <div key={promo.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{promo.nombre}</p>
                <p className="truncate text-xs text-slate-500">
                  {ETIQUETAS_TIPO_PROMO[promo.tipo]}
                  {promo.tipo === 'descuentoPct' && ` (${promo.valor}%)`} ·{' '}
                  {promo.aplicaA === 'todos'
                    ? 'Todos los productos'
                    : productos?.find((p) => p.sku === promo.aplicaA)?.nombre || promo.aplicaA}
                </p>
              </div>
              <button onClick={() => updatePromocion.mutate({ id: promo.id, activo: !promo.activo })} className="shrink-0">
                <Badge tone={promo.activo ? 'success' : 'default'}>{promo.activo ? 'Activa' : 'Inactiva'}</Badge>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva promoción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" name="nombre" placeholder="Ej: 2x1 en pecas con henna" required />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</span>
            <select
              name="tipo"
              defaultValue="2x1"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="2x1">2x1</option>
              <option value="descuentoPct">% de descuento</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Aplica a</span>
            <select
              name="aplicaA"
              defaultValue="todos"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="todos">Todos los productos</option>
              {productos?.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <Input label="% de descuento (solo para ese tipo)" name="valor" type="number" placeholder="10" />
          {addPromocion.isError && <ErrorBanner message={(addPromocion.error as Error).message} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addPromocion.isPending}>
              {addPromocion.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function NuevoProductoModal({
  open,
  onClose,
  addProducto,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  addProducto: ReturnType<typeof useAddProducto>
  onConfirm: (precioVentaSinIva: number, form: FormData, fotosDrive: string[], fotosSubir: FotoNueva[]) => void
}) {
  const { data: config } = useConfig()
  const [precioCompra, setPrecioCompra] = useState(0)
  const [margen, setMargen] = useState(40)
  const [fotosDrive, setFotosDrive] = useState<string[]>([])
  const [fotosNuevas, setFotosNuevas] = useState<FotoNueva[]>([])
  const [comprimiendoFoto, setComprimiendoFoto] = useState(false)

  const ivaPct = config?.iva ?? 0
  const precioVentaSinIva = precioCompra * (1 + margen / 100)
  const precioVentaConIva = precioVentaSinIva * (1 + ivaPct / 100)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    onConfirm(precioVentaSinIva, form, fotosDrive, fotosNuevas)
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo producto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectorFotos
          fotosExistentes={fotosDrive}
          onQuitarExistente={(url) => setFotosDrive((prev) => prev.filter((u) => u !== url))}
          onAgregarExistente={(url) => setFotosDrive((prev) => [...prev, url])}
          fotosNuevas={fotosNuevas}
          onAgregarNueva={(f) => setFotosNuevas((prev) => [...prev, f])}
          onQuitarNueva={(idx) => setFotosNuevas((prev) => prev.filter((_, i) => i !== idx))}
          procesando={comprimiendoFoto}
          onProcesando={setComprimiendoFoto}
        />
        <Input label="Nombre" name="nombre" required />
        <Input label="Descripción" name="descripcion" />
        <Input label="Categoría" name="categoria" />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio compra"
            name="precioCompra"
            type="number"
            step="0.01"
            value={precioCompra || ''}
            onChange={(e) => setPrecioCompra(Number(e.target.value))}
            required
          />
          <Input
            label="Margen deseado (%)"
            name="margen"
            type="number"
            step="1"
            value={margen}
            onChange={(e) => setMargen(Number(e.target.value))}
            required
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Precio de venta (s/IVA)</span>
            <span className="font-medium text-slate-900">{formatCurrency(precioVentaSinIva)}</span>
          </div>
          {ivaPct > 0 && (
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Precio de venta (c/IVA {ivaPct}%)</span>
              <span className="font-medium text-slate-900">{formatCurrency(precioVentaConIva)}</span>
            </div>
          )}
        </div>

        <CalculadoraGastosFijos
          precioCompra={precioCompra}
          precioVentaSinIva={precioVentaSinIva}
          gastosFijosMensuales={config?.gastosFijosMensuales || 0}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Stock inicial" name="stockInicial" type="number" defaultValue={0} />
          <Input label="Stock mínimo" name="stockMinimo" type="number" defaultValue={0} />
        </div>
        <Input label="Proveedor" name="proveedor" />
        {addProducto.isError && <ErrorBanner message={(addProducto.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={addProducto.isPending}>
            {addProducto.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditarProductoModal({
  producto,
  updateProducto,
  onClose,
}: {
  producto: Producto
  updateProducto: ReturnType<typeof useUpdateProducto>
  onClose: () => void
}) {
  const { data: config } = useConfig()
  const [nombre, setNombre] = useState(producto.nombre)
  const [descripcion, setDescripcion] = useState(producto.descripcion)
  const [categoria, setCategoria] = useState(producto.categoria)
  const [proveedor, setProveedor] = useState(producto.proveedor)
  const [stockMinimo, setStockMinimo] = useState(producto.stockMinimo)
  const [activo, setActivo] = useState(producto.activo)
  const [precioCompra, setPrecioCompra] = useState(producto.precioCompra)
  const [margen, setMargen] = useState(producto.margen)
  const [nuevoStock, setNuevoStock] = useState(producto.stock)
  const [fotosExistentes, setFotosExistentes] = useState<string[]>(producto.fotos?.length ? producto.fotos : (producto.fotoUrl ? [producto.fotoUrl] : []))
  const [fotosNuevas, setFotosNuevas] = useState<FotoNueva[]>([])
  const [comprimiendoFoto, setComprimiendoFoto] = useState(false)

  const ivaPct = config?.iva ?? 0
  const precioVentaSinIva = precioCompra * (1 + margen / 100)
  const precioVentaConIva = precioVentaSinIva * (1 + ivaPct / 100)
  const stockCambio = nuevoStock !== producto.stock

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateProducto.mutate(
      {
        sku: producto.sku,
        nombre,
        descripcion,
        categoria,
        proveedor,
        stockMinimo,
        activo,
        precioCompra,
        precioVentaSinIva,
        ...(stockCambio ? { nuevoStock } : {}),
        fotosExistentes,
        fotosNuevas: fotosNuevas.map((f) => ({ base64: f.base64, mimeType: f.mimeType, nombre: f.nombre })),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal open onClose={onClose} title={`Editar: ${producto.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectorFotos
          fotosExistentes={fotosExistentes}
          onQuitarExistente={(url) => setFotosExistentes((prev) => prev.filter((u) => u !== url))}
          onAgregarExistente={(url) => setFotosExistentes((prev) => [...prev, url])}
          fotosNuevas={fotosNuevas}
          onAgregarNueva={(f) => setFotosNuevas((prev) => [...prev, f])}
          onQuitarNueva={(idx) => setFotosNuevas((prev) => prev.filter((_, i) => i !== idx))}
          procesando={comprimiendoFoto}
          onProcesando={setComprimiendoFoto}
        />

        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <Input label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio compra"
            type="number"
            step="0.01"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(Number(e.target.value))}
            required
          />
          <Input
            label="Margen deseado (%)"
            type="number"
            step="1"
            value={margen}
            onChange={(e) => setMargen(Number(e.target.value))}
            required
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Precio de venta (s/IVA)</span>
            <span className="font-medium text-slate-900">{formatCurrency(precioVentaSinIva)}</span>
          </div>
          {ivaPct > 0 && (
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Precio de venta (c/IVA {ivaPct}%)</span>
              <span className="font-medium text-slate-900">{formatCurrency(precioVentaConIva)}</span>
            </div>
          )}
        </div>

        <CalculadoraGastosFijos
          precioCompra={precioCompra}
          precioVentaSinIva={precioVentaSinIva}
          gastosFijosMensuales={config?.gastosFijosMensuales || 0}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Stock actual"
              type="number"
              value={nuevoStock}
              onChange={(e) => setNuevoStock(Number(e.target.value))}
            />
            {stockCambio && (
              <p className="mt-1 text-xs text-amber-600">
                Se va a registrar un ajuste de {nuevoStock > producto.stock ? '+' : ''}
                {nuevoStock - producto.stock} en Inventario.
              </p>
            )}
          </div>
          <Input
            label="Stock mínimo"
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(Number(e.target.value))}
          />
        </div>

        <Input label="Proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Producto activo (desmarcalo para que no aparezca en Ventas ni en la reserva)
        </label>

        {updateProducto.isError && <ErrorBanner message={(updateProducto.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateProducto.isPending}>
            {updateProducto.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ImportarModal({
  open,
  onClose,
  addProductosBulk,
}: {
  open: boolean
  onClose: () => void
  addProductosBulk: ReturnType<typeof useAddProductosBulk>
}) {
  const [filas, setFilas] = useState<FilaImportada[]>([])
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ creados: number; errores: { fila: number; nombre: string; error: string }[] } | null>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setResultado(null)
    setNombreArchivo(file.name)
    try {
      const parseadas = await parsearArchivo(file)
      if (parseadas.length === 0) {
        setParseError('No encontré filas con nombre de producto. Revisá que la columna se llame "Nombre" o "Producto".')
      }
      setFilas(parseadas)
    } catch (err) {
      setParseError((err as Error).message)
    }
  }

  function confirmarImportacion() {
    addProductosBulk.mutate(filas, {
      onSuccess: (data) => setResultado(data),
    })
  }

  function cerrarYReset() {
    setFilas([])
    setNombreArchivo('')
    setParseError(null)
    setResultado(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={cerrarYReset} title="Importar stock desde Excel">
      <div className="space-y-4">
        {!resultado && (
          <>
            <p className="text-sm text-slate-500">
              Subí un archivo .xlsx o .csv con tus productos. Reconoce columnas como <em>Nombre, Categoría, Precio
              Compra, Precio Venta, Stock, Stock Mínimo, Proveedor</em> — no importa el orden ni mayúsculas/minúsculas.
            </p>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-6 text-slate-400 hover:border-slate-400 hover:text-slate-500">
              <FileUp className="h-6 w-6" />
              <span className="text-xs font-medium">{nombreArchivo || 'Tocá para elegir el archivo'}</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </label>

            {parseError && <ErrorBanner message={parseError} />}

            {filas.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  {filas.length} producto{filas.length === 1 ? '' : 's'} listo{filas.length === 1 ? '' : 's'} para
                  importar
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Precio venta</th>
                        <th className="px-3 py-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filas.map((f, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-slate-900">{f.nombre}</td>
                          <td className="px-3 py-1.5 text-slate-600">{formatCurrency(f.precioVentaSinIva || 0)}</td>
                          <td className="px-3 py-1.5 text-slate-600">{f.stockInicial || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {addProductosBulk.isError && (
              <ErrorBanner message={(addProductosBulk.error as Error).message} />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={cerrarYReset}>
                Cancelar
              </Button>
              <Button onClick={confirmarImportacion} disabled={filas.length === 0 || addProductosBulk.isPending}>
                {addProductosBulk.isPending ? 'Importando...' : `Importar ${filas.length || ''} productos`}
              </Button>
            </div>
          </>
        )}

        {resultado && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Se crearon <strong>{resultado.creados}</strong> productos.
              {resultado.errores.length > 0 && ` ${resultado.errores.length} filas tuvieron problemas.`}
            </p>
            {resultado.errores.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-xl bg-red-50 p-3 text-xs text-red-700">
                {resultado.errores.map((e) => (
                  <p key={e.fila}>
                    Fila {e.fila} ({e.nombre}): {e.error}
                  </p>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={cerrarYReset}>Listo</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function InsumosTab() {
  const { data: insumos, isLoading, error } = useInsumos()
  const addInsumo = useAddInsumo()
  const updateInsumo = useUpdateInsumo()
  const addInsumosBulk = useAddInsumosBulk()
  const paleta = usePaleta()
  const [open, setOpen] = useState(false)
  const [openImportar, setOpenImportar] = useState(false)
  const [insumoEdit, setInsumoEdit] = useState<Insumo | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    addInsumo.mutate(
      {
        nombre: String(form.get('nombre')),
        precioCosto: Number(form.get('precioCosto')),
        stock: Number(form.get('stock') || 0),
        stockMinimo: Number(form.get('stockMinimo') || 0),
        unidad: String(form.get('unidad') || 'unidad'),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Materiales de uso interno (tinta, pinceles, guantes...) — no se venden directo, se usan para calcular el
        costo real de cada servicio en <strong>Turnos → Servicios</strong>.
      </p>

      <div className="mb-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpenImportar(true)}>
          <FileUp className="h-4 w-4" /> Importar insumos
        </Button>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo insumo
        </Button>
      </div>

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}
      {insumos && insumos.length === 0 && <EmptyState message="Todavía no cargaste insumos." />}

      {insumos && insumos.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {insumos.map((i, idx) => {
            const c = paleta[idx % paleta.length]
            const stockBajo = i.stockMinimo > 0 && i.stock <= i.stockMinimo
            return (
              <Card
                key={i.id}
                className="border-l-4 p-4"
                style={{ backgroundColor: c.bg, borderLeftColor: c.dot, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => setInsumoEdit(i)} className="min-w-0 flex-1 text-left">
                    <p className="font-medium hover:opacity-70" style={{ color: c.text }}>{i.nombre}</p>
                    <p className="text-sm opacity-70" style={{ color: c.text }}>
                      {formatCurrency(i.precioCosto)} / {i.unidad}
                    </p>
                  </button>
                  <Badge tone={stockBajo ? 'danger' : 'default'}>{i.stock} {i.unidad}</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo insumo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" name="nombre" placeholder="Tinta, pincel, guantes..." required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio de costo" name="precioCosto" type="number" step="0.01" required />
            <Input label="Unidad" name="unidad" placeholder="frasco, unidad, par..." defaultValue="unidad" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock inicial" name="stock" type="number" defaultValue={0} />
            <Input label="Stock mínimo" name="stockMinimo" type="number" defaultValue={0} />
          </div>
          {addInsumo.isError && <ErrorBanner message={(addInsumo.error as Error).message} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addInsumo.isPending}>
              {addInsumo.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {insumoEdit && (
        <EditarInsumoModal insumo={insumoEdit} updateInsumo={updateInsumo} onClose={() => setInsumoEdit(null)} />
      )}

      <ImportarInsumosModal open={openImportar} onClose={() => setOpenImportar(false)} addInsumosBulk={addInsumosBulk} />
    </div>
  )
}

function ImportarInsumosModal({
  open,
  onClose,
  addInsumosBulk,
}: {
  open: boolean
  onClose: () => void
  addInsumosBulk: ReturnType<typeof useAddInsumosBulk>
}) {
  const [filas, setFilas] = useState<Partial<Insumo>[]>([])
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ creados: number; errores: { fila: number; nombre: string; error: string }[] } | null>(null)

  const ALIAS: Record<string, string> = {
    nombre: 'nombre',
    insumo: 'nombre',
    'precio costo': 'precioCosto',
    costo: 'precioCosto',
    'precio de costo': 'precioCosto',
    precio: 'precioCosto',
    stock: 'stock',
    cantidad: 'stock',
    'stock minimo': 'stockMinimo',
    'stock min': 'stockMinimo',
    unidad: 'unidad',
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setResultado(null)
    setNombreArchivo(file.name)
    try {
      const filasCrudas = await leerFilasDeArchivo(file)
      const parseadas: Partial<Insumo>[] = filasCrudas
        .map((fila) => {
          const insumo: Record<string, unknown> = {}
          Object.entries(fila).forEach(([columna, valor]) => {
            const key = ALIAS[normalizarEncabezado(columna)]
            if (!key) return
            insumo[key] = key === 'nombre' || key === 'unidad' ? String(valor).trim() : Number(valor) || 0
          })
          return insumo as Partial<Insumo>
        })
        .filter((i) => i.nombre)

      if (parseadas.length === 0) {
        setParseError('No encontré filas con nombre de insumo. Revisá que la columna se llame "Nombre" o "Insumo".')
      }
      setFilas(parseadas)
    } catch (err) {
      setParseError((err as Error).message)
    }
  }

  function confirmarImportacion() {
    addInsumosBulk.mutate(filas, {
      onSuccess: (data) => setResultado(data),
    })
  }

  function cerrarYReset() {
    setFilas([])
    setNombreArchivo('')
    setParseError(null)
    setResultado(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={cerrarYReset} title="Importar insumos desde Excel">
      <div className="space-y-4">
        {!resultado && (
          <>
            <p className="text-sm text-slate-500">
              Subí un archivo .xlsx o .csv con tus insumos. Reconoce columnas como <em>Nombre, Precio Costo, Stock,
              Stock Mínimo, Unidad</em> — no importa el orden ni mayúsculas/minúsculas.
            </p>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-6 text-slate-400 hover:border-slate-400 hover:text-slate-500">
              <FileUp className="h-6 w-6" />
              <span className="text-xs font-medium">{nombreArchivo || 'Tocá para elegir el archivo'}</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </label>

            {parseError && <ErrorBanner message={parseError} />}

            {filas.length > 0 && (
              <>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Costo</th>
                        <th className="px-3 py-2">Stock</th>
                        <th className="px-3 py-2">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filas.map((f, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5">{f.nombre}</td>
                          <td className="px-3 py-1.5">{formatCurrency(f.precioCosto || 0)}</td>
                          <td className="px-3 py-1.5">{f.stock || 0}</td>
                          <td className="px-3 py-1.5">{f.unidad || 'unidad'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400">{filas.length} insumo(s) listos para importar.</p>
              </>
            )}

            {addInsumosBulk.isError && <ErrorBanner message={(addInsumosBulk.error as Error).message} />}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={cerrarYReset}>
                Cancelar
              </Button>
              <Button onClick={confirmarImportacion} disabled={filas.length === 0 || addInsumosBulk.isPending}>
                {addInsumosBulk.isPending ? 'Importando...' : `Importar ${filas.length || ''} insumo(s)`}
              </Button>
            </div>
          </>
        )}

        {resultado && (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700">Se crearon {resultado.creados} insumo(s) correctamente.</p>
            {resultado.errores.length > 0 && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                <p className="mb-1 font-medium">{resultado.errores.length} fila(s) con error:</p>
                {resultado.errores.map((e, i) => (
                  <p key={i}>Fila {e.fila} ({e.nombre}): {e.error}</p>
                ))}
              </div>
            )}
            <Button onClick={cerrarYReset} className="w-full justify-center">
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function EditarInsumoModal({
  insumo,
  updateInsumo,
  onClose,
}: {
  insumo: Insumo
  updateInsumo: ReturnType<typeof useUpdateInsumo>
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(insumo.nombre)
  const [precioCosto, setPrecioCosto] = useState(insumo.precioCosto)
  const [stock, setStock] = useState(insumo.stock)
  const [stockMinimo, setStockMinimo] = useState(insumo.stockMinimo)
  const [unidad, setUnidad] = useState(insumo.unidad)
  const [activo, setActivo] = useState(insumo.activo)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateInsumo.mutate(
      { id: insumo.id, nombre, precioCosto, stock, stockMinimo, unidad, activo },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal open onClose={onClose} title={`Editar: ${insumo.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Precio de costo" type="number" step="0.01" value={precioCosto} onChange={(e) => setPrecioCosto(Number(e.target.value))} required />
          <Input label="Unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Stock actual" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          <Input label="Stock mínimo" type="number" value={stockMinimo} onChange={(e) => setStockMinimo(Number(e.target.value))} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Insumo activo (desmarcalo para que no aparezca al armar recetas de costo)
        </label>
        {updateInsumo.isError && <ErrorBanner message={(updateInsumo.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateInsumo.isPending}>
            {updateInsumo.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Le muestra a la usuaria el gasto fijo real por unidad y el margen
// ajustado, a partir de una estimación que ELLA carga (cuántas unidades
// de este producto piensa vender este mes) — no inventamos ese número
// nosotros, porque adivinarlo mal podría llevar a un precio equivocado.
function CalculadoraGastosFijos({
  precioCompra,
  precioVentaSinIva,
  gastosFijosMensuales,
}: {
  precioCompra: number
  precioVentaSinIva: number
  gastosFijosMensuales: number
}) {
  const [abierta, setAbierta] = useState(false)
  const [unidadesEstimadas, setUnidadesEstimadas] = useState(0)

  const gastoFijoPorUnidad = unidadesEstimadas > 0 ? gastosFijosMensuales / unidadesEstimadas : 0
  const gananciaSinGastoFijo = precioVentaSinIva - precioCompra
  const gananciaConGastoFijo = gananciaSinGastoFijo - gastoFijoPorUnidad
  const margenAjustado = precioVentaSinIva > 0 ? (gananciaConGastoFijo / precioVentaSinIva) * 100 : 0

  if (gastosFijosMensuales <= 0) {
    return (
      <p className="text-xs text-slate-400">
        Cargá tus gastos fijos mensuales en Configuración → Rentabilidad para poder calcular cuánto te queda
        realmente de este producto después de cubrirlos.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        className="text-sm font-medium text-primary-700 hover:underline"
      >
        {abierta ? 'Ocultar' : 'Ver'} margen real incluyendo gastos fijos
      </button>

      {abierta && (
        <div className="mt-3 space-y-3">
          <Input
            label="¿Cuántas unidades de este producto pensás vender este mes?"
            type="number"
            min={0}
            value={unidadesEstimadas || ''}
            onChange={(e) => setUnidadesEstimadas(Number(e.target.value))}
            placeholder="Ej: 10"
          />
          <p className="text-xs text-slate-400">
            Con tus gastos fijos actuales ({formatCurrency(gastosFijosMensuales)}/mes), así queda repartido si
            esperás vender esa cantidad de este producto.
          </p>

          {unidadesEstimadas > 0 && (
            <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Ganancia bruta por unidad (sin gastos fijos)</span>
                <span>{formatCurrency(gananciaSinGastoFijo)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gasto fijo que le toca a cada unidad</span>
                <span className="text-amber-700">-{formatCurrency(gastoFijoPorUnidad)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                <span>Ganancia real por unidad</span>
                <span>{formatCurrency(gananciaConGastoFijo)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Margen real</span>
                <span className={margenAjustado < 0 ? 'font-semibold text-red-600' : ''}>{margenAjustado.toFixed(1)}%</span>
              </div>
              {margenAjustado < 0 && (
                <p className="mt-1 text-xs text-red-600">
                  A este ritmo de ventas, este producto no te alcanza a cubrir ni el costo ni la parte de gastos
                  fijos que le corresponde — subí el precio, el margen, o revisá si esperás vender más unidades.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
