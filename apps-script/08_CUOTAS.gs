function getCuotas(params) {
  var sheet    = getSheet('CUOTAS');
  var startRow = 5; // datos desde fila 5
  var lastRow  = sheet.getLastRow();
  if (lastRow < startRow) return [];

  var headers = sheet.getRange(4, 1, 1, 14).getValues()[0].map(function(h) { return String(h).trim(); });
  var data    = sheet.getRange(startRow, 1, lastRow - startRow + 1, 14).getValues();
  var hoy     = new Date();

  var cuotas = data.filter(function(r) { return r[0]; }).map(function(r) {
    var o           = rowToObj(headers, r);
    var vencimiento = o['Vencimiento'] instanceof Date ? o['Vencimiento'] : new Date(o['Vencimiento']);
    var montoCuota  = Number(o['Monto'] || o['Monto Cuota']) || 0;
    var pagado      = Number(o['Pagado'] || o['Monto Pagado']) || 0;
    var saldo       = montoCuota - pagado;

    var estado = saldo <= 0 ? 'pagada'
      : pagado > 0          ? 'parcial'
      : vencimiento < hoy   ? 'vencida'
      : 'pendiente';

    return {
      id:               String(o['ID']          || ''),
      ventaId:          String(o['Venta ID']     || o['ID Venta'] || ''),
      cliente:          String(o['Cliente']      || ''),
      fechaVencimiento: vencimiento instanceof Date ? vencimiento.toISOString() : '',
      montoCuota:       montoCuota,
      montoPagado:      pagado,
      saldoPendiente:   Math.max(saldo, 0),
      estado:           estado,
      numeroCuota:      Number(o['N° Cuota']     || o['Numero'])       || 1,
      totalCuotas:      Number(o['Total Cuotas'] || o['Cuotas'])       || 1,
    };
  });

  if (params && params.estado) {
    cuotas = cuotas.filter(function(c) { return c.estado === params.estado; });
  }

  return cuotas;
}

function pagarCuota(body) {
  var sheet    = getSheet('CUOTAS');
  var startRow = 5;
  var data     = sheet.getRange(startRow, 1, sheet.getLastRow() - startRow + 1, 14).getValues();

  var rowIndex = -1;
  data.forEach(function(r, i) {
    if (String(r[0]) === String(body.cuotaId)) rowIndex = i;
  });

  if (rowIndex === -1) throw new Error('Cuota no encontrada: ' + body.cuotaId);

  var sheetRow   = startRow + rowIndex;
  var montoPrev  = Number(sheet.getRange(sheetRow, 9).getValue()) || 0;
  sheet.getRange(sheetRow, 9).setValue(montoPrev + Number(body.montoPago));
  sheet.getRange(sheetRow, 10).setValue(new Date(body.fecha));

  addMovimientoCaja({
    fecha: body.fecha, tipo: 'ingreso',
    concepto: 'Pago cuota ' + body.cuotaId,
    categoria: 'Cobro cuotas',
    monto: body.montoPago,
    medioPago: body.medioPago || '',
    referencia: body.cuotaId
  });

  return { ok: true };
}

// Se llama sola desde addVenta cuando la venta se hizo "en cuotas".
// Genera una fila por cuota, con vencimientos mensuales a partir de la
// fecha de la venta (30, 60, 90 días...).
function addCuotasParaVenta(ventaId, cliente, total, cantidadCuotas, fechaVenta) {
  var n = Math.max(1, Number(cantidadCuotas) || 1);
  var montoCuota = Math.round((total / n) * 100) / 100;
  var sheet = getSheet('CUOTAS');
  var fechaBase = new Date(fechaVenta);

  for (var i = 1; i <= n; i++) {
    var vencimiento = new Date(fechaBase);
    vencimiento.setMonth(vencimiento.getMonth() + i);

    sheet.appendRow([
      generateId('CUO'), ventaId, cliente || '', vencimiento, montoCuota,
      i, n, '', 0, '', '', '', '', ''
    ]);
  }
}
