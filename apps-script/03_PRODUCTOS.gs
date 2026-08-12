function calcularStockPorSku() {
  var sheet = getSheet('INVENTARIO');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var skuIdx = headers.indexOf('SKU');
  var tipIdx = headers.indexOf('Tipo');
  var canIdx = headers.indexOf('Cantidad');
  var stockPorSku = {};

  data.slice(1).forEach(function(r) {
    var sku = String(r[skuIdx]);
    if (!sku) return;
    var cant = Number(r[canIdx]) || 0;
    var signo = String(r[tipIdx]).toLowerCase() === 'entrada' ? 1 : -1;
    stockPorSku[sku] = (stockPorSku[sku] || 0) + signo * cant;
  });

  return stockPorSku;
}

function getProductos(params) {
  var sheet   = getSheet('PRODUCTOS');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows    = data.slice(1).filter(function(r) { return r[0]; });

  // El stock real se calcula siempre a partir de los movimientos de
  // Inventario (fuente de verdad), no de la columna "Stock" de esta
  // hoja, que era un valor fijo que nunca se actualizaba.
  var stockPorSku = calcularStockPorSku();

  var productos = rows.map(function(r) {
    var o = rowToObj(headers, r);
    var sku = String(o['SKU']);
    return {
      sku:               sku,
      nombre:            String(o['Nombre']),
      descripcion:       String(o['Descripción'] || ''),
      categoria:         String(o['Categoría']   || ''),
      precioCompra:      Number(o['Precio Compra'])        || 0,
      precioVentaSinIva: Number(o['Precio Venta s/IVA'])  || 0,
      precioVentaConIva: Number(o['Precio Venta c/IVA'])  || 0,
      margen:            Number(o['Margen %'])             || 0,
      stock:             stockPorSku[sku] || 0,
      stockMinimo:       Number(o['Stock Mínimo'])         || 0,
      proveedor:         String(o['Proveedor']             || ''),
      activo:            o['Activo'] !== false && o['Activo'] !== 'NO',
      fotoUrl:           String(o['Foto URL'] || '').split('|')[0] || '',
      fotos:             String(o['Foto URL'] || '').split('|').map(function(u) { return u.trim(); }).filter(Boolean),
    };
  });

  if (params && params.soloActivos === 'true') {
    productos = productos.filter(function(p) { return p.activo; });
  }

  return productos;
}

function calcularPrecioYMargen(precioCompra, precioVentaSinIva) {
  var config = getConfig();
  var iva = 1 + (config.iva / 100);
  var precioConIva = precioVentaSinIva * iva;
  var margen = precioCompra > 0 ? ((precioVentaSinIva - precioCompra) / precioCompra) * 100 : 0;
  return { precioConIva: precioConIva, margen: margen };
}

function addProducto(body) {
  var sheet = getSheet('PRODUCTOS');
  var calc = calcularPrecioYMargen(body.precioCompra, body.precioVentaSinIva);
  var sku = 'SKU-' + String(sheet.getLastRow()).padStart(4, '0');

  var fotosNuevas = subirFotosProducto(body.nombre, body.fotos);
  var fotosExistentes = Array.isArray(body.fotosExistentes) ? body.fotosExistentes : [];
  var todasLasFotos = fotosExistentes.concat(fotosNuevas);

  sheet.appendRow([
    sku, body.nombre, body.descripcion || '', body.categoria || '',
    body.precioCompra, body.precioVentaSinIva, calc.precioConIva,
    calc.margen.toFixed(2) + '%', 0, body.stockMinimo || 0, body.proveedor || '', 'SI', todasLasFotos.join('|')
  ]);

  if (Number(body.stockInicial) > 0) {
    addMovimientoStock({
      fecha: new Date(), tipo: 'entrada', sku: sku, nombreProducto: body.nombre,
      cantidad: Number(body.stockInicial), motivo: 'Carga inicial'
    });
  }

  return { sku: sku };
}

// Sube varias fotos de un producto a Drive y devuelve el array de URLs.
// body.fotos: [{ base64, mimeType, nombre }]. Si falla una foto puntual,
// sigue con las demás en vez de cortar todo el guardado del producto.
function subirFotosProducto(nombreProducto, fotos) {
  if (!Array.isArray(fotos)) return [];
  var urls = [];
  fotos.forEach(function(f) {
    try {
      urls.push(subirFotoProducto(nombreProducto, f.base64, f.mimeType, f.nombre));
    } catch (e) {
      // se omite esa foto puntual, no corta el resto
    }
  });
  return urls;
}

