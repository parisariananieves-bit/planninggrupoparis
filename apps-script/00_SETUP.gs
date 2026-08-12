// ============================================================
// SETUP DE BASE DE DATOS
// Ejecutar UNA SOLA VEZ la función crearBaseDeDatos() desde el
// editor de Apps Script (menú desplegable de funciones > Ejecutar).
// Crea todas las hojas con los encabezados correctos, en el orden
// exacto que espera el resto del backend. Si una hoja ya existe,
// no la toca (para no pisar datos reales).
// ============================================================

function crearBaseDeDatos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  crearHojaConfig(ss);
  crearHojaConEncabezados(ss, 'PRODUCTOS', 1, [
    'SKU', 'Nombre', 'Descripción', 'Categoría', 'Precio Compra',
    'Precio Venta s/IVA', 'Precio Venta c/IVA', 'Margen %',
    'Stock', 'Stock Mínimo', 'Proveedor', 'Activo', 'Foto URL'
  ]);
  crearHojaConEncabezados(ss, 'VENTAS', 1, [
    'ID', 'Fecha', 'Cliente', 'Subtotal', 'Descuento', 'IVA', 'Total',
    'Medio de Pago', 'Canal', '% Comisión', 'Comisión $', 'Ganancia Real',
    'Tipo Pago', 'Notas'
  ]);
  crearHojaCaja(ss);
  crearHojaConEncabezados(ss, 'INVENTARIO', 1, [
    'ID', 'Fecha', 'Tipo', 'SKU', 'Producto', 'Cantidad', 'Motivo',
    'Referencia', 'Stock Resultante'
  ]);
  crearHojaConEncabezados(ss, 'CLIENTES', 1, [
    'ID', 'Nombre', 'Email', 'Teléfono', 'Dirección', 'Fecha Alta',
    'Total Compras', 'Cantidad Compras', 'Última Compra', 'Saldo CC', 'Notas'
  ]);
  crearHojaCuotas(ss);
  crearHojaUsuarios(ss);
  crearHojaServicios(ss);
  crearHojaTurnos(ss);
  crearHojaPromociones(ss);
  crearHojaInsumos(ss);
  crearHojaPasivos(ss);

  SpreadsheetApp.flush();
  Browser.msgBox('Listo. Se crearon (o verificaron) las hojas del sistema. Usuario inicial: admin / admin1234 (cambiala apenas entres).');
}

function crearHojaConEncabezados(ss, nombre, filaEncabezado, encabezados) {
  var sheet = ss.getSheetByName(nombre);
  if (sheet) return sheet; // ya existe, no se toca

  sheet = ss.insertSheet(nombre);
  var rango = sheet.getRange(filaEncabezado, 1, 1, encabezados.length);
  rango.setValues([encabezados]);
  rango.setFontWeight('bold').setBackground('#eef2ff');
  sheet.setFrozenRows(filaEncabezado);
  sheet.autoResizeColumns(1, encabezados.length);
  return sheet;
}

