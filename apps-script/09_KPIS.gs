function getKPIs() {
  var hoy         = new Date();
  var mes         = hoy.getMonth() + 1;
  var anio        = hoy.getFullYear();
  var mesPrev     = mes === 1 ? 12 : mes - 1;
  var anioPrev    = mes === 1 ? anio - 1 : anio;

  var ventasMes      = getVentas({ mes: String(mes),     anio: String(anio) });
  var ventasAnt      = getVentas({ mes: String(mesPrev), anio: String(anioPrev) });

  var totalMes       = ventasMes.reduce(function(a, v) { return a + v.total; }, 0);
  var totalAnt       = ventasAnt.reduce(function(a, v) { return a + v.total; }, 0);
  var gananciasMes   = ventasMes.reduce(function(a, v) { return a + v.gananciaReal; }, 0);

  var movCaja        = getCaja({});
  var saldoCaja      = movCaja.length > 0 ? movCaja[movCaja.length - 1].saldoAcumulado : 0;

  var productos      = getProductos({ soloActivos: 'true' });
  var stockCritico   = productos.filter(function(p) { return p.stock <= p.stockMinimo && p.stockMinimo > 0; }).length;

  var cuotas         = getCuotas({});
  var cuotasVencidas = cuotas.filter(function(c) { return c.estado === 'vencida'; }).length;
  var cuotasPend     = cuotas.filter(function(c) { return c.estado === 'pendiente' || c.estado === 'parcial'; }).length;

  return {
    ventasMes:             totalMes,
    ventasMesAnterior:     totalAnt,
    gananciasMes:          gananciasMes,
    saldoCaja:             saldoCaja,
    productosStockCritico: stockCritico,
    cuotasVencidas:        cuotasVencidas,
    cuotasPendientesMes:   cuotasPend,
    topProductos:          getTopProductos(mes, anio),
  };
}

// Se arma a partir de las salidas de Inventario con motivo "Venta" (que
// se generan solas en cada venta) — no hace falta guardar los items de
// cada venta por separado.
function getTopProductos(mes, anio) {
  var movimientos = getInventario({});
  var acumulado = {};

  movimientos.forEach(function(m) {
    if (m.tipo !== 'salida' || m.motivo !== 'Venta') return;
    var fecha = new Date(m.fecha);
    if (fecha.getMonth() + 1 !== mes || fecha.getFullYear() !== anio) return;
    var key = m.nombreProducto || m.sku;
    acumulado[key] = (acumulado[key] || 0) + m.cantidad;
  });

  return Object.keys(acumulado)
    .map(function(nombre) { return { nombre: nombre, cantidad: acumulado[nombre] }; })
    .sort(function(a, b) { return b.cantidad - a.cantidad; })
    .slice(0, 5);
}

// Servicios más pedidos del mes, a partir de los turnos completados
// (no depende de que se hayan cobrado con "Cobrar y finalizar").
function getTopServicios(mes, anio) {
  var turnos = getTurnos({});
  var acumulado = {};

  turnos.forEach(function(t) {
    if (t.estado !== 'completado') return;
    var fecha = new Date(t.fecha + 'T00:00:00');
    if (fecha.getMonth() + 1 !== mes || fecha.getFullYear() !== anio) return;
    acumulado[t.servicio] = (acumulado[t.servicio] || 0) + 1;
  });

  return Object.keys(acumulado)
    .map(function(nombre) { return { nombre: nombre, cantidad: acumulado[nombre] }; })
    .sort(function(a, b) { return b.cantidad - a.cantidad; })
    .slice(0, 5);
}