// Carga muchos productos de una — se usa desde "Importar stock" en el
// frontend (Excel/CSV). Cada fila puede traer stockInicial, que genera
// su movimiento de entrada en Inventario automáticamente.
function addProductosBulk(body) {  var sheet = getSheet('PRODUCTOS');
  var productos = Array.isArray(body.productos) ? body.productos : [];
  var creados = [];
  var errores = [];

  productos.forEach(function(p, i) {
    try {
      if (!p.nombre) throw new Error('Falta el nombre');
      var precioCompra = Number(p.precioCompra) || 0;
      var precioVentaSinIva = Number(p.precioVentaSinIva) || 0;
      var calc = calcularPrecioYMargen(precioCompra, precioVentaSinIva);
      var sku = 'SKU-' + String(sheet.getLastRow() + creados.length).padStart(4, '0');

      sheet.appendRow([
        sku, p.nombre, p.descripcion || '', p.categoria || '',
        precioCompra, precioVentaSinIva, calc.precioConIva,
        calc.margen.toFixed(2) + '%', 0, Number(p.stockMinimo) || 0, p.proveedor || '', 'SI'
      ]);

      if (Number(p.stockInicial) > 0) {
        addMovimientoStock({
          fecha: new Date(), tipo: 'entrada', sku: sku, nombreProducto: p.nombre,
          cantidad: Number(p.stockInicial), motivo: 'Importación masiva'
        });
      }

      creados.push(sku);
    } catch (e) {
      errores.push({ fila: i + 1, nombre: p.nombre || '(sin nombre)', error: e.message });
    }
  });

  return { creados: creados.length, errores: errores };
}

// Edita los datos del producto. El stock NO se guarda directo acá (es un
// valor calculado a partir de Inventario) — si body.nuevoStock viene
// definido, se genera un movimiento de ajuste por la diferencia, para
// que quede registrado en el historial de Inventario.
function updateProducto(body) {
  var sheet = getSheet('PRODUCTOS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.sku)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Producto no encontrado: ' + body.sku);

  var fila = rowIndex + 1;
  function setCol(nombreCol, valor) {
    var idx = headers.indexOf(nombreCol);
    if (idx > -1) sheet.getRange(fila, idx + 1).setValue(valor);
  }

  if (body.nombre !== undefined)      setCol('Nombre', body.nombre);
  if (body.descripcion !== undefined) setCol('Descripción', body.descripcion);
  if (body.categoria !== undefined)   setCol('Categoría', body.categoria);
  if (body.proveedor !== undefined)   setCol('Proveedor', body.proveedor);
  if (body.stockMinimo !== undefined) setCol('Stock Mínimo', Number(body.stockMinimo));
  if (body.activo !== undefined)      setCol('Activo', body.activo ? 'SI' : 'NO');

  if (body.fotosExistentes !== undefined || body.fotosNuevas !== undefined) {
    var nombreProd = body.nombre || String(data[rowIndex][headers.indexOf('Nombre')]);
    var existentes = Array.isArray(body.fotosExistentes) ? body.fotosExistentes : [];
    var nuevasUrls = subirFotosProducto(nombreProd, body.fotosNuevas || []);
    setCol('Foto URL', existentes.concat(nuevasUrls).join('|'));
  }

  if (body.precioCompra !== undefined && body.precioVentaSinIva !== undefined) {
    var calc = calcularPrecioYMargen(Number(body.precioCompra), Number(body.precioVentaSinIva));
    setCol('Precio Compra', Number(body.precioCompra));
    setCol('Precio Venta s/IVA', Number(body.precioVentaSinIva));
    setCol('Precio Venta c/IVA', calc.precioConIva);
    setCol('Margen %', calc.margen.toFixed(2) + '%');
  }

  if (body.nuevoStock !== undefined) {
    var nombreProducto = body.nombre || String(data[rowIndex][headers.indexOf('Nombre')]);
    var stockActual = (calcularStockPorSku()[body.sku]) || 0;
    var diferencia = Number(body.nuevoStock) - stockActual;
    if (diferencia !== 0) {
      addMovimientoStock({
        fecha: new Date(),
        tipo: diferencia > 0 ? 'entrada' : 'salida',
        sku: body.sku,
        nombreProducto: nombreProducto,
        cantidad: Math.abs(diferencia),
        motivo: 'Ajuste manual'
      });
    }
  }

  return { ok: true };
}
