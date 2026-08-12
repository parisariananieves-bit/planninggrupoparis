// ============================================================
// PROMOCIONES
// Tipos soportados: '2x1' (cada 2 unidades, se cobra 1) y
// 'descuentoPct' (% de descuento automático sobre ese producto).
// 'aplicaA' es un SKU puntual, o 'todos' para que aplique a
// cualquier producto de la venta.
// ============================================================

function getPromociones(params) {
  var sheet = getSheet('PROMOCIONES');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var promos = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) {
    var o = rowToObj(headers, r);
    return {
      id: String(o['ID'] || ''),
      nombre: String(o['Nombre'] || ''),
      tipo: String(o['Tipo'] || '2x1'),
      aplicaA: String(o['Aplica a'] || 'todos'),
      valor: Number(o['Valor']) || 0,
      activo: o['Activo'] !== 'NO',
    };
  });

  if (params && params.soloActivas === 'true') {
    promos = promos.filter(function(p) { return p.activo; });
  }
  return promos;
}

function addPromocion(body) {
  var sheet = getSheet('PROMOCIONES');
  var id = generateId('PRM');
  sheet.appendRow([id, body.nombre, body.tipo, body.aplicaA || 'todos', Number(body.valor) || 0, 'SI']);
  return { id: id };
}

function updatePromocion(body) {
  var sheet = getSheet('PROMOCIONES');
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Promoción no encontrada');

  var fila = rowIndex + 1;
  if (body.nombre !== undefined)  sheet.getRange(fila, 2).setValue(body.nombre);
  if (body.tipo !== undefined)    sheet.getRange(fila, 3).setValue(body.tipo);
  if (body.aplicaA !== undefined) sheet.getRange(fila, 4).setValue(body.aplicaA);
  if (body.valor !== undefined)   sheet.getRange(fila, 5).setValue(Number(body.valor));
  if (body.activo !== undefined)  sheet.getRange(fila, 6).setValue(body.activo ? 'SI' : 'NO');

  return { ok: true };
}
