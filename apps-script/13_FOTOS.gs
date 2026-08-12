// ============================================================
// FOTOS DE TURNOS (Google Drive)
// Organiza las fotos en: "Oletha Beauty - Fotos de turnos" / <Nombre de la clienta> / archivo.jpg
// No requiere ninguna configuración: DriveApp usa el mismo Google
// Drive de la cuenta donde está publicado el Web App.
// ============================================================

var CARPETA_RAIZ_FOTOS = 'Oletha Beauty - Fotos de turnos';
var CARPETA_RAIZ_FOTOS_PRODUCTOS = 'Oletha Beauty - Fotos de productos';

function getCarpetaRaiz(nombreCarpetaRaiz) {
  var carpetas = DriveApp.getFoldersByName(nombreCarpetaRaiz);
  if (carpetas.hasNext()) return carpetas.next();
  return DriveApp.createFolder(nombreCarpetaRaiz);
}

function getCarpetaRaizFotos() {
  return getCarpetaRaiz(CARPETA_RAIZ_FOTOS);
}

function getSubcarpeta(raiz, nombre) {
  var nombreCarpeta = (nombre || 'Sin nombre').trim();
  var carpetas = raiz.getFoldersByName(nombreCarpeta);
  if (carpetas.hasNext()) return carpetas.next();
  return raiz.createFolder(nombreCarpeta);
}

function getCarpetaCliente(nombreCliente) {
  return getSubcarpeta(getCarpetaRaizFotos(), nombreCliente);
}

function subirArchivoADrive(carpeta, base64, mimeType, nombreArchivo) {
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', nombreArchivo || 'foto.jpg');
  var archivo = carpeta.createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // archivo.getUrl() da el link de "ver archivo" (una página de Drive),
  // que NO sirve como src de una etiqueta <img>. El endpoint de
  // miniaturas de Drive es el que anda de forma confiable embebido.
  return urlMiniaturaDrive(archivo.getId());
}

function urlMiniaturaDrive(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
}

// Extrae el ID de archivo de Drive de cualquier formato de link viejo
// (el de "ver archivo", o el de lh3.googleusercontent.com que probamos
// antes y resultó poco confiable para archivos que no son de Google Photos).
function extraerIdDeDrive(url) {
  var match = String(url).match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  match = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Ejecutar UNA VEZ (o de nuevo, no rompe nada repetirla): convierte las
// fotos guardadas en TURNOS y PRODUCTOS a la URL de miniatura de Drive.
// No vuelve a subir nada, solo corrige el link guardado en la planilla.
function repararFotosDrive() {
  var reparadas = 0;

  ['TURNOS', 'PRODUCTOS'].forEach(function(nombreHoja) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
    if (!sheet) return;

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
      return String(h).trim();
    });
    var colFoto = headers.indexOf('Foto URL');
    if (colFoto === -1) return;

    var data = sheet.getRange(2, colFoto + 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
    data.forEach(function(fila, i) {
      var url = fila[0];
      if (!url) return;

      var id = extraerIdDeDrive(url);
      var urlCorrecta = id ? urlMiniaturaDrive(id) : null;
      if (urlCorrecta && urlCorrecta !== url) {
        sheet.getRange(i + 2, colFoto + 1).setValue(urlCorrecta);
        reparadas++;
      }
    });
  });

  Browser.msgBox('Listo. Se repararon ' + reparadas + ' foto(s) en TURNOS y PRODUCTOS.');
}

// body: { nombreCliente, fotoBase64 (sin el prefijo data:...;base64,), mimeType, nombreArchivo }
// Devuelve la URL de visualización del archivo guardado.
function subirFotoTurno(nombreCliente, fotoBase64, mimeType, nombreArchivo) {
  return subirArchivoADrive(getCarpetaCliente(nombreCliente), fotoBase64, mimeType, nombreArchivo);
}

// Organiza en: "Oletha Beauty - Fotos de productos" / <Nombre del producto> / archivo.jpg
function subirFotoProducto(nombreProducto, fotoBase64, mimeType, nombreArchivo) {
  var raiz = getCarpetaRaiz(CARPETA_RAIZ_FOTOS_PRODUCTOS);
  var carpeta = getSubcarpeta(raiz, nombreProducto);
  return subirArchivoADrive(carpeta, fotoBase64, mimeType, nombreArchivo);
}

// Organiza en: "Oletha Beauty - Comprobantes de gastos" / archivo.jpg
// (todos juntos en una sola carpeta, no hace falta subcarpeta por gasto).
var CARPETA_RAIZ_COMPROBANTES = 'Oletha Beauty - Comprobantes de gastos';

// Se llama desde el selector de Google Drive del frontend: la clienta
// (o vos) elige un archivo que YA tiene en su Drive, y esta función lo
// comparte públicamente y devuelve el mismo formato de URL que usamos
// para las fotos subidas directo — así se puede mostrar en un <img>.
function compartirArchivoDrive(body) {
  var archivo = DriveApp.getFileById(body.fileId);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: urlMiniaturaDrive(body.fileId) };
}

function subirFotoGasto(concepto, fotoBase64, mimeType, nombreArchivo) {
  var carpeta = getCarpetaRaiz(CARPETA_RAIZ_COMPROBANTES);
  return subirArchivoADrive(carpeta, fotoBase64, mimeType, nombreArchivo);
}

// El logo del negocio: una sola carpeta, un solo archivo relevante por vez.
var CARPETA_RAIZ_LOGO = 'Oletha Beauty - Logo';

function subirLogoNegocio(fotoBase64, mimeType, nombreArchivo) {
  var carpeta = getCarpetaRaiz(CARPETA_RAIZ_LOGO);
  return subirArchivoADrive(carpeta, fotoBase64, mimeType, nombreArchivo);
}

// Organiza en: "Oletha Beauty - Fotos de servicios" / <Nombre del servicio> / archivo.jpg
var CARPETA_RAIZ_SERVICIOS = 'Oletha Beauty - Fotos de servicios';

function subirFotoServicio(nombreServicio, fotoBase64, mimeType, nombreArchivo) {
  var raiz = getCarpetaRaiz(CARPETA_RAIZ_SERVICIOS);
  var carpeta = getSubcarpeta(raiz, nombreServicio);
  return subirArchivoADrive(carpeta, fotoBase64, mimeType, nombreArchivo);
}