function crearHojaConfig(ss) {
  var sheet = ss.getSheetByName('CONFIG');
  if (sheet) return sheet;

  sheet = ss.insertSheet('CONFIG');
  sheet.getRange('A1').setValue('CONFIGURACIÓN DEL NEGOCIO').setFontWeight('bold').setFontSize(14);

  sheet.getRange('A4').setValue('Nombre del negocio');
  sheet.getRange('B4').setValue('Oletha Beauty');

  sheet.getRange('A8').setValue('Email de notificaciones');
  sheet.getRange('B8').setValue('');

  sheet.getRange('A10').setValue('WhatsApp de contacto (con código de país, sin +/espacios)');
  sheet.getRange('B10').setNumberFormat('@').setValue('');

  sheet.getRange('A12').setValue('URL del logo');
  sheet.getRange('B12').setValue('');

  sheet.getRange('A17').setValue('IVA (%)');
  sheet.getRange('B17').setValue(0); // Oletha Beauty factura como monotributista: sin IVA discriminado

  sheet.getRange('A34').setValue('COMISIONES POR MEDIO DE PAGO (%)').setFontWeight('bold');
  var comisiones = [
    ['A36', 'Efectivo', 0],
    ['A37', 'Débito', 1.5],
    ['A38', 'Crédito 1 pago', 3],
    ['A39', 'Crédito 3 cuotas', 8],
    ['A40', 'Crédito 6 cuotas', 14],
    ['A41', 'Mercado Pago', 4.5],
    ['A42', 'Transferencia', 0],
    ['A43', 'Cuenta Corriente', 0],
  ];
  comisiones.forEach(function(c) {
    var fila = c[0].replace('A', '');
    sheet.getRange('A' + fila).setValue(c[1]);
    sheet.getRange('B' + fila).setValue(c[2]);
  });

  sheet.getRange('A46').setValue('COLORES DE MARCA').setFontWeight('bold');
  sheet.getRange('A48').setValue('Color primario (hex)');
  sheet.getRange('B48').setValue('#8CA896');
  sheet.getRange('A49').setValue('Color secundario (hex)');
  sheet.getRange('B49').setValue('#D9A28D');

  sheet.getRange('A51').setValue('TURNOS').setFontWeight('bold');
  sheet.getRange('A53').setValue('Hora de inicio (HH:MM)');
  sheet.getRange('B53').setNumberFormat('@').setValue('09:00');
  sheet.getRange('A54').setValue('Hora de fin (HH:MM)');
  sheet.getRange('B54').setNumberFormat('@').setValue('18:00');
  sheet.getRange('A55').setValue('Duración de cada turno (min)');
  sheet.getRange('B55').setValue(60);
  sheet.getRange('A56').setValue('¿Pedir ficha de salud? (SI/NO)');
  sheet.getRange('B56').setValue('SI');
  sheet.getRange('A58').setValue('Políticas de reserva (seña, cancelación, etc.)');
  sheet.getRange('B58').setValue('El turno se reserva con una seña, no reembolsable. Reprogramando con 24hs de anticipación se puede reutilizar.');

  sheet.getRange('A60').setValue('Gastos fijos mensuales ($)');
  sheet.getRange('B60').setValue(0);

  sheet.getRange('A62').setValue('Fechas bloqueadas (separadas por coma, AAAA-MM-DD)');
  sheet.getRange('B62').setValue('');

  sheet.getRange('A64').setValue('URL de la app (para los links de los mails)');
  sheet.getRange('B64').setValue('');

  sheet.getRange('A66').setValue('Mensaje del banner de la tienda');
  sheet.getRange('B66').setValue('✨ Coordinamos tu pedido directo por WhatsApp — respuesta rápida');

  sheet.getRange('A68').setValue('Canales de venta (separados por coma)');
  sheet.getRange('B68').setValue('Mostrador,Feria,Redes sociales');

  sheet.getRange('A70').setValue('Google Client ID (para elegir fotos desde Drive)');
  sheet.getRange('B70').setValue('');
  sheet.getRange('A71').setValue('Google API Key (para elegir fotos desde Drive)');
  sheet.getRange('B71').setValue('');

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 160);
  return sheet;
}

