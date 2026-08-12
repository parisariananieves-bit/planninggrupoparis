function getInventario(params) {
  var sheet   = getSheet('INVENTARIO');
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows    = data.slice(1).filter(function(r) { return r[0]; });

  var movimientos = rows.map(function(r) {
    var o = rowToObj(headers, r);
    return {
      id:              String(o['ID']          || ''),
      fecha:           o['Fecha'] instanceof Date ? o['Fecha'].toISOString() : String(o['Fecha']),
      tipo:            String(o['Tipo']         || '').toLowerCase(),
      sku:             String(o['SKU']          || ''),
      nombreProducto:  String(o['Producto']     || o['Nombre'] || ''),
      cantidad:        Number(o['Cantidad'])     || 0,
      motivo:          String(o['Motivo']       || ''),
      referencia:      String(o['Referencia']   || ''),
      stockResultante: Number(o['Stock Resultante'] || o['Stock']) || 0,
    };
  });

  if (params && params.sku) {
    movimientos = movimientos.filter(function(m) { return m.sku === params.sku; });
  }

  return movimientos;
}

function addMovimientoStock(body) {
  var sheet    = getSheet('INVENTARIO');
  var id       = generateId('INV');
  var cantidad = Number(body.cantidad) || 0;
  var stockActual     = calcularStock(body.sku);
  var stockResultante = body.tipo === 'entrada'
    ? stockActual + cantidad
    : stockActual - cantidad;

  sheet.appendRow([
    id, new Date(body.fecha || new Date()), body.tipo,
    body.sku, body.nombreProducto || '',
    cantidad, body.motivo || '', body.referencia || '',
    stockResultante
  ]);

  return { id: id, stockResultante: stockResultante };
}

function calcularStock(sku) {
  var sheet   = getSheet('INVENTARIO');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var skuIdx  = headers.indexOf('SKU');
  var tipIdx  = headers.indexOf('Tipo');
  var canIdx  = headers.indexOf('Cantidad');
  var stock   = 0;

  data.slice(1).forEach(function(r) {
    if (String(r[skuIdx]) === sku) {
      var cant = Number(r[canIdx]) || 0;
      stock += String(r[tipIdx]).toLowerCase() === 'entrada' ? cant : -cant;
    }
  });

  return stock;
}
