import type { Insumo, RecetaItem, Servicio } from '@/types'

export interface CostoServicio {
  costoInsumos: number
  costoManoObra: number
  costoTotal: number
  margenReal: number // %
  gananciaReal: number // $
}

export function calcularCostoServicio(servicio: Servicio, insumos: Insumo[] | undefined): CostoServicio {
  const costoInsumos = (servicio.receta || []).reduce((acc, item) => {
    const insumo = insumos?.find((i) => i.id === item.insumoId)
    const costoUnitario = insumo ? insumo.precioCosto : 0
    const rendimiento = item.rendimiento > 0 ? item.rendimiento : 1
    return acc + (costoUnitario / rendimiento) * item.cantidadPorServicio
  }, 0)

  const costoManoObra = servicio.costoManoObra || 0
  const costoTotal = costoInsumos + costoManoObra
  const gananciaReal = servicio.precio - costoTotal
  const margenReal = servicio.precio > 0 ? (gananciaReal / servicio.precio) * 100 : 0

  return { costoInsumos, costoManoObra, costoTotal, margenReal, gananciaReal }
}

export function nuevaLineaReceta(insumo: Insumo): RecetaItem {
  return {
    insumoId: insumo.id,
    nombre: insumo.nombre,
    rendimiento: 1,
    cantidadPorServicio: 1,
  }
}