// Si ya tenías la hoja CONFIG creada de una versión anterior (sin horarios
// de turnos ni políticas), ejecutá esta función UNA VEZ para agregar esos
// campos con valores por defecto, sin tocar el resto de tu configuración.
function agregarHorariosAConfig() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG');
  if (!sheet) { Browser.msgBox('No encontré la hoja CONFIG.'); return; }

  if (!sheet.getRange('B53').getValue()) {
    sheet.getRange('A51').setValue('TURNOS').setFontWeight('bold');
    sheet.getRange('A53').setValue('Hora de inicio (HH:MM)');
    sheet.getRange('B53').setNumberFormat('@').setValue('09:00');
    sheet.getRange('A54').setValue('Hora de fin (HH:MM)');
    sheet.getRange('B54').setNumberFormat('@').setValue('18:00');
    sheet.getRange('A55').setValue('Duración de cada turno (min)');
    sheet.getRange('B55').setValue(60);
    sheet.getRange('A56').setValue('¿Pedir ficha de salud? (SI/NO)');
    sheet.getRange('B56').setValue('SI');
  }

  if (!sheet.getRange('B58').getValue()) {
    sheet.getRange('A58').setValue('Políticas de reserva (seña, cancelación, etc.)');
    sheet.getRange('B58').setValue('El turno se reserva con una seña, no reembolsable. Reprogramando con 24hs de anticipación se puede reutilizar.');
  }

  if (!sheet.getRange('B10').getValue()) {
    sheet.getRange('A10').setValue('WhatsApp de contacto (con código de país, sin +/espacios)');
  }

  if (!sheet.getRange('B60').getValue()) {
    sheet.getRange('A60').setValue('Gastos fijos mensuales ($)');
    sheet.getRange('B60').setValue(0);
  }

  if (!sheet.getRange('A62').getValue()) {
    sheet.getRange('A62').setValue('Fechas bloqueadas (separadas por coma, AAAA-MM-DD)');
  }

  if (!sheet.getRange('A64').getValue()) {
    sheet.getRange('A64').setValue('URL de la app (para los links de los mails)');
  }

  if (!sheet.getRange('A66').getValue()) {
    sheet.getRange('A66').setValue('Mensaje del banner de la tienda');
    sheet.getRange('B66').setValue('✨ Coordinamos tu pedido directo por WhatsApp — respuesta rápida');
  }

  if (!sheet.getRange('A68').getValue()) {
    sheet.getRange('A68').setValue('Canales de venta (separados por coma)');
    sheet.getRange('B68').setValue('Mostrador,Feria,Redes sociales');
  }

  if (!sheet.getRange('A70').getValue()) {
    sheet.getRange('A70').setValue('Google Client ID (para elegir fotos desde Drive)');
    sheet.getRange('A71').setValue('Google API Key (para elegir fotos desde Drive)');
  }

  Browser.msgBox('Listo. Revisá los horarios, el WhatsApp de contacto y la política de reserva en Configuración y ajustalos a gusto.');
}

// Si ya tenías PRODUCTOS creada de antes (sin Foto URL), ejecutá esta
// función UNA VEZ para agregar esa columna sin tocar tu catálogo.
function agregarFotoAServicios() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SERVICIOS');
  if (!sheet) { Browser.msgBox('No encontré la hoja SERVICIOS.'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  if (headers.indexOf('Foto URL') > -1) {
    Browser.msgBox('SERVICIOS ya tiene la columna Foto URL.');
    return;
  }

  var proximaCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, proximaCol).setValue('Foto URL').setFontWeight('bold').setBackground('#eef2ff');
  Browser.msgBox('Listo. Se agregó la columna Foto URL a SERVICIOS.');
}

