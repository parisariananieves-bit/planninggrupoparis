// ============================================================
// ROUTER PRINCIPAL
// Publicar como: Implementar > Web App
//   - Ejecutar como: Yo
//   - Acceso: Cualquier persona
// ============================================================

var API_KEY = 'cambia_esta_clave_por_una_segura'; // igual a VITE_API_KEY en .env.local

// Se actualiza cada vez que hay un cambio de backend importante. Sirve
// para chequear rápido si lo que está publicado es la última versión:
// entrá a TU_URL/exec?apiKey=TU_KEY&action=version en el navegador.
var BACKEND_VERSION = '2026-08-11-diagnostico';

// Para ver de un solo vistazo (?action=version) qué falta configurar,
// sin tener que ir a buscar cada campo en la planilla por separado.
// Incluye si armarHtmlBotonesNota existe (confirma que este archivo
// 12_NOTIFICACIONES.gs es la versión nueva).
function getDiagnostico() {
  var config = {};
  try { config = getConfig(); } catch (e) {}

  var serviciosSinCuidados = [];
  try {
    getServicios({}).forEach(function(s) {
      if (s.activo && s.cuidados.antes.length === 0 && s.cuidados.despues.length === 0) {
        serviciosSinCuidados.push(s.nombre);
      }
    });
  } catch (e) {}

  return {
    tieneUrlDeLaApp: !!(config.sitioUrl && config.sitioUrl.length > 0),
    valorUrlDeLaApp: config.sitioUrl || '(vacío)',
    tieneWhatsapp: !!(config.whatsappContacto && config.whatsappContacto.length > 0),
    tieneLogo: !!(config.logoUrl && config.logoUrl.length > 0),
    funcionBotonesNPSExiste: typeof armarHtmlBotonesNota === 'function',
    serviciosActivosSinCuidadosCargados: serviciosSinCuidados,
  };
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = e.parameter || {};

    if (params.apiKey !== API_KEY) {
      return jsonResponse({ ok: false, error: 'No autorizado' });
    }

    var action = params.action;
    if (!action) {
      return jsonResponse({ ok: false, error: 'Falta parámetro action' });
    }

    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var result;
    switch (action) {
      case 'version':        result = { version: BACKEND_VERSION, diagnostico: getDiagnostico() };  break;
      case 'getConfig':     result = getConfig();              break;
      case 'updateConfig':  result = updateConfig(body);       break;
      case 'getKPIs':       result = getKPIs();                break;
      case 'getReporteFinanciero': result = getReporteFinanciero(params); break;
      case 'getReportePeriodo': result = getReportePeriodo(params); break;
      case 'registrarArqueo':      result = registrarArqueo(body);        break;
      case 'getProductos':  result = getProductos(params);     break;
      case 'addProducto':   result = addProducto(body);        break;
      case 'updateProducto': result = updateProducto(body);    break;
      case 'addProductosBulk': result = addProductosBulk(body); break;
      case 'getVentas':     result = getVentas(params);        break;
      case 'addVenta':      result = addVenta(body);           break;
      case 'getCaja':       result = getCaja(params);          break;
      case 'addMovCaja':    result = addMovimientoCaja(body);  break;
      case 'getInventario': result = getInventario(params);    break;
      case 'addMovStock':   result = addMovimientoStock(body); break;
      case 'getClientes':   result = getClientes(params);      break;
      case 'addCliente':    result = addCliente(body);         break;
      case 'updateCliente': result = updateCliente(body);      break;
      case 'getCuotas':     result = getCuotas(params);        break;
      case 'pagarCuota':    result = pagarCuota(body);         break;
      case 'login':          result = login(body);              break;
      case 'getUsuarios':    result = getUsuarios();             break;
      case 'addUsuario':     result = addUsuario(body);          break;
      case 'updateUsuario':  result = updateUsuario(body);       break;
      case 'getServicios':   result = getServicios(params);      break;
      case 'addServicio':    result = addServicio(body);         break;
      case 'updateServicio': result = updateServicio(body);      break;
      case 'getTurnos':      result = getTurnos(params);         break;
      case 'addTurno':       result = addTurno(body);            break;
      case 'updateTurno':    result = updateTurno(body);         break;
      case 'deleteTurno':    result = deleteTurno(body);         break;
      case 'registrarEncuesta': result = registrarEncuesta(body); break;
      case 'getPromociones':  result = getPromociones(params);   break;
      case 'addPromocion':    result = addPromocion(body);       break;
      case 'updatePromocion': result = updatePromocion(body);    break;
      case 'getInsumos':      result = getInsumos(params);       break;
      case 'addInsumo':       result = addInsumo(body);          break;
      case 'updateInsumo':    result = updateInsumo(body);       break;
      case 'addInsumosBulk':  result = addInsumosBulk(body);     break;
      case 'getPasivos':      result = getPasivos(params);       break;
      case 'addPasivo':       result = addPasivo(body);          break;
      case 'updatePasivo':    result = updatePasivo(body);       break;
      case 'getBalanceGeneral': result = getBalanceGeneral();    break;
      case 'compartirArchivoDrive': result = compartirArchivoDrive(body); break;
      case 'getEstadisticasNPS': result = getEstadisticasNPS(); break;
      default:
        return jsonResponse({ ok: false, error: 'Acción desconocida: ' + action });
    }

    return jsonResponse({ ok: true, data: result });

  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name);
  return sheet;
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });
  return obj;
}

function generateId(prefix) {
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  var rand = Math.floor(Math.random() * 9000) + 1000;
  return prefix + '-' + date + '-' + rand;
}

function minutosDesdeHHMM(hhmm) {
  var partes = String(hhmm).split(':');
  return Number(partes[0]) * 60 + Number(partes[1]);
}
