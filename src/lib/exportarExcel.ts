import type { ReportePeriodo } from '@/types'
import { formatDate } from '@/lib/format'

export async function exportarReporteExcel(reporte: ReportePeriodo, nombreNegocio: string) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // ---------- Hoja Resumen ----------
  const resumen = [
    [nombreNegocio],
    [`Reporte financiero del ${formatDate(reporte.desde)} al ${formatDate(reporte.hasta)}`],
    [],
    ['Total ingresos', reporte.totalIngresos],
    ['Total egresos', reporte.totalEgresos],
    ['Saldo neto del período', reporte.saldoNeto],
    [],
    ['Cantidad de ventas', reporte.cantidadVentas],
    ['Total facturado en ventas', reporte.totalVentas],
    [],
    ['Desglose por medio de pago'],
    ['Medio de pago', 'Ingresos', 'Egresos', 'Neto'],
    ...reporte.porMedioPago.map((m) => [m.medioPago, m.ingresos, m.egresos, m.ingresos - m.egresos]),
    [],
    ['Desglose por canal de venta'],
    ['Canal', 'Cantidad de ventas', 'Total'],
    ...reporte.porCanal.map((c) => [c.canal, c.cantidad, c.total]),
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen)
  wsResumen['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // ---------- Hoja Movimientos de caja ----------
  const movHeaders = ['Fecha', 'Tipo', 'Concepto', 'Categoría', 'Medio de pago', 'Monto', 'Saldo acumulado']
  const movRows = reporte.movimientos.map((m) => [
    formatDate(m.fecha),
    m.tipo,
    m.concepto,
    m.categoria,
    m.medioPago,
    m.tipo === 'ingreso' ? m.monto : -m.monto,
    m.saldoAcumulado,
  ])
  const wsMov = XLSX.utils.aoa_to_sheet([movHeaders, ...movRows])
  wsMov['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos de caja')

  // ---------- Hoja Ventas ----------
  const ventaHeaders = ['Fecha', 'Cliente', 'Subtotal', 'Descuento', 'IVA', 'Total', 'Medio de pago', 'Tipo de pago', 'Canal', 'Ganancia real']
  const ventaRows = reporte.ventas.map((v) => [
    formatDate(v.fecha),
    v.cliente || 'Consumidor final',
    v.subtotal,
    v.descuentoGeneral,
    v.iva,
    v.total,
    v.medioPago,
    v.tipoPago,
    v.canalVenta,
    v.gananciaReal,
  ])
  const wsVentas = XLSX.utils.aoa_to_sheet([ventaHeaders, ...ventaRows])
  wsVentas['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas')

  // ---------- Hoja Cuotas del período ----------
  if (reporte.cuotas.length > 0) {
    const cuotaHeaders = ['Cliente', 'Vencimiento', 'Monto cuota', 'Estado', 'Monto pagado']
    const cuotaRows = reporte.cuotas.map((c) => [c.cliente, formatDate(c.fechaVencimiento), c.montoCuota, c.estado, c.montoPagado])
    const wsCuotas = XLSX.utils.aoa_to_sheet([cuotaHeaders, ...cuotaRows])
    wsCuotas['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsCuotas, 'Cuotas')
  }

  const nombreArchivo = `Reporte ${nombreNegocio} ${reporte.desde} a ${reporte.hasta}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