function agregarFotoAProductos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PRODUCTOS');
  if (!sheet) { Browser.msgBox('No encontré la hoja PRODUCTOS.'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  if (headers.indexOf('Foto URL') > -1) {
    Browser.msgBox('PRODUCTOS ya tiene la columna Foto URL.');
    return;
  }

  var proximaCol = sheet.getLastColumn() + 1;
  var rango = sheet.getRange(1, proximaCol);
  rango.setValue('Foto URL').setFontWeight('bold').setBackground('#eef2ff');

  Browser.msgBox('Listo. Se agregó la columna Foto URL a PRODUCTOS.');
}

// Ejecutar UNA VEZ si los horarios dejaron de funcionar: fuerza que las
// celdas de horario y WhatsApp vuelvan a quedar como texto plano, por si
// Sheets las convirtió solas a Hora/Número.
function repararFormatoCeldas() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG');
  if (!sheet) { Browser.msgBox('No encontré la hoja CONFIG.'); return; }

  var celdas = ['B10', 'B53', 'B54'];
  celdas.forEach(function(direccion) {
    var celda = sheet.getRange(direccion);
    var valor = celda.getValue();
    var texto = valor instanceof Date
      ? Utilities.formatDate(valor, Session.getScriptTimeZone(), direccion === 'B10' ? 'yyyyMMddHHmmss' : 'HH:mm')
      : String(valor || '');
    celda.setNumberFormat('@').setValue(texto);
  });

  Browser.msgBox('Listo. B10 (WhatsApp), B53 y B54 (horarios) quedaron como texto. Revisá en Configuración que los horarios sigan siendo los correctos (si B10 se veía raro, volvé a escribir el WhatsApp a mano).');
}

function crearHojaCaja(ss) {
  var sheet = ss.getSheetByName('CAJA');
  if (sheet) return sheet;

  sheet = ss.insertSheet('CAJA');
  sheet.getRange('A1').setValue('MOVIMIENTOS DE CAJA').setFontWeight('bold').setFontSize(14);
  // La tabla de datos arranca en la fila 11 (fila 10 = encabezados),
  // dejando filas 1-9 libres para totales/resumen si se quieren agregar.
  var encabezados = [
    'ID', 'Fecha', 'Tipo', 'Concepto', 'Categoría', 'Monto',
    'Medio de Pago', 'Referencia', 'Foto URL', '', '', 'Saldo Acumulado'
  ];
  var rango = sheet.getRange(10, 1, 1, encabezados.length);
  rango.setValues([encabezados]);
  rango.setFontWeight('bold').setBackground('#eef2ff');
  sheet.setFrozenRows(10);
  return sheet;
}

function crearHojaCuotas(ss) {
  var sheet = ss.getSheetByName('CUOTAS');
  if (sheet) return sheet;

  sheet = ss.insertSheet('CUOTAS');
  sheet.getRange('A1').setValue('CUOTAS').setFontWeight('bold').setFontSize(14);
  // La tabla de datos arranca en la fila 5 (fila 4 = encabezados).
  var encabezados = [
    'ID', 'Venta ID', 'Cliente', 'Vencimiento', 'Monto Cuota',
    'N° Cuota', 'Total Cuotas', '', 'Monto Pagado', 'Fecha Pago',
    '', '', '', ''
  ];
  var rango = sheet.getRange(4, 1, 1, encabezados.length);
  rango.setValues([encabezados]);
  rango.setFontWeight('bold').setBackground('#eef2ff');
  sheet.setFrozenRows(4);
  return sheet;
}

function crearHojaUsuarios(ss) {
  var sheet = ss.getSheetByName('USUARIOS');
  if (sheet) return sheet;

  sheet = crearHojaConEncabezados(ss, 'USUARIOS', 1, [
    'ID', 'Nombre', 'Usuario', 'Email', 'PasswordHash', 'Salt',
    'Rol', 'Permisos', 'Activo', 'Token', 'TokenExpira', 'Fecha Alta'
  ]);

  // Usuario admin inicial con todos los permisos. Avisale a quien
  // vaya a usar el sistema que cambie la contraseña apenas entre
  // (Configuración > Usuarios).
  var salt = generarSalt();
  var hash = hashPassword('admin1234', salt);
  var todosLosPermisos = 'dashboard,ventas,productos,caja,inventario,clientes,cuotas,turnos,usuarios,configuracion';

  sheet.appendRow([
    generateId('USR'), 'Administradora', 'admin', '', hash, salt,
    'Dueña', todosLosPermisos, 'SI', '', '', new Date()
  ]);

  return sheet;
}

