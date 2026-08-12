// ============================================================
// INSUMOS
// A diferencia de PRODUCTOS (que se venden a las clientas), los
// insumos son materiales de uso interno: tinta, pinceles, algodón,
// guantes, etc. Se usan para calcular el costo real de cada servicio
// (ver 11_TURNOS.gs / receta del servicio), no aparecen en la Tienda
// ni en Ventas.
// ============================================================

function getInsumos(params) {
  var sheet = getSheet('INSUMOS');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var insumos = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) {
    var o = rowToObj(headers, r);
    return {
      id: String(o['ID'] || ''),
      nombre: String(o['Nombre'] || ''),
      precioCosto: Number(o['Precio Costo']) || 0,
      stock: Number(o['Stock']) || 0,
      stockMinimo: Number(o['Stock Mínimo']) || 0,
      unidad: String(o['Unidad'] || 'unidad'),
      activo: o['Activo'] !== 'NO',
    };
  });

  if (params && params.soloActivos === 'true') {
    insumos = insumos.filter(function(i) { return i.activo; });
  }
  return insumos;
}

function addInsumo(body) {
  var sheet = getSheet('INSUMOS');
  var id = generateId('INS');
  sheet.appendRow([
    id, body.nombre, Number(body.precioCosto) || 0, Number(body.stock) || 0,
    Number(body.stockMinimo) || 0, body.unidad || 'unidad', 'SI'
  ]);
  return { id: id };
}

function updateInsumo(body) {  var sheet = getSheet('INSUMOS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Insumo no encontrado');

  var fila = rowIndex + 1;
  function setCol(nombreCol, valor) {
    var idx = headers.indexOf(nombreCol);
    if (idx > -1) sheet.getRange(fila, idx + 1).setValue(valor);
  }

  if (body.nombre !== undefined)      setCol('Nombre', body.nombre);
  if (body.precioCosto !== undefined) setCol('Precio Costo', Number(body.precioCosto));
  if (body.stock !== undefined)       setCol('Stock', Number(body.stock));
  if (body.stockMinimo !== undefined) setCol('Stock Mínimo', Number(body.stockMinimo));
  if (body.unidad !== undefined)      setCol('Unidad', body.unidad);
  if (body.activo !== undefined)      setCol('Activo', body.activo ? 'SI' : 'NO');

  return { ok: true };
}

// Carga muchos insumos de una — se usa desde "Importar insumos" en el
// frontend (Excel/CSV), como el que le pasaste a Ariana con la lista
// de inventario inicial.
function addInsumosBulk(body) {
  var insumos = Array.isArray(body.insumos) ? body.insumos : [];
  var creados = [];
  var errores = [];

  insumos.forEach(function(i, idx) {
    try {
      if (!i.nombre) throw new Error('Falta el nombre');
      var r = addInsumo({
        nombre: i.nombre,
        precioCosto: Number(i.precioCosto) || 0,
        stock: Number(i.stock) || 0,
        stockMinimo: Number(i.stockMinimo) || 0,
        unidad: i.unidad || 'unidad'
      });
      creados.push(r.id);
    } catch (e) {
      errores.push({ fila: idx + 1, nombre: i.nombre || '(sin nombre)', error: e.message });
    }
  });

  return { creados: creados.length, errores: errores };
}
