function getCaja(params) {
  var sheet    = getSheet('CAJA');
  var startRow = 11; // tabla empieza en fila 11
  var lastRow  = sheet.getLastRow();
  if (lastRow < startRow) return [];

  var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 12).getValues();

  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return {
      id:             String(r[0]),
      fecha:          r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      tipo:           String(r[2]).toLowerCase(),
      concepto:       String(r[3]),
      categoria:      String(r[4]),
      monto:          Number(r[5])  || 0,
      medioPago:      String(r[6]   || ''),
      referencia:     String(r[7]   || ''),
      fotoUrl:        String(r[8]   || ''),
      saldoAcumulado: Number(r[11]) || 0,
    };
  });
}

function addMovimientoCaja(body) {
  var sheet    = getSheet('CAJA');
  var startRow = 11;
  var lastRow  = Math.max(sheet.getLastRow(), startRow - 1);

  var saldoAnterior = lastRow >= startRow
    ? Number(sheet.getRange(lastRow, 12).getValue()) || 0
    : 0;

  var monto = Number(body.monto) || 0;
  var saldo = body.tipo === 'ingreso' ? saldoAnterior + monto : saldoAnterior - monto;
  var id    = generateId('MOV');

  var fotoUrl = '';
  if (body.fotoUrlExistente) {
    fotoUrl = body.fotoUrlExistente;
  } else if (body.fotoBase64) {
    try {
      fotoUrl = subirFotoGasto(body.concepto || 'gasto', body.fotoBase64, body.fotoMimeType, body.fotoNombre);
    } catch (e) {
      fotoUrl = '';
    }
  }

  sheet.appendRow([
    id, new Date(body.fecha), body.tipo, body.concepto,
    body.categoria || '', monto, body.medioPago || '', body.referencia || '',
    fotoUrl, '', '', saldo
  ]);

  return { id: id, saldoActual: saldo };
}