function crearHojaServicios(ss) {
  var sheet = ss.getSheetByName('SERVICIOS');
  if (sheet) return sheet;

  sheet = crearHojaConEncabezados(ss, 'SERVICIOS', 1, [
    'ID', 'Nombre', 'Descripción', 'Duración (min)', 'Precio', 'Activo',
    'Cuidados Antes', 'Cuidados Después', 'Cuidados Importante', 'Preguntas',
    'Costo Mano de Obra', 'Receta', 'Foto URL'
  ]);

  cargarServiciosOletha(sheet);

  return sheet;
}

// Carga (o actualiza si ya existen por nombre) los servicios reales de
// Oletha Beauty con precios, duraciones, cuidados post-servicio y el
// cuestionario previo al turno, en base a lo que pasó la clienta.
// Se puede ejecutar de nuevo sin duplicar: si el nombre ya existe, lo pisa.
function cargarServiciosOletha(sheetOpcional) {
  var sheet = sheetOpcional || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SERVICIOS');
  if (!sheet) { Browser.msgBox('No encontré la hoja SERVICIOS.'); return; }

  var cuidadosCejas = {
    antes: [
      'No mojar las cejas.',
      'No aplicar aceites ni cremas en la zona.',
      'Evitar vapor y agua (duchas calientes, cocina, transpiración).',
      'No dormir sobre tu rostro.',
      'No maquillar tus cejas.',
      'No frotar ni manipular los vellos.'
    ],
    despues: [
      'Aplicar serum nutritivo para mantener la hidratación del vello.',
      'Peinar las cejas diariamente en la dirección deseada.'
    ],
    importante: 'La duración es de 4 a 6 semanas según el crecimiento natural del vello y los cuidados posteriores. Se recomienda repetir el servicio luego de 9 semanas.'
  };

  var cuidadosPestanas = {
    antes: [
      'No mojar las pestañas.',
      'Evitar vapor y agua (duchas, piscinas, transpiración).',
      'No utilizar máscara de pestañas.',
      'No aplicar aceites ni cremas en la zona.',
      'No frotar los ojos, no dormir boca abajo.',
      'No usar arqueador de pestañas.'
    ],
    despues: [
      'Evitar productos oleosos sobre las pestañas, peinarlas suavemente con cepillito.',
      'Aplicar serum o productos nutritivos para pestañas, así se mantienen hidratadas.',
      'No usar máscara de pestañas a prueba de agua.'
    ],
    importante: 'La duración es de 6 a 8 semanas según el crecimiento natural de la pestaña y los cuidados posteriores. El efecto va disminuyendo a medida que las pestañas naturales se renuevan. Se recomienda repetir el servicio luego de 9 a 12 semanas.'
  };

  var preguntasCejas = [];
  var preguntasPestanas = [];

  var descripcionLifting = 'Técnica que eleva y proyecta las pestañas, creando una curvatura acorde al diseño de ojos y pestañas. Incluye lash botox (nutrición extra post-tratamiento). Efecto rimel opcional: tiñe y realza las pestañas.';
  var descripcionLaminado = 'Redirecciona los vellos hacia arriba. Da más grosor a las cejas, tapa huecos y define mejor la forma. Incluye diseño, perfilado, dosis de keratina y botox nutritivo.';

  var servicios = [
    ['Lifting tradicional', descripcionLifting, 90, 20000, cuidadosPestanas, preguntasPestanas],
    ['Lifting coreano', descripcionLifting + ' Técnica coreana, curvatura más marcada.', 90, 25000, cuidadosPestanas, preguntasPestanas],
    ['Laminado de cejas', descripcionLaminado + ' Incluye perfilado.', 60, 30000, cuidadosCejas, preguntasCejas],
    ['Perfilado de cejas', 'Diseño de la zona y depilado con pinza y perfilador.', 30, 15000, cuidadosCejas, preguntasCejas],
    ['Perfilado + tinte henna', 'Perfilado de cejas con aplicación de henna.', 45, 20000, cuidadosCejas, preguntasCejas],
    ['SPICY brows (laminado + henna)', descripcionLaminado + ' Incluye tinte henna.', 90, 27800, cuidadosCejas, preguntasCejas],
    ['Pecas con henna', 'Pecas realizadas con henna, duran hasta 6 días en la piel.', 25, 10000, { antes: [], despues: [], importante: '' }, []],
  ];

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var nombreExistente = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) nombreExistente[String(data[i][1])] = i + 1; // fila real
  }

  servicios.forEach(function(s) {
    var nombre = s[0], descripcion = s[1], duracion = s[2], precio = s[3], cuidados = s[4], preguntas = s[5];
    var fila = nombreExistente[nombre];
    var valores = [descripcion, duracion, precio, 'SI', cuidados.antes.join('\n'), cuidados.despues.join('\n'), cuidados.importante, preguntas.join('\n')];

    if (fila) {
      sheet.getRange(fila, 3, 1, valores.length).setValues([valores]);
    } else {
      sheet.appendRow([generateId('SRV'), nombre].concat(valores));
    }
  });

  if (!sheetOpcional) Browser.msgBox('Listo. Se cargaron/actualizaron los 7 servicios de Oletha Beauty con precios, cuidados y cuestionario.');
}

