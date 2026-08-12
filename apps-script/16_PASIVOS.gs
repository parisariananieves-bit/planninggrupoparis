// ============================================================
// PASIVOS (deudas: préstamos, tarjetas, proveedores a pagar, etc.)
// Junto con el Activo (getBalanceGeneral), arma el Balance General
// del negocio — la foto completa de lo que tenés y lo que debés.
// ============================================================

function getPasivos(params) {
  var sheet = getSheet('PASIVOS');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var pasivos = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) {
    var o = rowToObj(headers, r);
    return {
      id: String(o['ID'] || ''),
      nombre: String(o['Nombre'] || ''),
      monto: Number(o['Monto']) || 0,
      categoria: String(o['Categoría'] || ''),
      activo: o['Activo'] !== 'NO',
    };
  });

  if (params && params.soloActivos === 'true') {
    pasivos = pasivos.filter(function(p) { return p.activo; });
  }
  return pasivos;
}

function addPasivo(body) {
  var sheet = getSheet('PASIVOS');
  var id = generateId('PAS');
  sheet.appendRow([id, body.nombre, Number(body.monto) || 0, body.categoria || '', 'SI']);
  return { id: id };
}

function updatePasivo(body) {
  var sheet = getSheet('PASIVOS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Pasivo no encontrado');

  var fila = rowIndex + 1;
  function setCol(nombreCol, valor) {
    var idx = headers.indexOf(nombreCol);
    if (idx > -1) sheet.getRange(fila, idx + 1).setValue(valor);
  }

  if (body.nombre !== undefined)    setCol('Nombre', body.nombre);
  if (body.monto !== undefined)     setCol('Monto', Number(body.monto));
  if (body.categoria !== undefined) setCol('Categoría', body.categoria);
  if (body.activo !== undefined)    setCol('Activo', body.activo ? 'SI' : 'NO');

  return { ok: true };
}

// Balance General: todo lo que tiene el negocio (Activo) menos todo lo
// que debe (Pasivo) = lo que realmente es suyo (Patrimonio Neto).
function getBalanceGeneral() {
  var movCaja = getCaja({});
  var saldoCaja = movCaja.length > 0 ? movCaja[movCaja.length - 1].saldoAcumulado : 0;

  var productos = getProductos({});
  var valorInventarioProductos = productos.reduce(function(a, p) { return a + p.precioCompra * p.stock; }, 0);

  var insumos = getInsumos({});
  var valorInventarioInsumos = insumos.reduce(function(a, i) { return a + i.precioCosto * i.stock; }, 0);

  var cuotas = getCuotas({});
  var cuentasPorCobrar = cuotas
    .filter(function(c) { return c.estado === 'pendiente' || c.estado === 'parcial' || c.estado === 'vencida'; })
    .reduce(function(a, c) { return a + c.saldoPendiente; }, 0);

  var activo = {
    caja: saldoCaja,
    inventario: valorInventarioProductos + valorInventarioInsumos,
    cuentasPorCobrar: cuentasPorCobrar,
  };
  activo.total = activo.caja + activo.inventario + activo.cuentasPorCobrar;

  var pasivos = getPasivos({ soloActivos: 'true' });
  var totalPasivo = pasivos.reduce(function(a, p) { return a + p.monto; }, 0);

  return {
    activo: activo,
    pasivo: { detalle: pasivos, total: totalPasivo },
    patrimonioNeto: activo.total - totalPasivo,
  };
}
