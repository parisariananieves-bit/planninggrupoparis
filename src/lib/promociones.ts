import type { Promocion } from '@/types'

export function buscarPromocion(promociones: Promocion[] | undefined, sku: string): Promocion | null {
  if (!promociones) return null
  return (
    promociones.find((p) => p.activo && p.aplicaA === sku) ||
    promociones.find((p) => p.activo && p.aplicaA === 'todos') ||
    null
  )
}

// Calcula el subtotal real de un ítem del carrito aplicando la promoción
// que corresponda. Devuelve también una etiqueta para mostrar en el UI.
export function calcularSubtotalConPromo(
  precioUnitario: number,
  cantidad: number,
  promo: Promocion | null
): { subtotal: number; etiqueta: string | null } {
  if (!promo) {
    return { subtotal: precioUnitario * cantidad, etiqueta: null }
  }

  if (promo.tipo === '2x1') {
    const pares = Math.floor(cantidad / 2)
    const unidadesACobrar = cantidad - pares
    return {
      subtotal: precioUnitario * unidadesACobrar,
      etiqueta: pares > 0 ? `2x1 aplicado (${pares} gratis)` : '2x1 activo',
    }
  }

  if (promo.tipo === 'descuentoPct') {
    const subtotal = precioUnitario * cantidad * (1 - promo.valor / 100)
    return { subtotal, etiqueta: `-${promo.valor}% (${promo.nombre})` }
  }

  return { subtotal: precioUnitario * cantidad, etiqueta: null }
}
