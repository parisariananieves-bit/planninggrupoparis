function getClientes(params) {
  var sheet   = getSheet('CLIENTES');
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows    = data.slice(1).filter(function(r) { return r[0]; });

  return rows.map(function(r) {
    var o = rowToObj(headers, r);
    return {
      id:                   String(o['ID']          || ''),
      nombre:               String(o['Nombre']      || ''),
      email:                String(o['Email']       || ''),
      telefono:             String(o['Teléfono']    || o['Telefono'] || ''),
      direccion:            String(o['Dirección']   || o['Direccion'] || ''),
      fechaAlta:            o['Fecha Alta'] instanceof Date ? o['Fecha Alta'].toISOString() : '',
      totalCompras:         Number(o['Total Compras'])    || 0,
      cantidadCompras:      Number(o['Cantidad Compras']) || 0,
      ultimaCompra:         o['Última Compra'] instanceof Date ? o['Última Compra'].toISOString() : '',
      saldoCuentaCorriente: Number(o['Saldo CC'] || o['Cuenta Corriente']) || 0,
      notas:                String(o['Notas']     || ''),
    };
  });
}

function addCliente(body) {
  var sheet = getSheet('CLIENTES');
  var id    = generateId('CLI');

  sheet.appendRow([
    id, body.nombre, body.email || '', body.telefono || '',
    body.direccion || '', new Date(),
    0, 0, '', 0, body.notas || ''
  ]);

  return { id: id };
}

function updateCliente(body) {
  var sheet = getSheet('CLIENTES');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Cliente no encontrado');

  var fila = rowIndex + 1;
  function setCol(nombresPosibles, valor) {
    for (var j = 0; j < nombresPosibles.length; j++) {
      var idx = headers.indexOf(nombresPosibles[j]);
      if (idx > -1) { sheet.getRange(fila, idx + 1).setValue(valor); return; }
    }
  }

  if (body.nombre !== undefined)    setCol(['Nombre'], body.nombre);
  if (body.email !== undefined)     setCol(['Email'], body.email);
  if (body.telefono !== undefined)  setCol(['Teléfono', 'Telefono'], body.telefono);
  if (body.direccion !== undefined) setCol(['Dirección', 'Direccion'], body.direccion);
  if (body.notas !== undefined)     setCol(['Notas'], body.notas);

  return { ok: true };
}

// Se llama sola desde addVenta cada vez que se registra una venta. Si el
// nombre coincide con un cliente ya cargado, le suma la compra a sus
// estadísticas. Si no existe y no es "Consumidor final", lo crea solo.
function actualizarEstadisticasCliente(nombreCliente, monto, fecha) {
  var nombre = (nombreCliente || '').trim();
  if (!nombre || nombre.toLowerCase() === 'consumidor final') return;

  var sheet = getSheet('CLIENTES');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var idxNombre = headers.indexOf('Nombre');
  var idxTotal = headers.indexOf('Total Compras');
  var idxCantidad = headers.indexOf('Cantidad Compras');
  var idxUltima = headers.indexOf('Última Compra');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idxNombre]).trim().toLowerCase() === nombre.toLowerCase()) {
      var fila = i + 1;
      var totalActual = Number(data[i][idxTotal]) || 0;
      var cantidadActual = Number(data[i][idxCantidad]) || 0;
      sheet.getRange(fila, idxTotal + 1).setValue(totalActual + monto);
      sheet.getRange(fila, idxCantidad + 1).setValue(cantidadActual + 1);
      sheet.getRange(fila, idxUltima + 1).setValue(new Date(fecha));
      return;
    }
  }

  // No existía: lo creamos para que la ficha quede completa desde ya.
  sheet.appendRow([
    generateId('CLI'), nombre, '', '', '', new Date(),
    monto, 1, new Date(fecha), 0, 'Creado automáticamente desde una venta'
  ]);
}