// Si ya tenías SERVICIOS creada de una versión anterior (sin descripción,
// cuidados ni preguntas), ejecutá esta función UNA VEZ para sumar esas
// columnas sin perder los servicios que ya tengas cargados.
function agregarCamposAvanzadosAServicios() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SERVICIOS');
  if (!sheet) { Browser.msgBox('No encontré la hoja SERVICIOS.'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });

  // Reordenar no es seguro por Apps Script; en cambio, si falta 'Descripción'
  // insertamos las columnas en las posiciones correctas.
  if (headers.indexOf('Descripción') === -1) {
    sheet.insertColumnAfter(2);
    sheet.getRange(1, 3).setValue('Descripción').setFontWeight('bold').setBackground('#eef2ff');
  }

  headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });
  var columnasFinales = ['Cuidados Antes', 'Cuidados Después', 'Cuidados Importante', 'Preguntas', 'Costo Mano de Obra', 'Receta'];
  var faltantes = columnasFinales.filter(function(c) { return headers.indexOf(c) === -1; });

  if (faltantes.length > 0) {
    var proximaCol = sheet.getLastColumn() + 1;
    var rango = sheet.getRange(1, proximaCol, 1, faltantes.length);
    rango.setValues([faltantes]);
    rango.setFontWeight('bold').setBackground('#eef2ff');
  }

  Browser.msgBox('Listo. SERVICIOS ya tiene las columnas de descripción, cuidados y preguntas. Ahora podés correr cargarServiciosOletha() para cargar los datos reales.');
}

function crearHojaTurnos(ss) {
  var sheet = ss.getSheetByName('TURNOS');
  if (sheet) return sheet;

  crearHojaConEncabezados(ss, 'TURNOS', 1, [
    'ID', 'Fecha', 'Hora', 'Cliente', 'Teléfono', 'Email',
    'Servicio', 'Profesional', 'Estado', 'Notas', 'Fecha Creación',
    'Alergias', 'Condiciones', 'Consentimiento', 'Respuestas', 'Foto URL', 'Cobrado', 'Duración (min)',
    'Nota Encuesta', 'Comentario Encuesta'
  ]);
  return sheet;
}

function crearHojaPromociones(ss) {
  var sheet = ss.getSheetByName('PROMOCIONES');
  if (sheet) return sheet;

  crearHojaConEncabezados(ss, 'PROMOCIONES', 1, [
    'ID', 'Nombre', 'Tipo', 'Aplica a', 'Valor', 'Activo'
  ]);
  return sheet;
}

