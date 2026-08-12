import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Truck, X } from 'lucide-react'
import { useProductos, usePromociones, useReporteFinanciero } from '@/hooks/useEntities'
import { useConfig } from '@/hooks/useConfig'
import { Button } from '@/components/ui'
import { ImagenConFallback } from '@/components/ImagenConFallback'
import { formatCurrency } from '@/lib/format'
import { buscarPromocion } from '@/lib/promociones'
import type { Producto } from '@/types'

interface ItemCarrito {
  producto: Producto
  cantidad: number
}

function TarjetaProducto({
  p,
  promo,
  enCarrito,
  onAgregar,
  onCambiarCantidad,
  compacta,
}: {
  p: Producto
  promo: ReturnType<typeof buscarPromocion>
  enCarrito?: ItemCarrito
  onAgregar: (p: Producto) => void
  onCambiarCantidad: (sku: string, delta: number) => void
  compacta?: boolean
}) {
  const fotos = p.fotos && p.fotos.length > 0 ? p.fotos : p.fotoUrl ? [p.fotoUrl] : []
  const [indice, setIndice] = useState(0)

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className={`relative flex items-center justify-center overflow-hidden bg-primary-50 ${compacta ? 'aspect-square' : 'aspect-[4/5]'}`}>
        {promo && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-primary-700 px-2.5 py-1 text-[10px] font-bold text-white shadow">
            {promo.tipo === '2x1' ? '2X1' : `-${promo.valor}%`}
          </span>
        )}
        <ImagenConFallback
          src={fotos[indice] || ''}
          alt={p.nombre}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          Icono={ShoppingBag}
          iconoClassName="h-10 w-10 text-primary-200"
        />
        {fotos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndice(i) }}
                className={`h-1.5 rounded-full transition-all ${i === indice ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-sm font-medium text-slate-900">{p.nombre}</p>
        {p.descripcion && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{p.descripcion}</p>}
        <div className="mt-auto pt-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">{formatCurrency(p.precioVentaConIva)}</p>
          {!enCarrito ? (
            <Button onClick={() => onAgregar(p)} className="w-full justify-center text-xs">
              Agregar al carrito
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-2 py-1.5">
              <button onClick={() => onCambiarCantidad(p.sku, -1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm hover:bg-primary-100">
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-semibold text-primary-800">{enCarrito.cantidad}</span>
              <button onClick={() => onCambiarCantidad(p.sku, 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm hover:bg-primary-100">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Tienda() {
  const { data: config } = useConfig()
  const { data: productos, isLoading } = useProductos(true)
  const { data: promociones } = usePromociones(true)
  const { data: reporte } = useReporteFinanciero()
  const [categoria, setCategoria] = useState('todas')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)

  useEffect(() => {
    if (!carritoAbierto) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCarritoAbierto(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [carritoAbierto])

  const logoSrc = config?.logoUrl?.trim() || '/logo.png'
  const whatsapp = config?.whatsappContacto || ''
  const nombreNegocio = config?.nombreNegocio || 'Oletha Beauty'

  const categorias = useMemo(() => {
    const set = new Set((productos || []).map((p) => p.categoria).filter(Boolean))
    return ['todas', ...Array.from(set)]
  }, [productos])

  const productosFiltrados = (productos || []).filter(
    (p) => categoria === 'todas' || p.categoria === categoria
  )

  // Destacados: los más vendidos según Reportes; si todavía no hay datos
  // de ventas, mostramos los primeros del catálogo para que la sección
  // nunca quede vacía.
  const destacados = useMemo(() => {
    if (!productos) return []
    const nombresTop = (reporte?.topProductos || []).map((t) => t.nombre)
    const deTop = nombresTop.map((n) => productos.find((p) => p.nombre === n)).filter(Boolean) as Producto[]
    if (deTop.length > 0) return deTop.slice(0, 4)
    return productos.slice(0, 4)
  }, [productos, reporte])

  const productoHero = productos?.find((p) => p.fotoUrl) || productos?.[0]

  const totalItems = carrito.reduce((a, it) => a + it.cantidad, 0)
  const totalCarrito = carrito.reduce((a, it) => a + it.producto.precioVentaConIva * it.cantidad, 0)

  function agregarAlCarrito(producto: Producto) {
    setCarrito((prev) => {
      const existe = prev.find((it) => it.producto.sku === producto.sku)
      if (existe) {
        return prev.map((it) => (it.producto.sku === producto.sku ? { ...it, cantidad: it.cantidad + 1 } : it))
      }
      return [...prev, { producto, cantidad: 1 }]
    })
    setCarritoAbierto(true)
  }

  function cambiarCantidad(sku: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((it) => (it.producto.sku === sku ? { ...it, cantidad: it.cantidad + delta } : it))
        .filter((it) => it.cantidad > 0)
    )
  }

  function armarMensajeWhatsapp() {
    const lineas = carrito.map(
      (it) => `${it.cantidad}× ${it.producto.nombre} — ${formatCurrency(it.producto.precioVentaConIva * it.cantidad)}`
    )
    return `¡Hola! Quiero hacer este pedido:\n\n` + lineas.join('\n') + `\n\nTotal: ${formatCurrency(totalCarrito)}`
  }

  const linkCheckout = whatsapp
    ? `https://wa.me/${String(whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(armarMensajeWhatsapp())}`
    : null

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Barra de anuncio */}
      <div className="bg-primary-700 py-2 text-center text-xs font-medium text-white">
        {config?.mensajeBanner || '✨ Coordinamos tu pedido directo por WhatsApp — respuesta rápida'}
      </div>

      {/* Header con logo, categorías y carrito */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/login" className="flex items-center gap-1 rounded-lg p-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Volver</span>
          </a>

          <div className="flex items-center gap-2">
            <img src={logoSrc} alt={nombreNegocio} className="h-9 w-9 rounded-full object-contain" />
            <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">{nombreNegocio}</span>
          </div>

          <button
            onClick={() => setCarritoAbierto(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-3 pr-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="hidden sm:inline">{totalItems > 0 ? formatCurrency(totalCarrito) : 'Mi carrito'}</span>
            <span className="relative">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </span>
          </button>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2.5 md:justify-center">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                categoria === c ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c === 'todas' ? 'Todos' : c}
            </button>
          ))}
        </div>
      </header>

      {/* Hero de dos columnas, estilo Rare Beauty: marca a la izquierda, producto destacado a la derecha */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative flex min-h-[280px] flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-white to-primary-50 p-8 md:min-h-[360px] md:p-10">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-300/40 blur-2xl" />
            <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-accent-500/30 blur-2xl" />
            <p className="relative mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-primary-700">
              <Sparkles className="h-3.5 w-3.5" /> Tienda online
            </p>
            <h1 className="relative font-serif text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              {nombreNegocio}
            </h1>
            <p className="relative mt-3 max-w-xs text-sm text-slate-700">
              Elegí tus productos favoritos y armá tu pedido — lo confirmás directo por WhatsApp.
            </p>
          </div>

          {productoHero && (
            <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-3xl bg-primary-50 p-6 md:min-h-[360px]">
              <span className="absolute right-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-primary-700 shadow-md">
                Ver en la tienda ↓
              </span>
              <ImagenConFallback
                src={productoHero.fotoUrl}
                alt={productoHero.nombre}
                className="h-40 w-40 rounded-2xl object-cover shadow-xl md:h-56 md:w-56"
                Icono={ShoppingBag}
                iconoClassName="h-16 w-16 text-primary-200"
              />
              <p className="mt-4 font-serif text-lg font-semibold text-slate-900">{productoHero.nombre}</p>
              <p className="text-sm text-slate-600">{formatCurrency(productoHero.precioVentaConIva)}</p>
            </div>
          )}
        </div>
      </section>

      {/* Destacados: fondo degradé, como la sección de bestsellers de la referencia */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <div className="rounded-3xl bg-gradient-to-br from-accent-100 via-white to-primary-50 p-5 md:p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-serif text-2xl font-semibold text-slate-900">Destacados</h2>
              <span className="text-xs text-slate-500">Lo que más eligen</span>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {destacados.map((p) => (
                <TarjetaProducto
                  key={p.sku}
                  p={p}
                  promo={buscarPromocion(promociones, p.sku)}
                  enCarrito={carrito.find((it) => it.producto.sku === p.sku)}
                  onAgregar={agregarAlCarrito}
                  onCambiarCantidad={cambiarCantidad}
                  compacta
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catálogo completo */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
          Todo el catálogo
        </h2>

        {isLoading && <p className="text-center text-sm text-slate-400">Cargando productos...</p>}
        {productos && productosFiltrados.length === 0 && (
          <p className="text-center text-sm text-slate-400">No hay productos disponibles todavía.</p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productosFiltrados.map((p) => (
            <TarjetaProducto
              key={p.sku}
              p={p}
              promo={buscarPromocion(promociones, p.sku)}
              enCarrito={carrito.find((it) => it.producto.sku === p.sku)}
              onAgregar={agregarAlCarrito}
              onCambiarCantidad={cambiarCantidad}
            />
          ))}
        </div>
      </div>

      {/* Franja de confianza */}
      <section className="border-y border-slate-100 bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <Truck className="h-6 w-6 text-primary-600" />
            <p className="text-sm font-medium text-slate-800">Coordinamos la entrega</p>
            <p className="text-xs text-slate-500">Retiro o envío, lo vemos por WhatsApp</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary-600" />
            <p className="text-sm font-medium text-slate-800">Atención personalizada</p>
            <p className="text-xs text-slate-500">Confirmamos tu pedido a mano</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <p className="text-sm font-medium text-slate-800">Productos originales</p>
            <p className="text-xs text-slate-500">Los mismos que usamos en el estudio</p>
          </div>
        </div>
      </section>

      {/* Footer con contacto */}
      <footer className="px-4 py-8 text-center">
        <img src={logoSrc} alt={nombreNegocio} className="mx-auto mb-3 h-10 w-10 rounded-full object-contain" />
        <p className="font-serif text-sm font-semibold text-slate-800">{nombreNegocio}</p>
        {whatsapp && <p className="mt-1 text-xs text-slate-500">WhatsApp: {whatsapp}</p>}
        {config?.email && <p className="text-xs text-slate-500">{config.email}</p>}
        <a href="/login" className="mt-4 inline-block text-xs text-slate-400 hover:text-slate-600">
          Volver al inicio
        </a>
      </footer>

      {/* Barra flotante de total */}
      {totalItems > 0 && !carritoAbierto && (
        <button
          onClick={() => setCarritoAbierto(true)}
          className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between rounded-2xl bg-slate-900 px-5 py-3.5 text-white shadow-xl"
        >
          <span className="text-sm font-medium">{totalItems} producto{totalItems === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            {formatCurrency(totalCarrito)}
            <ShoppingBag className="h-4 w-4" />
          </span>
        </button>
      )}

      {/* Carrito lateral */}
      {carritoAbierto && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCarritoAbierto(false)
          }}
        >
          <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="font-serif text-lg font-semibold text-slate-900">Mi carrito</h2>
              <button onClick={() => setCarritoAbierto(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {carrito.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Tenés tu carrito vacío.<br />Agregá productos para armar tu pedido.</p>
              ) : (
                <ul className="space-y-3">
                  {carrito.map((it) => (
                    <li key={it.producto.sku} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-50">
                          <ImagenConFallback
                            src={it.producto.fotoUrl}
                            alt={it.producto.nombre}
                            className="h-full w-full object-cover"
                            Icono={ShoppingBag}
                            iconoClassName="h-4 w-4 text-primary-200"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{it.producto.nombre}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(it.producto.precioVentaConIva)} c/u</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => cambiarCantidad(it.producto.sku, -1)} className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{it.cantidad}</span>
                        <button onClick={() => cambiarCantidad(it.producto.sku, 1)} className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t border-slate-100 p-5">
                <div className="mb-3 flex justify-between font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(totalCarrito)}</span>
                </div>
                {linkCheckout ? (
                  <a
                    href={linkCheckout}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    Confirmar pedido por WhatsApp
                  </a>
                ) : (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                    El negocio todavía no cargó un WhatsApp de contacto para recibir pedidos.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