// Reporte financiero: rentabilidad, punto de equilibrio y flujo de caja
// de los últimos días. Todo lo que necesita la pantalla de Reportes.
function getReporteFinanciero(params) {
  var hoy      = new Date();
  var mes      = params && params.mes ? Number(params.mes) : hoy.getMonth() + 1;
  var anio     = params && params.anio ? Number(params.anio) : hoy.getFullYear();

  var ventasMes    = getVentas({ mes: String(mes), anio: String(anio) });
  var totalVentas  = ventasMes.reduce(function(a, v) { return a + v.total; }, 0);
  var totalGanancia = ventasMes.reduce(function(a, v) { return a + v.gananciaReal; }, 0);
  var margenPromedio = totalVentas > 0 ? (totalGanancia / totalVentas) * 100 : 0;

  var config = getConfig();
  var gastosFijos = Number(config.gastosFijosMensuales) || 0;
  var puntoEquilibrio = margenPromedio > 0 ? gastosFijos / (margenPromedio / 100) : 0;

  // Flujo de caja de los últimos 14 días, para el gráfico chico.
  var movCaja = getCaja({});
  var hace14dias = new Date();
  hace14dias.setDate(hace14dias.getDate() - 14);
  var porDia = {};
  movCaja.forEach(function(m) {
    var fecha = new Date(m.fecha);
    if (fecha < hace14dias) return;
    var key = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (!porDia[key]) porDia[key] = { fecha: key, ingresos: 0, egresos: 0 };
    if (m.tipo === 'ingreso') porDia[key].ingresos += m.monto;
    else porDia[key].egresos += m.monto;
  });
  var flujoCaja = Object.keys(porDia).sort().map(function(k) { return porDia[k]; });

  return {
    ventasMes: totalVentas,
    gananciaMes: totalGanancia,
    margenPromedio: margenPromedio,
    gastosFijosMensuales: gastosFijos,
    puntoEquilibrio: puntoEquilibrio,
    porcentajeAlcanzado: puntoEquilibrio > 0 ? Math.min(100, (totalVentas / puntoEquilibrio) * 100) : 0,
    topProductos: getTopProductos(mes, anio),
    topServicios: getTopServicios(mes, anio),
    flujoCaja: flujoCaja,
  };
}

// Reporte por período elegido a mano (desde/hasta) — pensado para que la
// dueña vaya "agarrando" el rango que necesite (una semana, un mes, un
// año) y ver ingresos/egresos desglosados por medio de pago, además del
// detalle completo que alimenta la exportación a Excel/PDF.
function getReportePeriodo(params) {  var desde = (params && params.desde) || '2000-01-01';
  var hasta = (params && params.hasta) || '2100-01-01';

  var movCaja = getCaja({}).filter(function(m) {
    var f = String(m.fecha).slice(0, 10);
    return f >= desde && f <= hasta;
  });
  var ventas = getVentas({ desde: desde, hasta: hasta });
  var cuotas = getCuotas({}).filter(function(c) {
    var f = String(c.fechaVencimiento).slice(0, 10);
    return f >= desde && f <= hasta;
  });

  var porMedioPago = {};
  movCaja.forEach(function(m) {
    var medio = m.medioPago || '(sin especificar)';
    if (!porMedioPago[medio]) porMedioPago[medio] = { medioPago: medio, ingresos: 0, egresos: 0 };
    if (m.tipo === 'ingreso') porMedioPago[medio].ingresos += m.monto;
    else porMedioPago[medio].egresos += m.monto;
  });

  var porCanal = {};
  ventas.forEach(function(v) {
    var canal = v.canalVenta || '(sin especificar)';
    if (!porCanal[canal]) porCanal[canal] = { canal: canal, cantidad: 0, total: 0 };
    porCanal[canal].cantidad += 1;
    porCanal[canal].total += v.total;
  });

  var totalIngresos = movCaja.filter(function(m) { return m.tipo === 'ingreso'; }).reduce(function(a, m) { return a + m.monto; }, 0);
  var totalEgresos = movCaja.filter(function(m) { return m.tipo === 'egreso'; }).reduce(function(a, m) { return a + m.monto; }, 0);

  var porDia = {};
  movCaja.forEach(function(m) {
    var key = String(m.fecha).slice(0, 10);
    if (!porDia[key]) porDia[key] = { fecha: key, ingresos: 0, egresos: 0 };
    if (m.tipo === 'ingreso') porDia[key].ingresos += m.monto;
    else porDia[key].egresos += m.monto;
  });

  return {
    desde: desde,
    hasta: hasta,
    totalIngresos: totalIngresos,
    totalEgresos: totalEgresos,
    saldoNeto: totalIngresos - totalEgresos,
    totalVentas: ventas.reduce(function(a, v) { return a + v.total; }, 0),
    cantidadVentas: ventas.length,
    porMedioPago: Object.keys(porMedioPago).map(function(k) { return porMedioPago[k]; }),
    porCanal: Object.keys(porCanal).map(function(k) { return porCanal[k]; }).sort(function(a, b) { return b.total - a.total; }),
    flujoCaja: Object.keys(porDia).sort().map(function(k) { return porDia[k]; }),
    movimientos: movCaja,
    ventas: ventas,
    cuotas: cuotas,
  };
}