function crearHojaInsumos(ss) {
  var sheet = ss.getSheetByName('INSUMOS');
  if (sheet) return sheet;

  sheet = crearHojaConEncabezados(ss, 'INSUMOS', 1, [
    'ID', 'Nombre', 'Precio Costo', 'Stock', 'Stock Mínimo', 'Unidad', 'Activo'
  ]);

  // Ejemplos típicos de un estudio de pestañas/cejas, para que no arranque vacío.
  var ejemplos = [
    ['Tinta / henna (frasco)', 3000, 10, 2, 'frasco'],
    ['Pincel descartable', 50, 100, 20, 'unidad'],
    ['Guantes (par)', 100, 50, 10, 'par'],
    ['Algodón (paquete)', 800, 5, 1, 'paquete'],
  ];
  ejemplos.forEach(function(e) {
    sheet.appendRow([generateId('INS'), e[0], e[1], e[2], e[3], e[4], 'SI']);
  });

  return sheet;
}

function crearHojaPasivos(ss) {
  var sheet = ss.getSheetByName('PASIVOS');
  if (sheet) return sheet;

  return crearHojaConEncabezados(ss, 'PASIVOS', 1, [
    'ID', 'Nombre', 'Monto', 'Categoría', 'Activo'
  ]);
}

// Si ya tenías la hoja TURNOS creada de una versión anterior (sin ficha de
// salud), ejecutá esta función UNA VEZ para agregarle las columnas nuevas
// sin tocar los turnos que ya tengas cargados.
function agregarFichaSaludATurnos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TURNOS');
  if (!sheet) { Browser.msgBox('No encontré la hoja TURNOS.'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });

  var columnasNuevas = ['Alergias', 'Condiciones', 'Consentimiento', 'Respuestas', 'Foto URL', 'Cobrado', 'Duración (min)', 'Nota Encuesta', 'Comentario Encuesta'];
  var faltantes = columnasNuevas.filter(function(c) { return headers.indexOf(c) === -1; });

  if (faltantes.length === 0) {
    Browser.msgBox('TURNOS ya tiene todas las columnas de ficha de salud y cuestionario.');
    return;
  }

  var proximaCol = sheet.getLastColumn() + 1;
  var rango = sheet.getRange(1, proximaCol, 1, faltantes.length);
  rango.setValues([faltantes]);
  rango.setFontWeight('bold').setBackground('#eef2ff');

  Browser.msgBox('Listo. Se agregaron: ' + faltantes.join(', '));
}

// Ejecutar UNA VEZ: agrega el título "Foto URL" a la columna 9 de CAJA,
// que ya existía en blanco (reservada) desde el inicio.
function agregarFotoAGastos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CAJA');
  if (!sheet) { Browser.msgBox('No encontré la hoja CAJA.'); return; }
  sheet.getRange(10, 9).setValue('Foto URL').setFontWeight('bold').setBackground('#eef2ff');
  Browser.msgBox('Listo. La columna 9 de CAJA ahora es "Foto URL".');
}

// Ejecutar UNA VEZ si querés borrar las preguntas de ejemplo que vinieron
// precargadas con los servicios (Laminado de cejas, Lifting, etc.) y
// armar las tuyas desde cero en Turnos > Servicios > Editar.
function limpiarPreguntasPorDefecto() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SERVICIOS');
  if (!sheet) { Browser.msgBox('No encontré la hoja SERVICIOS.'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  var colPreguntas = headers.indexOf('Preguntas');
  if (colPreguntas === -1) { Browser.msgBox('No encontré la columna Preguntas.'); return; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { Browser.msgBox('No hay servicios cargados todavía.'); return; }

  sheet.getRange(2, colPreguntas + 1, lastRow - 1, 1).clearContent();
  Browser.msgBox('Listo. Se vaciaron las preguntas de todos los servicios. Cargá las tuyas desde Turnos > Servicios > Editar.');
}
