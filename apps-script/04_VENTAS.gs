function getVentas(params) {
  var sheet   = getSheet('VENTAS');
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows    = data.slice(1).filter(function(r) { return r[0]; });

  var ventas = rows.map(function(r) {
    var o = rowToObj(headers, r);
    return {
      id:               String(o['ID'] || o['N°']),
      fecha:            o['Fecha'] instanceof Date ? o['Fecha'].toISOString() : String(o['Fecha']),
      cliente:          String(o['Cliente']        || ''),
      subtotal:         Number(o['Subtotal'])       || 0,
      descuentoGeneral: Number(o['Descuento'])      || 0,
      iva:              Number(o['IVA'])            || 0,
      total:            Number(o['Total'])          || 0,
      medioPago:        String(o['Medio de Pago']  || ''),
      canalVenta:       String(o['Canal']          || ''),
      comision:         Number(o['% Comisión'])     || 0,
      montoComision:    Number(o['Comisión $'])     || 0,
      gananciaReal:     Number(o['Ganancia Real'])  || 0,
      margenNeto:       Number(o['Margen Neto'])    || 0,
      tipoPago:         String(o['Tipo Pago']       || 'contado'),
      notas:            String(o['Notas']           || ''),
      items:            [],
    };
  });

  if (params && params.mes && params.anio) {
    var mes  = Number(params.mes);
    var anio = Number(params.anio);
    ventas = ventas.filter(function(v) {
      var d = new Date(v.fecha);
      return d.getMonth() + 1 === mes && d.getFullYear() === anio;
    });
  }

  if (params && params.desde) {
    ventas = ventas.filter(function(v) { return v.fecha.slice(0, 10) >= params.desde; });
  }
  if (params && params.hasta) {
    ventas = ventas.filter(function(v) { return v.fecha.slice(0, 10) <= params.hasta; });
  }

  return ventas.reverse();
}

function addVenta(body) {
  var sheet    = getSheet('VENTAS');
  var config   = getConfig();
  var id       = generateId('VTA');
  var comision = config.comisiones[body.medioPago] || 0;
  var montoComision = body.total * (comision / 100);

  sheet.appendRow([
    id, new Date(body.fecha), body.cliente || '',
    body.subtotal || 0, body.descuentoGeneral || 0, body.iva || 0, body.total,
    body.medioPago || '', body.canalVenta || '',
    comision, montoComision, body.gananciaReal || 0,
    body.tipoPago || 'contado', body.notas || ''
  ]);

  if (body.tipoPago === 'contado') {
    addMovimientoCaja({
      fecha: body.fecha, tipo: 'ingreso',
      concepto: 'Venta ' + id + (body.cliente ? ' - ' + body.cliente : ''),
      categoria: 'Ventas', monto: body.total,
      medioPago: body.medioPago, referencia: id
    });
  }

  if (body.tipoPago === 'cuotas') {
    addCuotasParaVenta(id, body.cliente, body.total, body.cantidadCuotas || 3, body.fecha);
  }

  if (Array.isArray(body.items)) {
    body.items.forEach(function(item) {
      addMovimientoStock({
        fecha: body.fecha, tipo: 'salida',
        sku: item.sku, cantidad: item.cantidad,
        motivo: 'Venta', referencia: id
      });
    });
  }

  try {
    actualizarEstadisticasCliente(body.cliente, body.total, body.fecha);
  } catch (e) {
    // no interrumpe la venta si falla la actualización del cliente
  }

  return { id: id };
}