// Arqueo de caja: compara el saldo esperado en efectivo (según los
// movimientos registrados) contra lo que se contó físicamente, y
// registra la diferencia como un movimiento de ajuste si corresponde.
function getSaldoEfectivoEsperado() {
  var movimientos = getCaja({});
  var saldo = 0;
  movimientos.forEach(function(m) {
    if (String(m.medioPago).toLowerCase() !== 'efectivo') return;
    saldo += m.tipo === 'ingreso' ? m.monto : -m.monto;
  });
  return saldo;
}

function registrarArqueo(body) {
  var esperado = getSaldoEfectivoEsperado();
  var contado = Number(body.montoContado);
  var diferencia = contado - esperado;

  if (Math.abs(diferencia) > 0.5) {
    addMovimientoCaja({
      fecha: new Date(), tipo: diferencia > 0 ? 'ingreso' : 'egreso',
      concepto: 'Ajuste por arqueo de caja',
      categoria: 'Arqueo', monto: Math.abs(diferencia), medioPago: 'efectivo'
    });
  }

  return { esperado: esperado, contado: contado, diferencia: diferencia };
}

// Estadísticas de NPS: junta todas las notas de encuesta que dejaron
// las clientas (del mail "Gracias por tu visita") y calcula el promedio,
// la distribución (promotoras/pasivas/detractoras) y el puntaje NPS.
function getEstadisticasNPS() {
  var turnos = getTurnos({}).filter(function(t) { return t.notaEncuesta !== null && t.notaEncuesta !== undefined; });

  var promotoras = turnos.filter(function(t) { return t.notaEncuesta >= 9; }).length;
  var pasivas = turnos.filter(function(t) { return t.notaEncuesta >= 7 && t.notaEncuesta <= 8; }).length;
  var detractoras = turnos.filter(function(t) { return t.notaEncuesta <= 6; }).length;
  var total = turnos.length;

  var suma = turnos.reduce(function(a, t) { return a + t.notaEncuesta; }, 0);
  var promedio = total > 0 ? suma / total : 0;
  var nps = total > 0 ? Math.round(((promotoras - detractoras) / total) * 100) : 0;

  var comentarios = turnos
    .filter(function(t) { return t.comentarioEncuesta; })
    .sort(function(a, b) { return new Date(b.fechaCreacion) - new Date(a.fechaCreacion); })
    .slice(0, 10)
    .map(function(t) {
      return { cliente: t.cliente, servicio: t.servicio, nota: t.notaEncuesta, comentario: t.comentarioEncuesta, fecha: t.fecha };
    });

  return {
    totalRespuestas: total,
    promedio: promedio,
    nps: nps,
    promotoras: promotoras,
    pasivas: pasivas,
    detractoras: detractoras,
    comentarios: comentarios,
  };
}
