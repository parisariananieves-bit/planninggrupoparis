// ============================================================
// API del Planning de Entregas — Grupo París
// Este script NO muestra la página web (eso vive en Netlify).
// Solo responde datos (JSON) para que la web pública los pida.
// ============================================================

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var result;
  try {
    if (action === 'entregas') result = getEntregas();
    else if (action === 'config') result = getConfig();
    else if (action === 'plantillas') result = getPlantillas();
    else if (action === 'previsualizarPlantilla') result = previsualizarPlantilla(e.parameter.tipo, e.parameter.marca, e.parameter.id);
    else if (action === 'comunicaciones') result = listarComunicaciones_();
    else if (action === 'seguimientoGestionCasos') result = obtenerSeguimientoGestionCasos_(e.parameter);
    else if (action === 'catalogoAccesorios') result = {ok:true, catalogo: listarCatalogoAccesorios_()};
    else if (action === 'reporteAccesorios') result = reporteAccesorios_();
    else if (action === 'unidadesPreparacion') result = {ok:true, unidades: listarUnidadesPreparacion_()};
    else if (action === 'checklistPreparacionConfig') result = {ok:true, config: listarChecklistPreparacionConfig_()};
    else if (action === 'prepDashboardSupervisor') result = prepDashboardSupervisor_();
    else if (action === 'prepDashboardResponsable') result = prepDashboardResponsable_(e.parameter.nombre);
    else if (action === 'notificaciones') result = {ok:true, notificaciones: listarNotificaciones_(e.parameter.actorUsuario, e.parameter.actorRol)};
    else if (action === 'casos') result = listarCasos_();
   
    else if (action === 'encuestaPosterior') result = obtenerEncuestaPosterior_(e.parameter.vin, e.parameter.patente);
    else if (action === 'auditoriaEntrega') result = obtenerAuditoriaEntrega_(e.parameter.vin);
    else if (action === 'auditoriaFoto') result = obtenerFotoAuditoria_(e.parameter.vin, e.parameter.id);
    else if (action === 'todosLosCasosGC') result = listarTodosLosCasosGC_();
    else if (action === 'npsFabricaAnonimas') result = {ok:true, respuestas: listarNpsFabricaAnonimas_()};
    else if (action === 'npsAnonimas') result = {ok:true, respuestas: listarNpsAnonimas_(e.parameter.tipo)};
    else if (action === 'archivosNpsImportados') result = {ok:true, archivos: listarArchivosNpsImportados_()};
     else result = { ok: true, mensaje: "API Planning de Entregas funcionando" };
  } catch (err) {
    result = { error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  var body = {};
  try{ body = JSON.parse(e.postData.contents); }catch(err){}
  var action = body.action;
  var p = body.params || {};
  var result;
  try{
    if(action==='addEntrega') result = {id: addEntrega(p.marca, p.obj)};
    else if(action==='updateEntregaFields') result = {ok: updateEntregaFields(p.marca, p.id, p.fields)};
    else if(action==='deleteEntrega') result = {ok: deleteEntrega(p.marca, p.id)};
    else if(action==='agregarComentario') result = {ok: agregarComentario(p.marca, p.id, p.autor, p.texto)};
    else if(action==='agregarHistorial') result = {ok: agregarHistorial(p.marca, p.id, p.texto)};
    else if(action==='enviarConfirmacion') result = enviarConfirmacion(p.marca, p.id, p.usuario);
    else if(action==='enviarRecordatorio') result = enviarRecordatorio(p.marca, p.id, p.usuario);
    else if(action==='guardarPlantilla') result = {ok: guardarPlantilla(p.marca, p.tipo, p.asunto, p.cuerpo)};
    else if(action==='guardarConfig') result = {ok: guardarConfig(p.config)};
    else if(action==='login') result = login_(p.usuario, p.password);
    else if(action==='loginYCargarTodo') result = loginYCargarTodo_(p.usuario, p.password);
    else if(action==='olvidePassword') result = olvidePassword_(p.usuario);
    else if(action==='establecerPasswordConToken') result = establecerPasswordConToken_(p.usuario, p.token, p.passwordNueva);
    else if(action==='cambiarPassword') result = cambiarPassword_(p.usuario, p.passwordActual, p.passwordNueva);
    else if(action==='listarUsuarios') result = listarUsuarios_(p.actorUsuario, p.actorPassword);
    else if(action==='registrarActividad') result = registrarActividad_(p.usuario, p.password);
    else if(action==='crearUsuario') result = crearUsuario_(p.actorUsuario, p.actorPassword, p.nombre, p.usuario, p.password, p.rol, p.email, p.modulos, p.sector, p.modulosSoloVer);
    else if(action==='editarUsuario') result = editarUsuario_(p.actorUsuario, p.actorPassword, p.usuarioObjetivo, p.nombre, p.email, p.rol, p.modulos, p.sector, p.modulosSoloVer);
    else if(action==='toggleSoloVerModulo') result = toggleSoloVerModulo_(p.actorUsuario, p.actorPassword, p.usuarioObjetivo, p.modulo, p.soloVer);
    else if(action==='resetPassword') result = resetPassword_(p.actorUsuario, p.actorPassword, p.usuarioObjetivo, p.passwordNueva);
    else if(action==='desactivarUsuario') result = desactivarUsuario_(p.actorUsuario, p.actorPassword, p.usuarioObjetivo, p.activo);
    else if(action==='eliminarUsuario') result = eliminarUsuario_(p.actorUsuario, p.actorPassword, p.usuarioObjetivo);
    else if(action==='reenviarCredenciales') result = reenviarCredenciales_(p.actorUsuario, p.actorPassword, p.usuarioObjetivo);
    else if(action==='reenviarComunicacion') result = reenviarComunicacion(p.marca, p.entregaId, p.canal);
    else if(action==='cancelarComunicacion') result = cancelarComunicacion(p.marca, p.entregaId, p.canal);
    else if(action==='registrarComunicacionManual') result = registrarComunicacionManual_(p);
    else if(action==='reportarCaso') result = reportarCaso_(p);
    else if(action==='sincronizarCasoGC') result = sincronizarCasoGestionDeCasos_(p, p.codigo);
    else if(action==='eliminarCaso') result = eliminarCaso_(p.codigo);
    else if(action==='agregarComentarioCaso') result = agregarComentarioCaso_(p.codigo, p.autor, p.texto);
    else if(action==='marcarNotificacionLeida') result = marcarNotificacionLeida_(p.id);
    else if(action==='marcarTodasNotificacionesLeidas') result = marcarTodasNotificacionesLeidas_(p.actorUsuario, p.actorRol);
    else if(action==='enviarComunicado') result = enviarComunicado_(p.actorUsuario, p.actorPassword, p.mensaje, p.destinatarioRol);
    else if(action==='notificarEntregaAgendada') result = notificarEntregaAgendadaAPI_(p.marca, p.id, p.autor);
    else if(action==='notificarItemMarcado') result = notificarItemMarcadoAPI_(p.marca, p.id, p.itemLabel, p.estado, p.motivo, p.autor);
    else if(action==='notificarEntregaCompletada') result = notificarEntregaCompletadaAPI_(p.marca, p.id, p.autor, p.extra);
    else if(action==='notificarComentarioEntrega') result = notificarComentarioEntregaAPI_(p.marca, p.id, p.autor, p.texto);
    else if(action==='revisarActualizacionesCasos') result = revisarActualizacionesCasos_();
else if(action==='agregarItemCatalogoAccesorios') result = agregarItemCatalogoAccesorios_(p.nombre, p.precio, p.marca, p.modelo, p.pn, p.manoDeObra, p.precioContadoFinal, p.precioTarjeta, p.precioEn3Cuotas);
else if(action==='agregarNpsFabricaAnonimo') result = agregarNpsFabricaAnonimo_(p.canal, p.puntaje, p.comentario, p.autor);
else if(action==='agregarNpsAnonimo') result = agregarNpsAnonimo_(p.tipo, p.canal, p.puntaje, p.comentario, p.autor);
else if(action==='agregarPuntoManualArchivo') result = agregarPuntoManualArchivo_(p.instancia, p.canal, p.punto, p.autor);
else if(action==='eliminarPuntoManualArchivo') result = eliminarPuntoManualArchivo_(p.instancia, p.canal, p.vin, p.indice);
else if(action==='eliminarNpsAnonimo') result = eliminarNpsAnonimo_(p.tipo, p.fila);
else if(action==='guardarArchivoNpsImportado') result = guardarArchivoNpsImportado_(p.instancia, p.canal, p.nombreArchivo, p.fechaCorte, p.puntosJson, p.autor);
else if(action==='actualizarFechaCorteArchivo') result = actualizarFechaCorteArchivo_(p.instancia, p.canal, p.nuevaFecha);
else if(action==='eliminarItemCatalogoAccesorios') result = eliminarItemCatalogoAccesorios_(p.nombre, p.marca, p.modelo);
    else if(action==='importarCatalogoAccesorios') result = importarCatalogoAccesorios_(p.filas);
    else if(action==='crearUnidadPreparacion') result = crearUnidadPreparacion_(p, p.autor);
    else if(action==='importarUnidadesPreparacion') result = importarUnidadesPreparacion_(p.filas, p.autor);
    else if(action==='prepAsignarResponsable') result = prepAsignarResponsable_(p.id, p.responsable, p.autor);
    else if(action==='prepMarcarTraslado') result = prepMarcarTraslado_(p.id, p.datos, p.autor);
    else if(action==='prepCambiarEstado') result = prepCambiarEstado_(p.id, p.estado, p.autor);
    else if(action==='prepCambiarPrioridad') result = prepCambiarPrioridad_(p.id, p.prioridad, p.autor);
    else if(action==='prepMarcarChecklistItem') result = prepMarcarChecklistItem_(p.id, p.item, p.hecho, p.observaciones, p.autor);
    else if(action==='prepSincronizarChecklist') result = prepSincronizarChecklist_(p.id, p.checklist, p.autor);
    else if(action==='prepEliminarUnidad') result = prepEliminarUnidad_(p.id);
    else if(action==='agregarItemChecklistPreparacionConfig') result = agregarItemChecklistPreparacionConfig_(p.nombre);
    else if(action==='eliminarItemChecklistPreparacionConfig') result = eliminarItemChecklistPreparacionConfig_(p.nombre);
    else if(action==='prepVincularEntrega') result = prepVincularEntrega_(p.id, p.entregaId, p.fecha, p.autor);
    else result = {error:'acción desconocida: '+action};
  }catch(err){
    result = {error:String(err)};
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getSS_(){
  return SpreadsheetApp.getActiveSpreadsheet();
}

var HOJAS = {chevrolet:'Chevrolet', peugeot:'Peugeot', citroen:'Citroën', honda:'Honda', dfsk:'DFSK - Jetour', usados:'Usados'};

// ============================================================
// Conexión de solo lectura con Gestión de Casos (planilla aparte).
// Planning NO escribe nada ahí — solo lee, para mostrar acá el seguimiento
// básico de un caso sin tener que entrar a la otra web. La creación
// automática de casos desde Planning (Etapa 2) es un paso aparte, todavía
// no está activada.
// ============================================================
var ID_GESTION_CASOS = '1IaxmPux37s9sd_8CzXLWJZimf-eljS7KYtxJBFH4-X8';
// URL /exec del backend de Gestión de Casos — a esta se le manda el evento
// (POST, action:'recibirEvento') cada vez que se reporta un caso en Planning.
// Por ahora CREAR_CASOS_AUTOMATICO está apagado del otro lado a propósito:
// el evento queda esperando en la Bandeja de entrada de Gestión de Casos
// para que alguien lo confirme a mano antes de convertirse en caso real.
var URL_GESTION_CASOS_EXEC = 'https://script.google.com/macros/s/AKfycbyt8McTbzl5azN_mRWqvK1DgLOxEpfP_isaFrp8BRTY8qPdI7O3EjvYDvYqs4uwydMI/exec';

function formatFechaGC_(v){
  if(v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  return v || '';
}

function obtenerSeguimientoGestionCasos_(params){
  try{
    var ss = SpreadsheetApp.openById(ID_GESTION_CASOS);
    var hojaCasos = ss.getSheetByName('Casos');
    if(!hojaCasos) return {ok:false, error:'No se encontró la hoja "Casos" en la planilla de Gestión de Casos.'};
    var datos = hojaCasos.getDataRange().getValues();
    if(datos.length<2) return {ok:true, casos:[]};
    // Índices por posición fija — mismo orden que COLUMNAS_CASOS en Gestión de Casos (Config.gs).
    var idx = {
      id:0, fechaCreacion:1, estado:2, prioridad:3, cliente:4, dni:5, telefono:6, email:7,
      marca:8, modelo:9, dominio:10, sucursal:11, sector:12, unidad:13, tipoCaso:14, motivo:15,
      descripcion:16, responsable:17, fuente:18, origenId:19, proximaAccion:20,
      fechaUltimaActualizacion:21, slaVencimiento:22
    };
    var dominioQ = String(params.dominio||'').trim().toUpperCase();
    var clienteQ = String(params.cliente||'').trim().toUpperCase();
    var dniQ = String(params.dni||'').trim();
    var codigoOrigenQ = String(params.origenId||'').trim();
    if(!dominioQ && !clienteQ && !dniQ && !codigoOrigenQ) return {ok:true, casos:[]};

    var encontrados = [];
    for(var i=1;i<datos.length;i++){
      var fila = datos[i];
      if(!fila[idx.id]) continue;
      var filaDominio = String(fila[idx.dominio]||'').trim().toUpperCase();
      var filaCliente = String(fila[idx.cliente]||'').trim().toUpperCase();
      var filaDni = String(fila[idx.dni]||'').trim();
      var filaOrigenId = String(fila[idx.origenId]||'').trim();
      var coincide = (codigoOrigenQ && filaOrigenId===codigoOrigenQ) ||
                     (dominioQ && filaDominio===dominioQ) ||
                     (dniQ && filaDni===dniQ) ||
                     (clienteQ && filaCliente===clienteQ);
      if(!coincide) continue;
      encontrados.push({
        id: fila[idx.id], fechaCreacion: formatFechaGC_(fila[idx.fechaCreacion]), estado: fila[idx.estado],
        prioridad: fila[idx.prioridad], responsable: fila[idx.responsable]||'Sin asignar',
        motivo: fila[idx.motivo], proximaAccion: fila[idx.proximaAccion],
        fechaUltimaActualizacion: formatFechaGC_(fila[idx.fechaUltimaActualizacion])
      });
    }
    if(encontrados.length){
      var hojaSeg = ss.getSheetByName('Seguimientos');
      if(hojaSeg){
        var datosSeg = hojaSeg.getDataRange().getValues();
        encontrados.forEach(function(c){
          var propios = datosSeg.filter(function(r){ return String(r[1])===String(c.id); });
          if(propios.length){
            var u = propios[propios.length-1];
            c.ultimaNovedad = {fecha: formatFechaGC_(u[2]), autor: u[3], texto: u[5]};
          }
        });
      }
    }
    encontrados.sort(function(a,b){ return String(b.fechaCreacion).localeCompare(String(a.fechaCreacion)); });
    return {ok:true, casos:encontrados};
  }catch(err){
    return {ok:false, error:'No se pudo conectar con Gestión de Casos: '+String(err)};
  }
}
// Trae TODOS los casos de Gestión de Casos (no uno por cliente, como la de
// arriba) — solo lectura, para armar los KPIs del dashboard de Calidad
// (abiertos, alta prioridad, vencidos, sin asignar). Mismos índices de
// columna que obtenerSeguimientoGestionCasos_, no duplica lógica de
// conexión, solo trae todo en vez de filtrar por cliente.
function listarTodosLosCasosGC_(){
  try{
    var ss = SpreadsheetApp.openById(ID_GESTION_CASOS);
    var hojaCasos = ss.getSheetByName('Casos');
    if(!hojaCasos) return {ok:false, error:'No se encontró la hoja "Casos" en Gestión de Casos.'};
    var datos = hojaCasos.getDataRange().getValues();
    if(datos.length<2) return {ok:true, casos:[]};
    var idx = {
      id:0, fechaCreacion:1, estado:2, prioridad:3, cliente:4, dni:5, telefono:6, email:7,
      marca:8, modelo:9, dominio:10, sucursal:11, sector:12, unidad:13, tipoCaso:14, motivo:15,
      descripcion:16, responsable:17, fuente:18, origenId:19, proximaAccion:20,
      fechaUltimaActualizacion:21, slaVencimiento:22
    };
    var out = [];
    for(var i=1;i<datos.length;i++){
      var fila = datos[i];
      if(!fila[idx.id]) continue;
      out.push({
        id: fila[idx.id], fechaCreacion: formatFechaGC_(fila[idx.fechaCreacion]), estado: fila[idx.estado]||'',
        prioridad: fila[idx.prioridad]||'', cliente: fila[idx.cliente]||'', marca: fila[idx.marca]||'',
        sucursal: fila[idx.sucursal]||'', motivo: fila[idx.motivo]||'', responsable: fila[idx.responsable]||'',
        slaVencimiento: fila[idx.slaVencimiento] ? formatFechaGC_(fila[idx.slaVencimiento]) : ''
      });
    }
    return {ok:true, casos:out};
  }catch(err){
    return {ok:false, error:'No se pudo conectar con Gestión de Casos: '+String(err)};
  }
}
var MARCA_LABEL = {chevrolet:'Chevrolet', peugeot:'Peugeot', citroen:'Citroën', honda:'Honda', dfsk:'DFSK / Jetour', usados:'Usados'};
var MARCA_COLOR = {chevrolet:'#E8A33D', peugeot:'#3E67CE', citroen:'#D6304A', honda:'#E4002B', dfsk:'#2FA891', usados:'#8E5FD6'};
var MARCA_TEXTO = {chevrolet:'#1a1a1a', peugeot:'#ffffff', citroen:'#ffffff', honda:'#ffffff', dfsk:'#ffffff', usados:'#ffffff'};
var MARCA_LOGO = {
  chevrolet: 'data:image/png;base64,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',
  peugeot: 'data:image/png;base64,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',
  citroen: 'data:image/png;base64,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',
  honda: 'data:image/png;base64,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',
  dfsk: 'data:image/png;base64,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'
};

var CAMPOS = [
  {k:'id', h:'ID', hide:true},
  {k:'fecha', h:'Fecha'},
  {k:'hora', h:'Hora'},
  {k:'sucursal', h:'Sucursal'},
  {k:'tipoVenta', h:'Tipo de Venta'},
  {k:'cliente', h:'Cliente'},
  {k:'telefono', h:'Teléfono'},
  {k:'email', h:'Email'},
  {k:'modelo', h:'Modelo'},
  {k:'color', h:'Color'},
  {k:'dominio', h:'Dominio'},
  {k:'chasis', h:'Chasis / VIN'},
  {k:'accesorios', h:'Accesorios'},
  {k:'accesoriosColocado', h:'Accesorio Colocado', bool:true},
  {k:'accesoriosColocadoFecha', h:'Accesorio Colocado — Fecha'},
  {k:'campanaTexto', h:'Campaña (detalle)'},
  {k:'campanaControlada', h:'Campaña Controlada', bool:true},
  {k:'campanaControladaFecha', h:'Campaña Controlada — Fecha'},
  {k:'vendedor', h:'Vendedor'},
  {k:'administrativo', h:'Administrativo'},
  {k:'responsableEntrega', h:'Responsable de Entrega'},
  {k:'duracionMinutos', h:'Duración Estimada (min)'},
  {k:'regaloCorporativo', h:'Regalo Corporativo', bool:true},
  {k:'regaloEstado', h:'Regalo — Estado'},
  {k:'regaloFecha', h:'Regalo — Fecha de Entrega'},
  {k:'regaloResponsable', h:'Regalo — Responsable'},
  {k:'regaloItems', h:'Regalo — Items (Mate, Llavero, Portadocumentos, etc.)'},
  {k:'regaloObservaciones', h:'Regalo — Observaciones'},
  {k:'lugar', h:'Lugar'},
  {k:'usado', h:'Es Usado (parte de pago)'},
  {k:'onstar', h:'Estado OnStar'},
  {k:'onstarEnvio', h:'OnStar: Invitación Enviada', bool:true},
  {k:'onstarApp', h:'OnStar: App Instalada', bool:true},
  {k:'onstarLlamado', h:'OnStar: Llamado Bienvenida', bool:true},
  {k:'onstarUso', h:'OnStar: Uso Confirmado', bool:true},
  {k:'estado', h:'Estado de Entrega'},
  {k:'recordatorio', h:'Recordatorio'},
  {k:'confirmado', h:'Confirmación Enviada', bool:true},
  {k:'confirmadoPor', h:'Confirmación Enviada Por'},
  {k:'confirmadoFecha', h:'Confirmación Enviada — Fecha'},
  {k:'recordatorioEnviadoPor', h:'Recordatorio Enviado Por'},
  {k:'recordatorioFecha', h:'Recordatorio Enviado — Fecha'},
  {k:'verificada', h:'Entrega Verificada', bool:true},
  {k:'verificadaPor', h:'Verificada Por'},
  {k:'entregada', h:'Unidad Entregada', bool:true},
  {k:'reprogramada', h:'Reprogramada', bool:true},
  {k:'observaciones', h:'Observaciones'},
  {k:'comentarios', h:'Comentarios (JSON)', hide:true},
  {k:'historial', h:'Historial (JSON)', hide:true},
  {k:'kitSeguridad', h:'Kit de Seguridad', bool:true},
  {k:'kitSeguridadColocado', h:'Kit de Seguridad Colocado', bool:true},
  {k:'kitSeguridadColocadoFecha', h:'Kit de Seguridad — Fecha'},
  {k:'manual', h:'Manual del Vehículo', bool:true},
  {k:'manualEntregado', h:'Manual Entregado', bool:true},
  {k:'manualEntregadoFecha', h:'Manual Entregado — Fecha'},
  {k:'llaveDuplicada', h:'Llave Duplicada', bool:true},
  {k:'llaveDuplicadaEntregada', h:'Llave Duplicada Entregada', bool:true},
  {k:'llaveDuplicadaEntregadaFecha', h:'Llave Duplicada Entregada — Fecha'},
  {k:'creadoPor', h:'Creado Por'},
  {k:'traslado', h:'Traslado a Otra Sucursal', bool:true},
  {k:'trasladoCompletado', h:'Traslado Completado', bool:true},
  {k:'trasladoDestino', h:'Traslado — Sucursal Destino'},
  {k:'trasladoObs', h:'Traslado — Observación'},
  {k:'trasladoFecha', h:'Traslado — Fecha'},
  {k:'trasladoUsuario', h:'Traslado — Usuario'},
  {k:'npsScore', h:'NPS - Puntaje'},
  {k:'npsComentario', h:'NPS - Comentario'},
  {k:'npsFecha', h:'NPS - Fecha'},
  {k:'alfombras', h:'Alfombras', bool:true},
  {k:'alfombrasColocadas', h:'Alfombras Colocadas', bool:true},
  {k:'alfombrasColocadasFecha', h:'Alfombras — Fecha'},
  {k:'accesoriosMotivo', h:'Accesorio — Motivo si no colocado'},
  {k:'kitSeguridadMotivo', h:'Kit de Seguridad — Motivo si no colocado'},
  {k:'manualMotivo', h:'Manual — Motivo si no entregado'},
  {k:'llaveDuplicadaMotivo', h:'Llave Duplicada — Motivo si no entregada'},
  {k:'alfombrasMotivo', h:'Alfombras — Motivo si no colocadas'},
  {k:'alertaTempranaSatisfaccionCompra', h:'Alerta Temprana — Satisfacción Compra/Entrega'},
  {k:'alertaTempranaSatisfaccionAtencion', h:'Alerta Temprana — Satisfacción Atención'},
  {k:'alertaTempranaOnstarActivado', h:'Alerta Temprana — OnStar Activado', bool:true},
  {k:'alertaTempranaComentario', h:'Alerta Temprana — Comentario'},
  {k:'alertaTempranaFechaNacimiento', h:'Alerta Temprana — Fecha de Nacimiento'},
  {k:'alertaTempranaEstado', h:'Alerta Temprana — Estado'},
  {k:'alertaTempranaMotivoRechazo', h:'Alerta Temprana — Motivo de Rechazo'},
  {k:'alertaTempranaFechaRespuesta', h:'Alerta Temprana — Fecha de Respuesta'},
  {k:'alertaTempranaUsuario', h:'Alerta Temprana — Usuario'},
  {k:'entregaFallidaMotivo', h:'Entrega Fallida — Motivo'},
  {k:'entregaFallidaFecha', h:'Entrega Fallida — Fecha'},
  {k:'bienvenidaEnviada', h:'Bienvenida Enviada', bool:true},
  {k:'bienvenidaFecha', h:'Bienvenida — Fecha'},
  {k:'kitSeguridadPendienteStock', h:'Kit de Seguridad — Pendiente (sin stock)', bool:true},
  {k:'manualPendienteStock', h:'Manual — Pendiente (sin stock)', bool:true},
  {k:'llaveDuplicadaPendienteStock', h:'Llave Duplicada — Pendiente (sin stock)', bool:true},
  {k:'alfombrasPendienteStock', h:'Alfombras — Pendiente (sin stock)', bool:true},
  {k:'accesoriosPendienteStock', h:'Accesorio — Pendiente (sin stock)', bool:true},
  {k:'campanaMotivo', h:'Campaña — Motivo si no colocada'},
  {k:'campanaPendienteStock', h:'Campaña — Pendiente (sin stock)', bool:true},
  {k:'trasladoChecklist', h:'Traslado — Checklist de ítems (JSON)', hide:true},
  {k:'accesoriosItems', h:'Accesorios — Ítems con precio (JSON)', hide:true},
  {k:'responsablePreparacion', h:'Responsable de Preparación'},
  {k:'garantiaFecha', h:'Garantía — Fecha de Carga'},
  {k:'garantiaFiltrada', h:'Garantía — Filtrada (no le llega encuesta)', bool:true},
  {k:'npsFabricaScore', h:'NPS Fábrica — Puntaje'},
  {k:'npsFabricaFecha', h:'NPS Fábrica — Fecha de Respuesta'},
  {k:'npsFabricaComentario', h:'NPS Fábrica — Comentario'},
  {k:'contactoSofiNombre', h:'Contacto Posventa — Nombre'},
  {k:'contactoSofiNota', h:'Contacto Posventa — Nota'},
  {k:'contactoSofiComentario', h:'Contacto Posventa — Comentario'},
  {k:'contactoSofiMail', h:'Contacto Posventa — Mail'},
  {k:'contactoPosteriorData', h:'Contacto Posterior — Datos (JSON)', hide:true},
  {k:'dni', h:'DNI / CUIT'},
  {k:'campanaNoAplica', h:'Campaña No Aplica', bool:true}
];

// ============================================================
// CONFIGURACIÓN INICIAL (correr una sola vez, a mano, desde el editor)
// ============================================================
// ============================================================
// REPARAR DESALINEACIÓN DE COLUMNAS (correr una sola vez, a mano)
// Si en algún momento se agregaron columnas nuevas "en el medio" de CAMPOS
// en vez de al final, la planilla real y el código quedan desincronizados:
// el código escribe en la posición X, pero la planilla tiene otra cosa ahí.
// Esta función NO borra datos — lee cada fila por el NOMBRE de columna que
// tenía la planilla, y la reordena para que coincida exactamente con el
// orden actual de CAMPOS. Es seguro correrla más de una vez.
// ============================================================
function repararAlineacionColumnas_(){
  var headersNuevos = CAMPOS.map(function(c){return c.h;});
  var reporte = [];
  Object.keys(HOJAS).forEach(function(marca){
    var sheet = getSheetPorMarca_(marca);
    if(!sheet) return;
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if(lastRow<1 || lastCol<1) return;
    var headersActuales = sheet.getRange(1,1,1,lastCol).getValues()[0].map(function(h){return String(h).trim();});
    // Si ya coincide exactamente el orden, no hay nada que reparar en esta hoja.
    var yaCoincide = headersActuales.length===headersNuevos.length && headersActuales.every(function(h,i){return h===headersNuevos[i];});
    if(yaCoincide){ reporte.push(HOJAS[marca]+': ya estaba alineada, sin cambios.'); return; }
    var datos = lastRow>1 ? sheet.getRange(2,1,lastRow-1,lastCol).getValues() : [];
    // Mapa: nombre de columna vieja -> índice viejo (0-based)
    var idxViejoPorHeader = {};
    headersActuales.forEach(function(h,i){ if(h) idxViejoPorHeader[h]=i; });
    // Reconstruye cada fila en el orden NUEVO (el de CAMPOS actual), tomando
    // el valor de la columna vieja que tenga el mismo nombre — si una
    // columna es nueva y no existía antes, queda vacía (no había dato).
    var datosReordenados = datos.map(function(filaVieja){
      return headersNuevos.map(function(hNuevo){
        var idxViejo = idxViejoPorHeader[hNuevo];
        return (idxViejo!==undefined) ? filaVieja[idxViejo] : '';
      });
    });
    // Reescribe todo: encabezado nuevo + datos reordenados. No se pierde
    // ninguna columna vieja que ya no exista en CAMPOS — si hiciera falta
    // recuperar algo de una columna eliminada, hay que hacerlo antes de
    // correr esto, revisando headersActuales.
    sheet.getRange(1,1,1,headersNuevos.length).setValues([headersNuevos])
      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
    if(datosReordenados.length>0){
      // Limpiamos primero el área vieja de datos (por si la hoja nueva tiene menos columnas que la vieja)
      sheet.getRange(2,1,Math.max(lastRow-1,1),Math.max(lastCol,headersNuevos.length)).clearContent();
      sheet.getRange(2,1,datosReordenados.length,headersNuevos.length).setValues(datosReordenados);
    }
    CAMPOS.forEach(function(c,i){ if(c.hide) sheet.hideColumns(i+1); else sheet.showColumns(i+1); });
    reporte.push(HOJAS[marca]+': '+datosReordenados.length+' filas realineadas.');
  });
  var mensaje = reporte.join('\n');
  Logger.log(mensaje);
  try{ getSS_().toast('Reparación de columnas completa — revisá el Log para el detalle.'); }catch(e){}
  return mensaje;
}

// ============================================================
// AGREGAR COLUMNAS NUEVAS SIN BORRAR NADA (usar esta función,
// NO configurarPlanilla, cuando ya hay entregas cargadas por el equipo)
// ============================================================
function agregarColumnasFaltantes(){
  var headers = CAMPOS.map(function(c){return c.h;});
  var agregadas = [];
  Object.keys(HOJAS).forEach(function(marca){
    var sheet = getSheetPorMarca_(marca);
    if(!sheet) return;
    var colsActuales = sheet.getLastColumn();
    if(colsActuales < headers.length){
      var nuevosHeaders = headers.slice(colsActuales);
      var rango = sheet.getRange(1, colsActuales+1, 1, nuevosHeaders.length);
      rango.setValues([nuevosHeaders])
        .setFontWeight('bold').setBackground(MARCA_COLOR[marca]).setFontColor(MARCA_TEXTO[marca])
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      sheet.autoResizeColumns(colsActuales+1, nuevosHeaders.length);
      if(agregadas.indexOf(HOJAS[marca])===-1) agregadas.push(HOJAS[marca]);
    }
  });
  getConfigSheet_(); // por si faltara, no borra la existente
  if(agregadas.length===0){
    getSS_().toast('No había columnas nuevas para agregar — ya estaba todo al día.');
  } else {
    getSS_().toast('Columnas agregadas sin tocar los datos existentes en: '+agregadas.join(', '));
  }
}

function configurarPlanilla(){
  var ss = getSS_();
  var headers = CAMPOS.map(function(c){return c.h;});
  var fechaIdx = CAMPOS.findIndex(function(c){return c.k==='fecha';});
  var horaIdx = CAMPOS.findIndex(function(c){return c.k==='hora';});

  Object.keys(HOJAS).forEach(function(marca){
    var nombre = HOJAS[marca];
    var sheet = ss.getSheetByName(nombre);
    if(!sheet) sheet = ss.insertSheet(nombre);
    sheet.clear();
    var headerRange = sheet.getRange(1,1,1,headers.length);
    headerRange.setValues([headers])
      .setFontWeight('bold')
      .setBackground(MARCA_COLOR[marca])
      .setFontColor(MARCA_TEXTO[marca])
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontSize(10);
    sheet.setRowHeight(1, 34);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2); // fecha y hora siempre visibles al scrollear horizontal
    sheet.autoResizeColumns(1, headers.length);
    CAMPOS.forEach(function(c,i){ if(c.hide) sheet.hideColumns(i+1); });
    // Fecha y Hora SIEMPRE como texto plano, para que Sheets no las convierta solas.
    sheet.getRange(2, fechaIdx+1, 3000, 1).setNumberFormat('@');
    sheet.getRange(2, horaIdx+1, 3000, 1).setNumberFormat('@');
    // Color de la pestaña, para identificar la marca de un vistazo.
    sheet.setTabColor(MARCA_COLOR[marca]);
    // Borde grueso debajo del encabezado.
    headerRange.setBorder(null, null, true, null, null, null, MARCA_COLOR[marca], SpreadsheetApp.BorderStyle.SOLID_THICK);
    // Franjas alternadas suaves para que se lea mejor.
    try{
      sheet.getBandings().forEach(function(b){ b.remove(); });
      sheet.getRange(1,1,Math.max(sheet.getMaxRows(),2),headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
    }catch(e){}
  });

  // --- Resumen (dashboard con totales, en vivo con fórmulas) ---
  var resumen = ss.getSheetByName('Resumen');
  if(!resumen) resumen = ss.insertSheet('Resumen');
  resumen.clear();
  resumen.setColumnWidths(1,1,170);
  resumen.setColumnWidths(2,7,140);

  resumen.getRange('A1:H1').merge().setValue('📊 PANEL DE ENTREGAS — GRUPO PARÍS — DASHBOARD')
    .setFontSize(16).setFontWeight('bold').setBackground('#0F131A').setFontColor('#FFFFFF')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  resumen.setRowHeight(1, 42);

  var accColIdx = CAMPOS.findIndex(function(c){return c.k==='accesoriosColocado';});
  var accesoriosIdx = CAMPOS.findIndex(function(c){return c.k==='accesorios';});
  var onstarColIdx = CAMPOS.findIndex(function(c){return c.k==='onstar';});
  var campanaTextoIdx = CAMPOS.findIndex(function(c){return c.k==='campanaTexto';});
  var campanaControladaIdx = CAMPOS.findIndex(function(c){return c.k==='campanaControlada';});
  var regaloCorpIdx = CAMPOS.findIndex(function(c){return c.k==='regaloCorporativo';});
  var regaloEstadoIdx = CAMPOS.findIndex(function(c){return c.k==='regaloEstado';});
  var confirmadoIdx = CAMPOS.findIndex(function(c){return c.k==='confirmado';});
  var recordatorioIdx = CAMPOS.findIndex(function(c){return c.k==='recordatorio';});

  var col = {
    acc: colLetra_(accesoriosIdx+1), accColocado: colLetra_(accColIdx+1),
    onstar: colLetra_(onstarColIdx+1),
    campanaTexto: colLetra_(campanaTextoIdx+1), campanaControlada: colLetra_(campanaControladaIdx+1),
    regaloCorp: colLetra_(regaloCorpIdx+1), regaloEstado: colLetra_(regaloEstadoIdx+1),
    confirmado: colLetra_(confirmadoIdx+1), recordatorio: colLetra_(recordatorioIdx+1)
  };

  function formulaEntregas_(hoja){ return "COUNTA('"+hoja+"'!A2:A)"; }
  function formulaAccesorios_(hoja){
    return "COUNTIF('"+hoja+"'!"+col.accColocado+"2:"+col.accColocado+",TRUE)&\" / \"&COUNTIF('"+hoja+"'!"+col.acc+"2:"+col.acc+",\"<>\")";
  }
  function formulaOnstar_(hoja, aplica){
    if(!aplica) return '"— no aplica —"';
    return "COUNTIF('"+hoja+"'!"+col.onstar+"2:"+col.onstar+",\"ok\")&\" / \"&COUNTA('"+hoja+"'!A2:A)";
  }
  function formulaCampanas_(hoja){
    return "COUNTIF('"+hoja+"'!"+col.campanaControlada+"2:"+col.campanaControlada+",TRUE)&\" / \"&COUNTIF('"+hoja+"'!"+col.campanaTexto+"2:"+col.campanaTexto+",\"<>\")";
  }
  function formulaRegalos_(hoja){
    return "COUNTIFS('"+hoja+"'!"+col.regaloCorp+"2:"+col.regaloCorp+",TRUE,'"+hoja+"'!"+col.regaloEstado+"2:"+col.regaloEstado+",\"Entregado\")&\" / \"&COUNTIF('"+hoja+"'!"+col.regaloCorp+"2:"+col.regaloCorp+",TRUE)";
  }
  function formulaConfirmaciones_(hoja){
    return "COUNTIF('"+hoja+"'!"+col.confirmado+"2:"+col.confirmado+",TRUE)&\" / \"&COUNTA('"+hoja+"'!A2:A)";
  }
  function formulaRecordatorios_(hoja){
    return "COUNTIF('"+hoja+"'!"+col.recordatorio+"2:"+col.recordatorio+",\"enviado\")&\" / \"&COUNTA('"+hoja+"'!A2:A)";
  }

  resumen.getRange('A3').setValue('Total de entregas cargadas (todas las marcas)').setFontWeight('bold').setFontSize(11);
  resumen.getRange('B3').setFormula("=COUNTA(Chevrolet!A2:A)+COUNTA(Peugeot!A2:A)+COUNTA(Citroën!A2:A)+COUNTA('DFSK - Jetour'!A2:A)")
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');

  var headerFila = 5;
  var encabezados = ['Marca','Entregas','Accesorios\ncolocados','OnStar\nactivado','Campañas\ncontroladas','Regalos\nentregados','Confirmaciones\nenviadas','Recordatorios\nenviados'];
  resumen.getRange(headerFila,1,1,8).setValues([encabezados])
    .setFontWeight('bold').setBackground('#1D2330').setFontColor('#FFFFFF').setHorizontalAlignment('center').setWrap(true);
  resumen.setRowHeight(headerFila, 42);

  var filasMarca = [
    {marca:'Chevrolet', hoja:'Chevrolet', color:MARCA_COLOR.chevrolet, texto:MARCA_TEXTO.chevrolet, onstar:true},
    {marca:'Peugeot', hoja:'Peugeot', color:MARCA_COLOR.peugeot, texto:MARCA_TEXTO.peugeot, onstar:false},
    {marca:'Citroën', hoja:'Citroën', color:MARCA_COLOR.citroen, texto:MARCA_TEXTO.citroen, onstar:false},
    {marca:'Honda', hoja:'Honda', color:MARCA_COLOR.honda, texto:MARCA_TEXTO.honda, onstar:false},
    {marca:'DFSK / Jetour', hoja:'DFSK - Jetour', color:MARCA_COLOR.dfsk, texto:MARCA_TEXTO.dfsk, onstar:false}
  ];
  filasMarca.forEach(function(f, i){
    var fila = headerFila + 1 + i;
    resumen.getRange(fila,1).setValue(f.marca).setBackground(f.color).setFontColor(f.texto).setFontWeight('bold').setHorizontalAlignment('center');
    resumen.getRange(fila,2).setFormula("="+formulaEntregas_(f.hoja)).setHorizontalAlignment('center');
    resumen.getRange(fila,3).setFormula("="+formulaAccesorios_(f.hoja)).setHorizontalAlignment('center');
    if(f.onstar) resumen.getRange(fila,4).setFormula("="+formulaOnstar_(f.hoja,true)).setHorizontalAlignment('center');
    else resumen.getRange(fila,4).setValue('— no aplica —').setHorizontalAlignment('center').setFontColor('#999999');
    resumen.getRange(fila,5).setFormula("="+formulaCampanas_(f.hoja)).setHorizontalAlignment('center');
    resumen.getRange(fila,6).setFormula("="+formulaRegalos_(f.hoja)).setHorizontalAlignment('center');
    resumen.getRange(fila,7).setFormula("="+formulaConfirmaciones_(f.hoja)).setHorizontalAlignment('center');
    resumen.getRange(fila,8).setFormula("="+formulaRecordatorios_(f.hoja)).setHorizontalAlignment('center');
    resumen.getRange(fila,1,1,8).setBorder(true,true,true,true,true,true,'#2A303D',SpreadsheetApp.BorderStyle.SOLID);
  });
  resumen.setFrozenRows(headerFila);
  resumen.getRange(1,1,filasMarca.length+headerFila,8).setVerticalAlignment('middle');
  resumen.getRange('A'+(headerFila+filasMarca.length+2)).setValue('Nota: el desglose por administrativo y la proyección de regalos se ven completos en el Dashboard de la web (🎓 Maestro) y en su exportación a Excel.').setFontColor('#999999').setFontSize(9);

  // --- Plantillas de mail: una por MARCA y TIPO (8 filas) — SIEMPRE se resetean ---
  var plantillasSheet = ss.getSheetByName('Plantillas');
  if(!plantillasSheet) plantillasSheet = ss.insertSheet('Plantillas');
  plantillasSheet.clear();
  plantillasSheet.getRange(1,1,1,4).setValues([['Marca','Tipo','Asunto','Cuerpo (HTML — usar {{placeholders}})']]).setFontWeight('bold');
  plantillasSheet.setFrozenRows(1);

  var fichaDatos =
    '<table style="width:100%;border-collapse:collapse;font-size:13.5px;color:#333;">' +
    '<tr><td style="padding:6px 0;color:#888;">Vehículo</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{marca}} {{modelo}}</td></tr>' +
    '<tr><td style="padding:6px 0;color:#888;">Patente</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{dominio}}</td></tr>' +
    '<tr><td style="padding:6px 0;color:#888;">VIN / Chasis</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{chasis}}</td></tr>' +
    '<tr><td style="padding:6px 0;color:#888;">Fecha</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{fecha}}</td></tr>' +
    '<tr><td style="padding:6px 0;color:#888;">Hora</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{hora}}</td></tr>' +
    '<tr><td style="padding:6px 0;color:#888;">Sucursal</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{sucursal}}</td></tr>' +
    '<tr><td style="padding:6px 0;color:#888;">Responsable</td><td style="padding:6px 0;font-weight:bold;text-align:right;">{{responsable}}</td></tr>' +
    '</table>';

  function tarjetaMail_(titulo, emoji, cuerpoParrafos, firmaExtra){
    return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#f4f5f7;padding:0 0 20px;">' +
      '<div style="background:#0F131A;padding:22px 24px;text-align:center;">' +
        '{{logoBlock}}' +
        '<div style="color:{{color}};font-size:12px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:5px;">GRUPO PARÍS</div>' +
        '<div style="color:#ffffff;font-size:19px;font-weight:bold;">{{marca}}</div>' +
      '</div>' +
      '<div style="background:#ffffff;margin:0 18px;margin-top:-1px;border-radius:0 0 14px 14px;padding:30px 26px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">' +
        '<h1 style="font-size:19px;color:#111;margin:0 0 14px;">'+titulo+' '+emoji+'</h1>' +
        cuerpoParrafos +
        '<div style="background:#f7f8fa;border-radius:10px;padding:16px 18px;margin:18px 0;">' + fichaDatos + '</div>' +
        '<div style="text-align:center;margin-top:22px;">' +
          '<div style="display:inline-block;background:{{color}};color:{{colorTexto}};font-weight:bold;font-size:13px;padding:12px 26px;border-radius:8px;">📍 {{direccion}}</div>' +
        '</div>' +
        '<p style="color:#666;font-size:13px;margin-top:22px;">'+(firmaExtra||'')+'</p>' +
        '<p style="color:#999;font-size:11.5px;margin-top:10px;text-align:center;border-top:1px solid #eee;padding-top:14px;">Consultas al {{telefono_contacto}} · Confirmado por <b>{{administrativo}}</b>{{flotaTexto}}</p>' +
      '</div>' +
      '<p style="text-align:center;color:#aaa;font-size:11px;margin-top:14px;">Grupo París</p>' +
    '</div>';
  }
  var P='<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 12px;">';
  var PC='</p>';

  // --- CHEVROLET ---
  var chevConfirmacion = tarjetaMail_('Confirmación de entrega','🚗',
    P+'¡Ya falta muy poco para que reciba su nuevo Chevrolet {{modelo}}!'+PC+
    P+'Según lo coordinado previamente, le confirmamos la entrega de su Chevrolet <b>{{modelo}}</b> (VIN: {{chasis}}) para el día <b>{{fecha}}</b> a las <b>{{hora}}</b> hs en nuestra sucursal de {{sucursal}}.'+PC+
    P+'La entrega tendrá una duración aproximada de {{duracion}} minutos y estará a cargo de <b>{{responsable}}</b>, quien le mostrará las principales funciones de su vehículo y responderá todas sus consultas para que pueda comenzar a disfrutarlo desde el primer momento.'+PC+
    P+'Le pedimos presentarse 5 minutos antes del horario programado.'+PC+
    P+'Si su vehículo dispone de myChevrolet y OnStar, le recomendamos descargar la aplicación antes de asistir para agilizar la configuración durante la entrega.'+PC+
    '{{accesoriosBlock}}'+
    '{{usadoBlock}}',
    'Gracias por elegir Chevrolet y Paris Cars. Será un placer compartir con usted este momento.'
  );
  var chevRecordatorio = tarjetaMail_('Recordatorio de entrega','⏰',
    P+'Le recordamos que la entrega de su Chevrolet <b>{{modelo}}</b>, VIN: {{chasis}}, está programada para el día <b>{{fecha}}</b> a las <b>{{hora}}</b> hs en nuestra sucursal de {{sucursal}}.'+PC+
    P+'Le solicitamos presentarse 5 minutos antes del horario previsto para garantizar una entrega puntual.'+PC+
    P+'Si su vehículo cuenta con los servicios conectados de Chevrolet, le recomendamos descargar previamente la aplicación myChevrolet para facilitar su configuración durante la entrega.'+PC,
    'Agradecemos la confianza depositada en Paris Cars. ¡Lo esperamos para entregarle su nuevo Chevrolet!'
  );

  // --- PEUGEOT / CITROËN (mismo texto para las dos) ---
  function textoPeugeotCitroen_(tipo){
    if(tipo==='confirmacion'){
      return tarjetaMail_('Confirmación de entrega','🚗',
        P+'Según lo acordado con anterioridad, le confirmamos la entrega de su vehículo <b>{{modelo}}</b>, VIN: {{chasis}}, para el día <b>{{fecha}}</b> a las <b>{{hora}}</b> en {{sucursal}}.'+PC+
        P+'La duración aproximada de la entrega es de {{duracion}} minutos y estará a cargo de nuestro responsable de entregas, <b>{{responsable}}</b>.'+PC+
        P+'Le solicitamos por favor presentarse 5 minutos antes del horario para evitar demoras.'+PC+
        '{{appBlock}}'+
        '{{accesoriosBlock}}'+
        '{{usadoBlock}}'+
        P+'Le agradecemos por su confianza y le deseamos un muy buen día.'+PC,
        ''
      );
    }
    return tarjetaMail_('Recordatorio de entrega','⏰',
      P+'Le recordamos que su entrega de vehículo <b>{{modelo}}</b>, VIN: {{chasis}}, se realizará el día <b>{{fecha}}</b> a las <b>{{hora}}</b> en {{sucursal}}.'+PC+
      P+'Responsable: <b>{{responsable}}</b>.'+PC,
      ''
    );
  }

  var filasPlantillas = [
    ['chevrolet','confirmacion','Confirmación de entrega — Grupo París · Chevrolet', chevConfirmacion],
    ['chevrolet','recordatorio','Recordatorio de entrega — Grupo París · Chevrolet', chevRecordatorio],
    ['peugeot','confirmacion','Confirmación de entrega — Grupo París · Peugeot', textoPeugeotCitroen_('confirmacion')],
    ['peugeot','recordatorio','Recordatorio de entrega — Grupo París · Peugeot', textoPeugeotCitroen_('recordatorio')],
    ['citroen','confirmacion','Confirmación de entrega — Grupo París · Citroën', textoPeugeotCitroen_('confirmacion')],
    ['citroen','recordatorio','Recordatorio de entrega — Grupo París · Citroën', textoPeugeotCitroen_('recordatorio')],
    ['honda','confirmacion','Confirmación de entrega — Grupo París · Honda', textoPeugeotCitroen_('confirmacion')],
    ['honda','recordatorio','Recordatorio de entrega — Grupo París · Honda', textoPeugeotCitroen_('recordatorio')],
    ['dfsk','confirmacion','Confirmación de entrega — Grupo París · DFSK/Jetour', textoPeugeotCitroen_('confirmacion')],
    ['dfsk','recordatorio','Recordatorio de entrega — Grupo París · DFSK/Jetour', textoPeugeotCitroen_('recordatorio')]
  ];
  plantillasSheet.getRange(2,1,filasPlantillas.length,4).setValues(filasPlantillas);
  plantillasSheet.autoResizeColumns(1,2);
  plantillasSheet.setColumnWidth(4, 480);

  // --- Config (maestros, bloqueos, direcciones) ---
  getConfigSheet_();

  // --- Orden prolijo de pestañas: Resumen primero ---
  var orden = ['Resumen','Chevrolet','Peugeot','Citroën','Honda','DFSK - Jetour','Plantillas','Config'];
  orden.forEach(function(nombre, i){
    var sh = ss.getSheetByName(nombre);
    if(sh) ss.setActiveSheet(sh) && ss.moveActiveSheet(i+1);
  });
  ss.setActiveSheet(ss.getSheetByName('Resumen'));

  instalarTriggerRecordatorios_();

  ss.toast('Planilla configurada: Resumen + 4 marcas coloreadas + Plantillas (por marca) + Config + envío automático de recordatorios.');
}

function colLetra_(colNum){
  var letra='';
  while(colNum>0){
    var resto=(colNum-1)%26;
    letra=String.fromCharCode(65+resto)+letra;
    colNum=Math.floor((colNum-1)/26);
  }
  return letra;
}

// ============================================================
// FECHA / HORA — sin bugs de conversión automática de Sheets
// ============================================================
function formatFecha_(v){
  if(v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  return v;
}
function formatHora_(v){
  if(v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  return v;
}

function getSheetPorMarca_(marca){
  return getSS_().getSheetByName(HOJAS[marca]);
}

function rowToObj_(row, marca){
  var obj = {marca: marca};
  CAMPOS.forEach(function(c,i){ obj[c.k]=row[i]; });
  CAMPOS.forEach(function(c){ if(c.bool) obj[c.k]=(obj[c.k]===true||obj[c.k]==='true'); });
  obj.fecha = formatFecha_(obj.fecha);
  obj.hora = formatHora_(obj.hora);
  try{ obj.comentarios = obj.comentarios? JSON.parse(obj.comentarios):[]; }catch(e){ obj.comentarios=[]; }
  try{ obj.historial = obj.historial? JSON.parse(obj.historial):[]; }catch(e){ obj.historial=[]; }
  try{ obj.trasladoChecklist = obj.trasladoChecklist? JSON.parse(obj.trasladoChecklist):{}; }catch(e){ obj.trasladoChecklist={}; }
  try{ obj.accesoriosItems = obj.accesoriosItems? JSON.parse(obj.accesoriosItems):[]; }catch(e){ obj.accesoriosItems=[]; }
  if(obj.onstar==='') obj.onstar=null;
  return obj;
}
function objToRow_(obj){
  return CAMPOS.map(function(c){
    if(c.k==='comentarios') return JSON.stringify(obj.comentarios||[]);
    if(c.k==='historial') return JSON.stringify(obj.historial||[]);
    if(c.k==='trasladoChecklist') return JSON.stringify(obj.trasladoChecklist||{});
    if(c.k==='accesoriosItems') return JSON.stringify(obj.accesoriosItems||[]);
    if(c.k==='fecha' || c.k==='hora'){
      var v = obj[c.k];
      return v ? ("'" + v) : ''; // apóstrofe = forzar texto plano, Sheets nunca lo guarda
    }
    var v=obj[c.k];
    return (v===undefined||v===null)?'':v;
  });
}

function getEntregas(){
  var todas=[];
  Object.keys(HOJAS).forEach(function(marca){
    var sheet=getSheetPorMarca_(marca);
    if(!sheet) return;
    var lastRow=sheet.getLastRow();
    if(lastRow<2) return;
    var data=sheet.getRange(2,1,lastRow-1,CAMPOS.length).getValues();
    data.filter(function(r){return r[0];}).forEach(function(r){ todas.push(rowToObj_(r, marca)); });
  });
  return todas;
}

function findRowIndexById_(marca, id){
  var sheet=getSheetPorMarca_(marca);
  var lastRow=sheet.getLastRow();
  if(lastRow<2) return -1;
  var ids=sheet.getRange(2,1,lastRow-1,1).getValues();
  for(var i=0;i<ids.length;i++){ if(String(ids[i][0])===String(id)) return i+2; }
  return -1;
}

function addEntrega(marca, obj){
  obj.id=Utilities.getUuid();
  getSheetPorMarca_(marca).appendRow(objToRow_(obj));
  return obj.id;
}

function updateEntregaFields(marca, id, fields){
  var rowIdx=findRowIndexById_(marca,id);
  if(rowIdx===-1) return false;
  var sheet=getSheetPorMarca_(marca);
  Object.keys(fields).forEach(function(f){
    var idx=-1;
    for(var i=0;i<CAMPOS.length;i++){ if(CAMPOS[i].k===f){ idx=i; break; } }
    if(idx>-1){
      var val = fields[f];
      if((f==='fecha'||f==='hora'||f==='garantiaFecha'||f==='npsFabricaFecha') && val) val = "'" + val; // mismo truco al editar
      if(val && typeof val==='object') val = JSON.stringify(val); // ej: trasladoChecklist
      sheet.getRange(rowIdx, idx+1).setValue(val);
    }
  });
  return true;
}

function agregarComentario(marca, id, autor, texto){
  var rowIdx=findRowIndexById_(marca,id);
  if(rowIdx===-1) return false;
  var sheet=getSheetPorMarca_(marca);
  var idx=-1; for(var i=0;i<CAMPOS.length;i++){ if(CAMPOS[i].k==='comentarios'){ idx=i; break; } }
  var current=sheet.getRange(rowIdx,idx+1).getValue();
  var arr=[]; try{arr=current?JSON.parse(current):[];}catch(e){}
  arr.push({autor:autor, fecha:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM HH:mm'), texto:texto});
  sheet.getRange(rowIdx,idx+1).setValue(JSON.stringify(arr));
  return true;
}
function agregarHistorial(marca, id, texto){
  var rowIdx=findRowIndexById_(marca,id);
  if(rowIdx===-1) return false;
  var sheet=getSheetPorMarca_(marca);
  var idx=-1; for(var i=0;i<CAMPOS.length;i++){ if(CAMPOS[i].k==='historial'){ idx=i; break; } }
  var current=sheet.getRange(rowIdx,idx+1).getValue();
  var arr=[]; try{arr=current?JSON.parse(current):[];}catch(e){}
  arr.push({fecha:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM HH:mm'), texto:texto});
  sheet.getRange(rowIdx,idx+1).setValue(JSON.stringify(arr));
  // NOTA: antes acá se invalidaba confirmado/recordatorio en TODOS los casos —
  // esta función se llama para cualquier entrada de historial (comentarios, accesorios,
  // OnStar, envío de confirmación, etc.), así que resetear acá pisaba el estado recién
  // guardado por enviarConfirmacion()/enviarRecordatorio(). Esa invalidación ahora se hace
  // explícitamente solo al reprogramar (ver reprogramar() en el frontend).
  return true;
}
function deleteEntrega(marca, id){
  var rowIdx=findRowIndexById_(marca,id);
  if(rowIdx===-1) return false;
  getSheetPorMarca_(marca).deleteRow(rowIdx);
  return true;
}

// ============================================================
// CONFIGURACIÓN (maestros, bloqueos, direcciones) — persistente
// ============================================================
var LUGAR_NOMBRE = {SJ:'San Juan', SL:'San Luis', VM:'Villa Mercedes', ML:'Merlo'};

function configDefault_(){
  var direccionMerlo = 'Ruta 1, Cerro Blanco, D5881 Merlo, San Luis';
  return {
    maestros: {
      vendedores: ['Carlos','Daniel','Martín','Alejo','PDA'],
      administrativos: [{nombre:'Vero', flota:'', email:''},{nombre:'Ivana', flota:'', email:''},{nombre:'Alejo', flota:'', email:''}],
      responsables: ['Tomás','Belén','Tomás Saez']
    },
    bloqueos: {
      semanales: [{dia:'Sábado', desde:'15:00'},{dia:'Domingo', desde:'00:00'}],
      feriados: [{fecha:'09/07/2026', motivo:'Día de la Independencia'}]
    },
    direcciones: {
      chevrolet: {SJ:'9 de Julio 1153', SL:'Av. Santos Ortiz km 784 (Frente a la YPF Bella vista)', VM:'', ML:direccionMerlo},
      peugeot:   {SJ:'Av. Illia y Ejército de los Andes, San Juan', SL:'Av. Santos Ortiz km 784 (Frente a la YPF Bella vista)', VM:'Av. Bartolomé Mitre 888', ML:direccionMerlo},
      citroen:   {SJ:'Av. Illia y Ejército de los Andes, San Juan', SL:'Av. Santos Ortiz km 784 (Frente a la YPF Bella vista)', VM:'Av. Bartolomé Mitre 888', ML:direccionMerlo},
      honda:     {SJ:'', SL:'', VM:'', ML:direccionMerlo},
      dfsk:      {SJ:'', SL:'', VM:'', ML:direccionMerlo}
    },
    apps: {chevrolet:'myChevrolet', peugeot:'MyPeugeot', citroen:'MyCitroën', honda:'—', dfsk:'—'},
    telefonoContacto: '0264-4123456',
    duracionEntrega: 60,
    usuariosAutorizados: [],
    copiaSiempreA: 'calidad@parisautos.com.ar'
  };
}
function getConfigSheet_(){
  var ss = getSS_();
  var sheet = ss.getSheetByName('Config');
  if(!sheet){
    sheet = ss.insertSheet('Config');
    sheet.getRange('A1').setValue(JSON.stringify(configDefault_()));
    sheet.getRange('A2').setValue('(No borrar esta celda A1 — guarda toda la configuración en formato JSON. Se edita desde la web, no hace falta tocarla acá.)');
  }
  return sheet;
}
// Actualiza configuraciones viejas (direcciones planas / administrativos como texto) al formato nuevo, sin perder lo ya cargado.
function migrarConfig_(config){
  var cambio = false;
  if(config.direcciones && typeof config.direcciones.SJ === 'string' && !config.direcciones.chevrolet){
    var viejas = config.direcciones;
    var nuevas = {};
    Object.keys(HOJAS).forEach(function(marca){
      nuevas[marca] = {SJ:viejas.SJ||'', SL:viejas.SL||'', VM:viejas.VM||'', ML:viejas.ML||''};
    });
    config.direcciones = nuevas;
    cambio = true;
  }
  if(config.maestros && config.maestros.administrativos && config.maestros.administrativos.length && typeof config.maestros.administrativos[0]==='string'){
    config.maestros.administrativos = config.maestros.administrativos.map(function(n){ return {nombre:n, flota:''}; });
    cambio = true;
  }
  if(!config.telefonoContacto) config.telefonoContacto = configDefault_().telefonoContacto;
  if(!config.duracionEntrega){ config.duracionEntrega = 60; cambio = true; }
  if(!config.usuariosAutorizados){ config.usuariosAutorizados = []; cambio = true; }
  if(!config.copiaSiempreA){ config.copiaSiempreA = 'calidad@parisautos.com.ar'; cambio = true; }
  if(config.direcciones && !config.direcciones.honda){
    config.direcciones.honda = {SJ:'', SL:'', VM:'', ML:(config.direcciones.dfsk && config.direcciones.dfsk.ML) || ''};
    cambio = true;
  }
  if(config.maestros && config.maestros.administrativos){
    config.maestros.administrativos.forEach(function(a){
      if(a.email===undefined){ a.email=''; cambio = true; }
    });
  }
  return {config:config, cambio:cambio};
}
function getConfig(){
  var sheet = getConfigSheet_();
  var raw = sheet.getRange('A1').getValue();
  var config;
  try{ config = raw ? JSON.parse(raw) : configDefault_(); }catch(e){ config = configDefault_(); }
  var m = migrarConfig_(config);
  if(m.cambio) guardarConfig(m.config);
  return m.config;
}
function guardarConfig(configObj){
  var sheet = getConfigSheet_();
  sheet.getRange('A1').setValue(JSON.stringify(configObj));
  return true;
}

// ============================================================
// PLANTILLAS DE MAIL (una por marca y tipo)
// ============================================================
function getPlantillas(){
  var sheet=getSS_().getSheetByName('Plantillas');
  var lastRow=sheet.getLastRow();
  var data = lastRow>1 ? sheet.getRange(2,1,lastRow-1,4).getValues() : [];
  var out={};
  data.forEach(function(r){
    var marca=r[0], tipo=r[1];
    if(!marca || !tipo) return;
    if(!out[marca]) out[marca]={};
    out[marca][tipo] = {asunto:r[2], cuerpo:r[3]};
  });
  return out;
}
function getPlantilla_(marca, tipo){
  var todas = getPlantillas();
  if(todas[marca] && todas[marca][tipo]) return todas[marca][tipo];
  if(todas['peugeot'] && todas['peugeot'][tipo]) return todas['peugeot'][tipo]; // respaldo genérico
  return {asunto:'', cuerpo:''};
}
function guardarPlantilla(marca, tipo, asunto, cuerpo){
  var sheet=getSS_().getSheetByName('Plantillas');
  var lastRow=sheet.getLastRow();
  var data = lastRow>1 ? sheet.getRange(2,1,lastRow-1,2).getValues() : [];
  for(var i=0;i<data.length;i++){
    if(data[i][0]===marca && data[i][1]===tipo){
      sheet.getRange(i+2,3).setValue(asunto);
      sheet.getRange(i+2,4).setValue(cuerpo);
      return true;
    }
  }
  sheet.appendRow([marca, tipo, asunto, cuerpo]);
  return true;
}

function renderPlantilla_(tipo, r, config){
  var pl = getPlantilla_(r.marca, tipo);
  var direccionesMarca = config.direcciones[r.marca] || {};
  var direccion = direccionesMarca[r.lugar] || 'nuestra sucursal';
  var app = config.apps[r.marca];
  var appBlock = (app && app!=='—') ? ('<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 12px;">Le sugerimos descargar la app <b>'+app+'</b> desde su tienda de aplicaciones para activarla al momento de la entrega.</p>') : '';
  var usadoBlock = '<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 12px;">En caso de entregar un vehículo usado, deberá presentar: título de propiedad, cédulas, manual del vehículo, llaves y duplicado.</p>';
  // Se avisan los accesorios que va a llevar la unidad aunque todavía no
  // estén colocados en este momento (la confirmación se manda antes de la
  // entrega, así que puede que se terminen de colocar justo el día). Solo
  // se excluyen los que quedaron marcados como "no colocado" — esos ya se
  // sabe que no van.
  var accesoriosParaMostrar = (r.accesoriosItems||[]).filter(function(it){ return it.estado!=='no_colocado'; }).map(function(it){ return it.nombre.toUpperCase(); });
  var accesoriosBlock = accesoriosParaMostrar.length ? ('<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 12px;">Accesorios incluidos: <b>'+accesoriosParaMostrar.join(', ')+'</b>.</p>') : '';
  // El bloque de accesorios se inyecta directo donde ya está {{usadoBlock}}
  // en tu plantilla guardada — así funciona en Chevrolet, Peugeot, Citroën,
  // Honda y DFSK sin que haga falta editar ni migrar nada a mano: ese
  // placeholder ya lo tenés puesto en las 5.
  usadoBlock = accesoriosBlock + usadoBlock;
  var logoUrl = MARCA_LOGO[r.marca];
  var logoBlock = logoUrl ? ('<div style="width:52px;height:52px;border-radius:50%;background:#ffffff;margin:0 auto 12px;display:table;"><div style="display:table-cell;vertical-align:middle;text-align:center;"><img src="'+logoUrl+'" width="38" style="max-width:38px;display:inline-block;"></div></div>') : '';
  var adminObj = (config.maestros.administrativos||[]).find(function(a){ return a && a.nombre===r.administrativo; });
  var flota = adminObj && adminObj.flota ? adminObj.flota : '';
  var flotaTexto = flota ? (' (Flota N° '+flota+')') : '';
  var cuerpo = pl.cuerpo
    .replace(/{{cliente}}/g, r.cliente || '')
    .replace(/{{marca}}/g, MARCA_LABEL[r.marca] || r.marca || '')
    .replace(/{{modelo}}/g, r.modelo || '')
    .replace(/{{chasis}}/g, r.chasis || '')
    .replace(/{{dominio}}/g, r.dominio || '')
    .replace(/{{fecha}}/g, r.fecha || '')
    .replace(/{{hora}}/g, r.hora || '')
    .replace(/{{lugar}}/g, r.lugar || '')
    .replace(/{{sucursal}}/g, LUGAR_NOMBRE[r.lugar] || r.lugar || '')
    .replace(/{{responsable}}/g, r.responsableEntrega || '')
    .replace(/{{vendedor}}/g, r.vendedor || '')
    .replace(/{{administrativo}}/g, r.administrativo || '')
    .replace(/{{flota}}/g, flota)
    .replace(/{{flotaTexto}}/g, flotaTexto)
    .replace(/{{duracion}}/g, String(r.duracionMinutos || config.duracionEntrega || 60))
    .replace(/{{telefono_contacto}}/g, config.telefonoContacto || '')
    .replace(/{{direccion}}/g, direccion)
    .replace(/{{app}}/g, app && app!=='—' ? app : '')
    .replace(/{{appBlock}}/g, appBlock)
    .replace(/{{usadoBlock}}/g, usadoBlock)
    .replace(/{{accesoriosBlock}}/g, '') // por si alguna plantilla ya tenía este placeholder de un intento anterior, lo vaciamos para que no se duplique el texto
    .replace(/{{logoBlock}}/g, logoBlock)
    .replace(/{{color}}/g, MARCA_COLOR[r.marca] || '#1D2330')
    .replace(/{{colorTexto}}/g, MARCA_TEXTO[r.marca] || '#ffffff');
  return {asunto: pl.asunto, cuerpo: cuerpo};
}

function previsualizarPlantilla(tipo, marca, id){
  var config=getConfig();
  var rowIdx=findRowIndexById_(marca,id);
  var sheet=getSheetPorMarca_(marca);
  var row=sheet.getRange(rowIdx,1,1,CAMPOS.length).getValues()[0];
  var r=rowToObj_(row,marca);
  return renderPlantilla_(tipo, r, config);
}

// ============================================================
// PERMISOS Y VALIDACIONES DE ENVÍO
// ============================================================
function puedeEnviar_(usuario, config){
  if(!usuario) return false;
  var lista = config.usuariosAutorizados || [];
  return lista.some(function(u){ return String(u).trim().toLowerCase() === String(usuario).trim().toLowerCase(); });
}
function agregarHistorialInterno_(marca, id, texto){
  var rowIdx=findRowIndexById_(marca,id);
  if(rowIdx===-1) return;
  var sheet=getSheetPorMarca_(marca);
  var idx=-1; for(var i=0;i<CAMPOS.length;i++){ if(CAMPOS[i].k==='historial'){ idx=i; break; } }
  var current=sheet.getRange(rowIdx,idx+1).getValue();
  var arr=[]; try{arr=current?JSON.parse(current):[];}catch(e){}
  arr.push({fecha:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM HH:mm'), texto:texto});
  sheet.getRange(rowIdx,idx+1).setValue(JSON.stringify(arr));
}

function armarCC_(r, config){
  var direcciones = [];
  var admin = (config.maestros.administrativos||[]).find(function(a){ return a && a.nombre===r.administrativo; });
  if(admin && admin.email) direcciones.push(admin.email);
  if(config.copiaSiempreA) direcciones.push(config.copiaSiempreA);
  return direcciones.join(',');
}

function enviarConfirmacion(marca, id, usuario){
  var config = getConfig();
  // Chequeo de usuarios autorizados desactivado por ahora (a pedido del usuario).
  var rowIdx = findRowIndexById_(marca, id);
  if(rowIdx===-1) return {ok:false, error:'No se encontró la entrega.'};
  var sheet = getSheetPorMarca_(marca);
  var row = sheet.getRange(rowIdx,1,1,CAMPOS.length).getValues()[0];
  var r = rowToObj_(row, marca);
  if(r.confirmado) return {ok:false, error:'Ya se había enviado la confirmación.'};
  var render = renderPlantilla_('confirmacion', r, config);
  MailApp.sendEmail({to:r.email, cc:armarCC_(r, config), subject:render.asunto, htmlBody:render.cuerpo, name:'Grupo París'});
  var ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  updateEntregaFields(marca, id, {confirmado:true, confirmadoPor:usuario, confirmadoFecha:ahora});
  agregarHistorialInterno_(marca, id, 'Confirmación enviada por '+usuario+'.');
  return {ok:true};
}

function enviarRecordatorio(marca, id, usuario){
  var config = getConfig();
  // Chequeo de usuarios autorizados desactivado por ahora (a pedido del usuario).
  var rowIdx = findRowIndexById_(marca, id);
  if(rowIdx===-1) return {ok:false, error:'No se encontró la entrega.'};
  var sheet = getSheetPorMarca_(marca);
  var row = sheet.getRange(rowIdx,1,1,CAMPOS.length).getValues()[0];
  var r = rowToObj_(row, marca);
  if(!r.confirmado) return {ok:false, error:'Todavía no se envió la confirmación de esta entrega.'};
  if(r.recordatorio==='enviado') return {ok:false, error:'Ya se había enviado el recordatorio.'};
  var render = renderPlantilla_('recordatorio', r, config);
  MailApp.sendEmail({to:r.email, cc:armarCC_(r, config), subject:render.asunto, htmlBody:render.cuerpo, name:'Grupo París'});
  var ahora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  updateEntregaFields(marca, id, {recordatorio:'enviado', recordatorioEnviadoPor:usuario, recordatorioFecha:ahora});
  agregarHistorialInterno_(marca, id, 'Recordatorio enviado por '+usuario+'.');
  return {ok:true};
}

// ============================================================
// ENVÍO AUTOMÁTICO DE RECORDATORIOS (corre solo, cada 30 min)
// Se instala solo la primera vez que corrés configurarPlanilla().
// ============================================================
function instalarTriggerRecordatorios_(){
  var yaExiste = ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction()==='revisarRecordatoriosAutomaticos'; });
  if(!yaExiste){
    ScriptApp.newTrigger('revisarRecordatoriosAutomaticos').timeBased().everyMinutes(30).create();
  }
}

function revisarRecordatoriosAutomaticos(){
  var config = getConfig();
  var ahora = new Date();
  var horaActual = ahora.getHours();
  if(horaActual < 9 || horaActual >= 18) return; // solo entre 09:00 y 18:00

  Object.keys(HOJAS).forEach(function(marca){
    var sheet = getSheetPorMarca_(marca);
    var lastRow = sheet.getLastRow();
    if(lastRow<2) return;
    var data = sheet.getRange(2,1,lastRow-1,CAMPOS.length).getValues();
    data.forEach(function(row, i){
      if(!row[0]) return;
      var r = rowToObj_(row, marca);
      if(!r.confirmado) return;                            // regla: hace falta la confirmación enviada
      if(r.recordatorio==='enviado') return;                // ya se mandó
      var partesFecha = (r.fecha||'').split('/');
      var partesHora = (r.hora||'').split(':');
      if(partesFecha.length!==3 || partesHora.length<2) return;
      var fechaEntrega = new Date(Number(partesFecha[2]), Number(partesFecha[1])-1, Number(partesFecha[0]), Number(partesHora[0]), Number(partesHora[1]));
      var msFaltantes = fechaEntrega.getTime() - ahora.getTime();
      var hs24 = 24*60*60*1000;
      // Solo si falta entre 0 y 24hs (nunca si la fecha ya pasó, evita reenvíos por error de reprogramación al pasado)
      if(msFaltantes > 0 && msFaltantes <= hs24){
        var render = renderPlantilla_('recordatorio', r, config);
        MailApp.sendEmail({to:r.email, cc:armarCC_(r, config), subject:render.asunto, htmlBody:render.cuerpo, name:'Grupo París'});
        var ahoraTexto = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
        updateEntregaFields(marca, r.id, {recordatorio:'enviado', recordatorioEnviadoPor:'Sistema (automático)', recordatorioFecha:ahoraTexto});
        agregarHistorialInterno_(marca, r.id, 'Recordatorio enviado automáticamente por el sistema.');
      }
    });
  });
}

// ============================================================
// AUTO-ID al pegar datos directamente en la planilla
// TRIGGER INSTALABLE — hay que activarlo a mano una sola vez
// desde el ícono de "Activadores" (reloj con alarma) en el
// editor de Apps Script:
//   1) Click en "+ Añadir activador"
//   2) Función a ejecutar: autoIdAlPegar
//   3) Fuente del evento: Desde la hoja de cálculo
//   4) Tipo de evento: Al editar
//   5) Guardar y autorizar permisos
// ============================================================
function autoIdAlPegar(e){
  try{
    if(!e || !e.range) return;
    var sheet = e.range.getSheet();
    var nombreHoja = sheet.getName();

    // Solo actuamos en las hojas de marcas (Chevrolet, Peugeot, Citroën, Honda, DFSK - Jetour)
    var esHojaDeMarca = Object.keys(HOJAS).some(function(m){ return HOJAS[m] === nombreHoja; });
    if(!esHojaDeMarca) return;

    var filaInicio = e.range.getRow();
    var filaFin = e.range.getLastRow();
    // Ignorar la fila de encabezado
    if(filaFin < 2) return;
    if(filaInicio < 2) filaInicio = 2;

    var ultimaCol = sheet.getLastColumn();
    var idColIdx = 1; // columna A = id

    for(var fila = filaInicio; fila <= filaFin; fila++){
      var idCell = sheet.getRange(fila, idColIdx);
      if(idCell.getValue()) continue; // ya tiene id, no tocar

      // ¿Esta fila tiene algún dato cargado (además del id)?
      var valoresFila = sheet.getRange(fila, 2, 1, ultimaCol - 1).getValues()[0];
      var tieneDatos = valoresFila.some(function(v){ return v !== '' && v !== null; });
      if(!tieneDatos) continue; // fila vacía, no generar id

      idCell.setValue(Utilities.getUuid()); // mismo criterio que addEntrega()
    }
  }catch(err){
    Logger.log('autoIdAlPegar error: ' + err);
  }
}

// ------------------------------------------------------------
// Función auxiliar: correr UNA SOLA VEZ a mano (▶ Ejecutar)
// para completar el ID de las filas viejas que ya estaban
// pegadas antes de instalar el trigger.
// ------------------------------------------------------------
function completarIdsFaltantes(){
  var total = 0;
  Object.keys(HOJAS).forEach(function(marca){
    var sheet = getSheetPorMarca_(marca);
    var lastRow = sheet.getLastRow();
    if(lastRow < 2) return;
    var ultimaCol = sheet.getLastColumn();
    var idRange = sheet.getRange(2, 1, lastRow-1, 1);
    var ids = idRange.getValues();
    var restoRange = sheet.getRange(2, 2, lastRow-1, ultimaCol-1);
    var resto = restoRange.getValues();
    for(var i=0; i<ids.length; i++){
      if(ids[i][0]) continue;
      var tieneDatos = resto[i].some(function(v){ return v !== '' && v !== null; });
      if(!tieneDatos) continue;
      ids[i][0] = Utilities.getUuid();
      total++;
    }
    idRange.setValues(ids);
  });
  SpreadsheetApp.getActiveSpreadsheet().toast('IDs completados: ' + total);
}

// ============================================================
// USUARIOS Y ROLES
// ------------------------------------------------------------
// Roles disponibles:
//   'calidad'        -> acceso total, incluido el Maestro, y puede
//                        gestionar usuarios (crear, resetear password, etc.)
//   'administrativo' -> puede cargar y editar entregas, confirmar,
//                        marcar recordatorios, regalo, kit, etc.
//                        NO tiene acceso al Maestro.
//   'vendedor'       -> solo lectura. No puede editar nada.
// ============================================================
var HOJA_USUARIOS = 'Usuarios';
var USUARIOS_HEADERS = ['Nombre','Usuario','PasswordHash','Salt','Rol','Activo','CreadoPor','FechaCreacion','Email','Modulos','UltimoIngreso','ResetToken','ResetTokenExpira','Sector','ModulosSoloVer'];
// Los roles ya NO condicionan qué módulos ve cada quien (eso lo maneja "Modulos" por usuario).
// El rol es solo una etiqueta descriptiva del puesto de la persona.
var ROLES_VALIDOS = ['calidad','maestro','administrativo','vendedor','tv','recepcion','supervisor','logistica','supervisor_logistica'];

function getOrCrearHojaUsuarios_(){
  var ss = getSS_();
  var sheet = ss.getSheetByName(HOJA_USUARIOS);
  if(!sheet){
    sheet = ss.insertSheet(HOJA_USUARIOS);
    sheet.getRange(1,1,1,USUARIOS_HEADERS.length).setValues([USUARIOS_HEADERS]);
    sheet.setFrozenRows(1);
  }
  // Migración: si la hoja ya existía de antes (sin la columna "Modulos" al final), se la agregamos sola.
  var colsActuales = sheet.getLastColumn();
  if(colsActuales < USUARIOS_HEADERS.length){
    sheet.getRange(1, colsActuales+1, 1, USUARIOS_HEADERS.length-colsActuales).setValues([USUARIOS_HEADERS.slice(colsActuales)]);
  }
  // Bootstrap: si está vacía, crear un usuario 'calidad' inicial para poder entrar.
  // Usuario: admin / Contraseña inicial: Grupo2024 (cambiarla enseguida desde el Maestro).
  if(sheet.getLastRow() < 2){
    var salt = Utilities.getUuid();
    var hash = hashPassword_('Grupo2024', salt);
    sheet.appendRow(['Administrador','admin', hash, salt, 'calidad', true, 'sistema', new Date().toISOString(), '', '', '']);
  }
  return sheet;
}

function hashPassword_(password, salt){
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password)+'|'+String(salt));
  return raw.map(function(b){ var v=(b<0?b+256:b).toString(16); return v.length===1?'0'+v:v; }).join('');
}

function filaUsuarios_(){
  var sheet = getOrCrearHojaUsuarios_();
  var lastRow = sheet.getLastRow();
  if(lastRow < 2) return [];
  return sheet.getRange(2,1,lastRow-1, USUARIOS_HEADERS.length).getValues().map(function(r, i){
    var ultimoIngreso = r[10] || '';
    var online = false;
    if(ultimoIngreso){
      var minutosDesde = (new Date().getTime() - new Date(ultimoIngreso).getTime()) / 60000;
      online = minutosDesde < 5; // "conectado" = tuvo actividad en los últimos 5 minutos
    }
    return {
      fila: i+2,
      nombre: r[0], usuario: String(r[1]||'').trim().toLowerCase(), passwordHash: r[2], salt: r[3],
      rol: r[4], activo: (r[5]===true || r[5]==='TRUE' || r[5]===1), creadoPor: r[6], fechaCreacion: r[7],
      email: r[8] || '',
      modulos: String(r[9]||'').split(',').map(function(m){return m.trim();}).filter(function(m){return m;}),
      ultimoIngreso: ultimoIngreso, online: online,
      resetToken: r[11] || '', resetTokenExpira: r[12] || '', sector: r[13] || '',
      modulosSoloVer: String(r[14]||'').split(',').map(function(m){return m.trim();}).filter(function(m){return m;})
    };
  });
}

function buscarUsuario_(usuario){
  var u = String(usuario||'').trim().toLowerCase();
  return filaUsuarios_().find(function(x){ return x.usuario===u; }) || null;
}

// Verifica usuario+password. Devuelve el registro del usuario si es válido, o null.
// Busca por nombre de usuario O por email (para el login flexible).
// Para acciones administrativas (donde el actor ya viene de la sesión
// con su usuario real) esto no cambia nada, porque ahí nunca se pasa
// un email en el parámetro "usuario".
function buscarUsuarioPorLogin_(identificador){
  var val = String(identificador||'').trim().toLowerCase();
  return filaUsuarios_().find(function(x){
    return x.usuario===val || (x.email && String(x.email).trim().toLowerCase()===val);
  }) || null;
}

function verificarCredenciales_(usuario, password){
  var u = buscarUsuarioPorLogin_(usuario);
  if(!u || !u.activo) return null;
  var hash = hashPassword_(password, u.salt);
  if(hash !== u.passwordHash) return null;
  return u;
}

function login_(usuario, password){
  var u = verificarCredenciales_(usuario, password);
  if(!u) return {error: 'Usuario o contraseña incorrectos, o usuario inactivo.'};
  marcarUltimoIngreso_(u.usuario);
  return {ok:true, nombre:u.nombre, usuario:u.usuario, rol:u.rol, modulos:u.modulos||[], sector:u.sector||'', modulosSoloVer:u.modulosSoloVer||[]};
}

function cambiarPassword_(usuario, passwordActual, passwordNueva){
  var u = verificarCredenciales_(usuario, passwordActual);
  if(!u) return {error: 'Usuario o contraseña actual incorrectos.'};
  if(!passwordNueva || String(passwordNueva).length < 4) return {error:'La contraseña nueva es muy corta.'};
  var sheet = getOrCrearHojaUsuarios_();
  var nuevoSalt = Utilities.getUuid();
  var nuevoHash = hashPassword_(passwordNueva, nuevoSalt);
  sheet.getRange(u.fila, 3).setValue(nuevoHash);
  sheet.getRange(u.fila, 4).setValue(nuevoSalt);
  return {ok:true};
}

// Actualiza la fecha/hora del último ingreso, para el indicador de Online/Offline.
// Usa la columna "UltimoIngreso" (se crea sola si no existe, ver migración en getOrCrearHojaUsuarios_).
function marcarUltimoIngreso_(usuario){
  try{
    var sheet = getOrCrearHojaUsuarios_();
    var u = buscarUsuario_(usuario);
    if(!u) return;
    var colUltimoIngreso = USUARIOS_HEADERS.indexOf('UltimoIngreso') + 1;
    sheet.getRange(u.fila, colUltimoIngreso).setValue(new Date().toISOString());
  }catch(e){ /* no interrumpe el login si esto falla */ }
}

// Ahora dan autoridad de Maestro: rol "calidad" (legacy), rol "maestro" (nuevo),
// o directamente tener el módulo "maestro" habilitado en Modulos — así los roles
// ya no "encierran" los permisos, son solo una etiqueta; lo que manda es Modulos.
function requiereCalidad_(actorUsuario, actorPassword){
  var actor = verificarCredenciales_(actorUsuario, actorPassword);
  if(!actor) throw new Error('Credenciales inválidas.');
  var tieneAutoridad = (actor.rol === 'calidad' || actor.rol === 'maestro' || (actor.modulos||[]).indexOf('maestro') > -1);
  if(!tieneAutoridad) throw new Error('No tenés permiso para esta acción (necesitás el módulo Maestro).');
  return actor;
}

function etiquetaRol_(rol){
  var etiquetas = {
    calidad: 'Calidad',
    maestro: 'Maestro',
    administrativo: 'Administrativo',
    vendedor: 'Vendedor (solo lectura)',
    tv: 'TV Recepción',
    recepcion: 'Recepción',
    supervisor: 'Supervisor'
  };
  return etiquetas[rol] || rol;
}

// Genera un token de acceso único (válido 48hs) para que la persona elija
// su propia contraseña, en vez de mandarle una por mail.
function generarTokenReset_(usuarioRow){
  var sheet = getOrCrearHojaUsuarios_();
  var token = Utilities.getUuid();
  var expira = new Date(Date.now() + 48*60*60*1000).toISOString();
  var colToken = USUARIOS_HEADERS.indexOf('ResetToken')+1;
  var colExpira = USUARIOS_HEADERS.indexOf('ResetTokenExpira')+1;
  sheet.getRange(usuarioRow.fila, colToken).setValue(token);
  sheet.getRange(usuarioRow.fila, colExpira).setValue(expira);
  return token;
}

// Manda un link para elegir contraseña — a propósito NO manda ninguna
// contraseña en texto, porque eso es justo el patrón que los filtros
// de seguridad corporativos (Google Workspace, etc.) suelen bloquear
// en silencio por parecer un mail de phishing.
function enviarMailInvitacion_(nombre, usuario, token, email, esNuevo){
  if(!email) return;
  var LINK_PLATAFORMA = 'https://planning-grupoparis.vercel.app/';
  var linkConToken = LINK_PLATAFORMA + '?u=' + encodeURIComponent(usuario) + '&token=' + encodeURIComponent(token);
  var asunto = esNuevo ? 'Tu acceso al Planning de Entregas — Grupo París' : 'Recuperá tu acceso — Planning de Entregas';
  var intro = esNuevo
    ? 'Hola '+nombre+', ya tenés acceso al sistema de Planning de Entregas de Grupo París. Tu usuario es: <b>'+usuario+'</b>.'
    : 'Hola '+nombre+', pediste recuperar tu acceso al Planning de Entregas. Tu usuario es: <b>'+usuario+'</b>.';
  var cuerpo =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;">'+
    '<p>'+intro+'</p>'+
    '<p>Para elegir tu contraseña, entrá a este link (válido por 48 horas):</p>'+
    '<p><a href="'+linkConToken+'">'+linkConToken+'</a></p>'+
    '<p style="font-size:12px;color:#666;">Si no pediste esto, podés ignorar este mail.</p>'+
    '</div>';
  MailApp.sendEmail({to:email, subject:asunto, htmlBody:cuerpo, name:'Grupo París'});
}

// Acción nueva: la persona usa el link del mail para elegir su propia
// contraseña. Valida que el token exista, coincida y no esté vencido.
function establecerPasswordConToken_(usuario, token, passwordNueva){
  var u = buscarUsuario_(usuario);
  if(!u) return {error:'Usuario no encontrado.'};
  if(!u.resetToken || String(u.resetToken)!==String(token)) return {error:'Este link no es válido o ya fue usado.'};
  if(!u.resetTokenExpira || new Date(u.resetTokenExpira).getTime() < Date.now()) return {error:'Este link venció. Pedí que te reenvíen el acceso.'};
  if(!passwordNueva || String(passwordNueva).length < 4) return {error:'La contraseña es muy corta.'};
  var sheet = getOrCrearHojaUsuarios_();
  var nuevoSalt = Utilities.getUuid();
  var nuevoHash = hashPassword_(passwordNueva, nuevoSalt);
  sheet.getRange(u.fila, 3).setValue(nuevoHash);
  sheet.getRange(u.fila, 4).setValue(nuevoSalt);
  var colToken = USUARIOS_HEADERS.indexOf('ResetToken')+1;
  var colExpira = USUARIOS_HEADERS.indexOf('ResetTokenExpira')+1;
  sheet.getRange(u.fila, colToken).setValue('');
  sheet.getRange(u.fila, colExpira).setValue('');
  return {ok:true};
}

function enviarMailCredenciales_(nombre, usuario, password, email, esNuevo){
  if(!email) return;
  var LINK_PLATAFORMA = 'https://planning-grupoparis.vercel.app/';
  var asunto = esNuevo ? 'Tu acceso al Planning de Entregas — Grupo París' : 'Tu contraseña fue restablecida — Planning de Entregas';
  var intro = esNuevo
    ? 'Hola '+nombre+', ya tenés acceso al sistema de Planning de Entregas de Grupo París.'
    : 'Hola '+nombre+', tu contraseña del Planning de Entregas fue restablecida.';
  var cuerpo =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;">'+
    '<p>'+intro+'</p>'+
    '<p style="background:#f4f4f4;border-radius:8px;padding:14px 16px;">'+
    '<b>Usuario:</b> '+usuario+'<br>'+
    '<b>Contraseña:</b> '+password+
    '</p>'+
    '<p><a href="'+LINK_PLATAFORMA+'" style="background:#E8A33D;color:#1a1a1a;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Entrar al Planning de Entregas</a></p>'+
    '<p style="font-size:12px;color:#666;">O copiá este link: '+LINK_PLATAFORMA+'</p>'+
    '<p>Te recomendamos cambiar la contraseña la primera vez que entres.</p>'+
    '</div>';
  MailApp.sendEmail({to:email, subject:asunto, htmlBody:cuerpo, name:'Grupo París'});
}

function listarUsuarios_(actorUsuario, actorPassword){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  var lista = filaUsuarios_().map(function(u){
    return {nombre:u.nombre, usuario:u.usuario, rol:u.rol, activo:u.activo, creadoPor:u.creadoPor, fechaCreacion:u.fechaCreacion, email:u.email, modulos:u.modulos, ultimoIngreso:u.ultimoIngreso, online:u.online, sector:u.sector, modulosSoloVer:u.modulosSoloVer};
  });
  return {ok:true, usuarios:lista};
}
// Heartbeat liviano — lo llama el frontend cada dos minutos mientras la
// persona tiene la app abierta, para que "online" refleje actividad real
// y no solo el momento del login (antes, a los 5 minutos de haber
// entrado ya figuraba offline aunque siguiera usando el sistema).
function registrarActividad_(usuario, password){
  var u = verificarCredenciales_(usuario, password);
  if(!u) return {ok:false};
  var sheet = getOrCrearHojaUsuarios_();
  sheet.getRange(u.fila, 11).setValue(new Date().toISOString()); // columna "ÚltimoIngreso" (K)
  return {ok:true};
}

function crearUsuario_(actorUsuario, actorPassword, nombre, usuario, password, rol, email, modulos, sector, modulosSoloVer){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  if(!nombre || !usuario || !password) return {error:'Faltan datos (nombre, usuario o contraseña).'};
  if(ROLES_VALIDOS.indexOf(rol) === -1) return {error:'Rol inválido. Debe ser: '+ROLES_VALIDOS.join(', ')};
  if(String(password).length < 4) return {error:'La contraseña es muy corta.'};
  if(buscarUsuario_(usuario)) return {error:'Ya existe un usuario con ese nombre de usuario.'};
  var sheet = getOrCrearHojaUsuarios_();
  var salt = Utilities.getUuid();
  var hash = hashPassword_(password, salt);
  var modulosTexto = (modulos||[]).join(',');
  sheet.appendRow([nombre, String(usuario).trim().toLowerCase(), hash, salt, rol, true, actorUsuario, new Date().toISOString(), email||'', modulosTexto, '', '', '', sector||'', (modulosSoloVer||[]).join(',')]);
  var mailError = null;
  if(email){
    try{
      var uCreado = buscarUsuario_(usuario);
      var token = generarTokenReset_(uCreado);
      enviarMailInvitacion_(nombre, usuario, token, email, true);
    }catch(mailErr){
      mailError = String(mailErr.message||mailErr);
      console.log('Error al enviar mail de invitación a "'+email+'": '+mailError);
    }
  }
  return {ok:true, mailError:mailError, quotaRestante:MailApp.getRemainingDailyQuota()};
}

function editarUsuario_(actorUsuario, actorPassword, usuarioObjetivo, nombre, email, rol, modulos, sector, modulosSoloVer){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
    var u = buscarUsuario_(usuarioObjetivo);
    if(!u) return {error:'No existe ese usuario ("'+usuarioObjetivo+'").'};
    if(!nombre) return {error:'Falta el nombre.'};
    if(ROLES_VALIDOS.indexOf(rol) === -1) return {error:'Rol inválido ("'+rol+'"). Debe ser: '+ROLES_VALIDOS.join(', ')};
    var sheet = getOrCrearHojaUsuarios_();
    sheet.getRange(u.fila, 1).setValue(nombre);       // Nombre
    sheet.getRange(u.fila, 5).setValue(rol);          // Rol
    sheet.getRange(u.fila, 9).setValue(email||'');    // Email
    // Los módulos/permisos ahora se editan aparte, desde el modal de
    // Permisos — esta edición rápida (nombre/rol/email/sector) no debe
    // pisarlos. Si no vienen en el pedido (undefined), no se tocan.
    if(modulos!==undefined && modulos!==null) sheet.getRange(u.fila, 10).setValue((modulos||[]).join(','));
    sheet.getRange(u.fila, 14).setValue(sector||'');  // Sector
    if(modulosSoloVer!==undefined && modulosSoloVer!==null) sheet.getRange(u.fila, 15).setValue((modulosSoloVer||[]).join(','));
    return {ok:true};
  }catch(err){
    return {error:'Error al editar usuario: '+String(err.message||err)};
  }
}

// Solo cambia si un módulo es de solo-lectura o edición completa para un
// usuario — sin tocar el resto de sus permisos ni pedirle todos los demás
// datos de nuevo. Lo usa el toggle rápido de la fila de íconos en Permisos.
function toggleSoloVerModulo_(actorUsuario, actorPassword, usuarioObjetivo, modulo, soloVer){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
    var u = buscarUsuario_(usuarioObjetivo);
    if(!u) return {error:'No existe ese usuario ("'+usuarioObjetivo+'").'};
    var lista = u.modulosSoloVer || [];
    var idx = lista.indexOf(modulo);
    if(soloVer && idx===-1) lista.push(modulo);
    if(!soloVer && idx>-1) lista.splice(idx,1);
    var sheet = getOrCrearHojaUsuarios_();
    sheet.getRange(u.fila, 15).setValue(lista.join(','));
    return {ok:true};
  }catch(err){
    return {error:'Error al actualizar el permiso: '+String(err.message||err)};
  }
}

function resetPassword_(actorUsuario, actorPassword, usuarioObjetivo, passwordNueva){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  var u = buscarUsuario_(usuarioObjetivo);
  if(!u) return {error:'No existe ese usuario.'};
  if(!passwordNueva || String(passwordNueva).length < 4) return {error:'La contraseña nueva es muy corta.'};
  var sheet = getOrCrearHojaUsuarios_();
  var nuevoSalt = Utilities.getUuid();
  var nuevoHash = hashPassword_(passwordNueva, nuevoSalt);
  sheet.getRange(u.fila, 3).setValue(nuevoHash);
  sheet.getRange(u.fila, 4).setValue(nuevoSalt);
  var mailError = null;
  if(u.email){
    try{
      MailApp.sendEmail({
        to:u.email,
        subject:'Tu contraseña fue actualizada — Planning de Entregas',
        htmlBody:'<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">'+
          '<p>Hola '+u.nombre+', un Maestro actualizó tu contraseña de acceso al Planning de Entregas.</p>'+
          '<p>Pedísela directamente a quien te la cambió, o entrá a la web y usá "Olvidé mi contraseña" con tu usuario (<b>'+u.usuario+'</b>) para elegir una vos mismo.</p>'+
          '</div>',
        name:'Grupo París'
      });
    }catch(mailErr){
      mailError = String(mailErr.message||mailErr);
      console.log('Error al avisar reset de contraseña a "'+u.email+'": '+mailError);
    }
  }
  return {ok:true, mailError:mailError};
}

// Elimina definitivamente la fila del usuario. Solo Maestro puede hacerlo,
// y no se puede eliminar a uno mismo (para no quedarse afuera sin querer).
function eliminarUsuario_(actorUsuario, actorPassword, usuarioObjetivo){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  if(String(usuarioObjetivo||'').trim().toLowerCase() === String(actorUsuario||'').trim().toLowerCase()){
    return {error:'No te podés eliminar a vos mismo.'};
  }
  var u = buscarUsuario_(usuarioObjetivo);
  if(!u) return {error:'No existe ese usuario.'};
  var sheet = getOrCrearHojaUsuarios_();
  sheet.deleteRow(u.fila);
  return {ok:true};
}

// Como la contraseña se guarda hasheada (no se puede "recuperar" la de
// antes), reenviar credenciales en realidad genera una contraseña nueva
// y se la manda por mail — mismo mecanismo que "Olvidé mi contraseña",
// pero disparado por un Maestro desde el panel en vez de por el usuario.
function reenviarCredenciales_(actorUsuario, actorPassword, usuarioObjetivo){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  var u = buscarUsuario_(usuarioObjetivo);
  if(!u) return {error:'No existe ese usuario.'};
  if(!u.email) return {error:'Este usuario no tiene email cargado.'};
  var mailError = null;
  try{
    var token = generarTokenReset_(u);
    enviarMailInvitacion_(u.nombre, u.usuario, token, u.email, false);
  }catch(mailErr){
    mailError = String(mailErr.message||mailErr);
    console.log('Error al reenviar invitación a "'+u.email+'": '+mailError);
  }
  return {ok:true, mailError:mailError};
}

// Autoservicio: alguien que no puede entrar pide una contraseña nueva.
// No requiere estar logueado — solo su nombre de usuario. Genera una
// contraseña aleatoria, la guarda, y se la manda por mail si tiene uno
// cargado. Siempre devuelve el mismo mensaje genérico (exista o no el
// usuario) para no delatar qué usuarios existen.
function olvidePassword_(usuario){
  var u = buscarUsuarioPorLogin_(usuario);
  var MENSAJE_GENERICO = {ok:true, mensaje:'Si el usuario existe y tiene un email cargado, le va a llegar un link para elegir una contraseña nueva.'};
  if(!u || !u.activo || !u.email) return MENSAJE_GENERICO;
  try{
    var token = generarTokenReset_(u);
    enviarMailInvitacion_(u.nombre, u.usuario, token, u.email, false);
  }catch(mailErr){
    console.log('Error al enviar link de recuperación a "'+u.email+'": '+String(mailErr.message||mailErr));
  }
  return MENSAJE_GENERICO;
}

function desactivarUsuario_(actorUsuario, actorPassword, usuarioObjetivo, activo){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  var u = buscarUsuario_(usuarioObjetivo);
  if(!u) return {error:'No existe ese usuario.'};
  var sheet = getOrCrearHojaUsuarios_();
  sheet.getRange(u.fila, 6).setValue(activo !== false);
  return {ok:true};
}

// ============================================================
// ALERTA: accesorio pendiente de colocar, 24hs antes de la entrega
// ------------------------------------------------------------
// Se ejecuta una vez por día (hay que instalar el disparador — ver
// instalarTriggerAlertaAccesorios() más abajo, se corre UNA sola vez
// a mano desde el editor de Apps Script). Revisa las entregas de
// mañana; si el accesorio está pendiente de colocar, avisa por mail.
// Si ya está colocado, no manda nada. El destinatario se configura
// por marca desde Maestro > Configuración (CONFIG.alertaAccesoriosEmails).
// Si una marca no tiene email configurado, se usa MAIL_ALERTA_ACCESORIOS_DEFAULT.
// ============================================================
var MAIL_ALERTA_ACCESORIOS_DEFAULT = 'Milagros.ventimiglia@parisautos.com.ar';
var LINK_SERVICEBOX = 'https://servicebox.mpsa.com/';

function alertaAccesoriosPendientes24h(){
  var manana = new Date();
  manana.setDate(manana.getDate()+1);
  var mananaStr = Utilities.formatDate(manana, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  var entregas = getEntregas();
  var pendientes = entregas.filter(function(r){
    return r.fecha === mananaStr && r.accesorios && !r.accesoriosColocado;
  });
  if(pendientes.length===0) return;

  var config = getConfig();
  var emailsPorMarca = (config && config.alertaAccesoriosEmails) || {};
  var fechaHoraEnvio = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM HH:mm');

  // Agrupar por marca, para mandarle a cada una su propio mail con sus propios destinatarios.
  var porMarca = {};
  pendientes.forEach(function(r){
    if(!porMarca[r.marca]) porMarca[r.marca] = [];
    porMarca[r.marca].push(r);
  });

  Object.keys(porMarca).forEach(function(marca){
    var filas = porMarca[marca];
    var destinatarios = (emailsPorMarca[marca] || MAIL_ALERTA_ACCESORIOS_DEFAULT).trim();
    if(!destinatarios) return;

    var filasHtml = filas.map(function(r){
      return '<tr>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.hora+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.cliente+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.modelo+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+(r.dominio||'—')+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+(r.chasis||'—')+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.accesorios+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+(r.sucursal||'—')+'</td>'+
      '</tr>';
    }).join('');

    var cuerpo =
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">'+
      '<p>Hay '+filas.length+' entrega(s) de <b>'+(MARCA_LABEL[marca]||marca)+'</b> programadas para <b>mañana ('+mananaStr+')</b> con el accesorio todavía <b>pendiente de colocar</b>:</p>'+
      '<table style="border-collapse:collapse;width:100%;">'+
        '<tr style="background:#f4f4f4;">'+
          '<th style="text-align:left;padding:6px 10px;">Hora</th>'+
          '<th style="text-align:left;padding:6px 10px;">Cliente</th>'+
          '<th style="text-align:left;padding:6px 10px;">Modelo</th>'+
          '<th style="text-align:left;padding:6px 10px;">Dominio</th>'+
          '<th style="text-align:left;padding:6px 10px;">VIN</th>'+
          '<th style="text-align:left;padding:6px 10px;">Accesorio</th>'+
          '<th style="text-align:left;padding:6px 10px;">Sucursal</th>'+
        '</tr>'+
        filasHtml+
      '</table>'+
      '<p style="margin-top:16px;"><a href="'+LINK_SERVICEBOX+'" style="background:#E8A33D;color:#1a1a1a;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Abrir ServiceBox</a></p>'+
      '</div>';

    MailApp.sendEmail({
      to: destinatarios,
      subject: '⚠ Accesorios pendientes — '+(MARCA_LABEL[marca]||marca)+' — entregas de mañana ('+mananaStr+')',
      htmlBody: cuerpo,
      name: 'Grupo París — Planning de Entregas'
    });

    // Queda registrado en cada entrega, así se sabe desde la web si el aviso se mandó.
    filas.forEach(function(r){
      try{ agregarHistorial(r.marca, r.id, '📧 Aviso de accesorio pendiente (24hs antes) enviado a '+destinatarios+' — '+fechaHoraEnvio); }catch(e){}
    });
  });
}

// ------------------------------------------------------------
// Igual que alertaAccesoriosPendientes24h, pero para Campañas — revisa
// las entregas de mañana; si la campaña está pendiente de controlar,
// avisa por mail. El destinatario se configura por marca desde
// Maestro > Configuración (CONFIG.alertaCampanasEmails).
// ------------------------------------------------------------
function alertaCampanasPendientes24h(){
  var manana = new Date();
  manana.setDate(manana.getDate()+1);
  var mananaStr = Utilities.formatDate(manana, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  var entregas = getEntregas();
  var pendientes = entregas.filter(function(r){
    return r.fecha === mananaStr && r.campanaTexto && !r.campanaControlada;
  });
  if(pendientes.length===0) return;

  var config = getConfig();
  var emailsPorMarca = (config && config.alertaCampanasEmails) || {};
  var fechaHoraEnvio = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM HH:mm');

  var porMarca = {};
  pendientes.forEach(function(r){
    if(!porMarca[r.marca]) porMarca[r.marca] = [];
    porMarca[r.marca].push(r);
  });

  Object.keys(porMarca).forEach(function(marca){
    var filas = porMarca[marca];
    var destinatarios = (emailsPorMarca[marca] || MAIL_ALERTA_ACCESORIOS_DEFAULT).trim();
    if(!destinatarios) return;

    var filasHtml = filas.map(function(r){
      return '<tr>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.hora+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.cliente+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.modelo+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+(r.dominio||'—')+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+(r.chasis||'—')+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+r.campanaTexto+'</td>'+
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">'+(r.sucursal||'—')+'</td>'+
      '</tr>';
    }).join('');

    var cuerpo =
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">'+
      '<p>Hay '+filas.length+' entrega(s) de <b>'+(MARCA_LABEL[marca]||marca)+'</b> programadas para <b>mañana ('+mananaStr+')</b> con la campaña todavía <b>pendiente de controlar</b>:</p>'+
      '<table style="border-collapse:collapse;width:100%;">'+
        '<tr style="background:#f4f4f4;">'+
          '<th style="text-align:left;padding:6px 10px;">Hora</th>'+
          '<th style="text-align:left;padding:6px 10px;">Cliente</th>'+
          '<th style="text-align:left;padding:6px 10px;">Modelo</th>'+
          '<th style="text-align:left;padding:6px 10px;">Dominio</th>'+
          '<th style="text-align:left;padding:6px 10px;">VIN</th>'+
          '<th style="text-align:left;padding:6px 10px;">Campaña</th>'+
          '<th style="text-align:left;padding:6px 10px;">Sucursal</th>'+
        '</tr>'+
        filasHtml+
      '</table>'+
      '<p style="margin-top:16px;"><a href="'+LINK_SERVICEBOX+'" style="background:#E8A33D;color:#1a1a1a;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Abrir ServiceBox</a></p>'+
      '</div>';

    MailApp.sendEmail({
      to: destinatarios,
      subject: '⚠ Campaña pendiente — '+(MARCA_LABEL[marca]||marca)+' — entregas de mañana ('+mananaStr+')',
      htmlBody: cuerpo,
      name: 'Grupo París — Planning de Entregas'
    });

    filas.forEach(function(r){
      try{ agregarHistorial(r.marca, r.id, '📧 Aviso de campaña pendiente (24hs antes) enviado a '+destinatarios+' — '+fechaHoraEnvio); }catch(e){}
    });
  });
}
// Correr ESTA función una sola vez a mano, igual que con la de accesorios.
function instalarTriggerAlertaCampanas(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='alertaCampanasPendientes24h') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('alertaCampanasPendientes24h')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
}

// Correr ESTA función una sola vez a mano (desde el editor de Apps Script,
// seleccionarla en el desplegable de arriba y apretar ▶ Ejecutar) para que
// quede instalado el aviso automático de todos los días a las 9am.
function instalarTriggerAlertaAccesorios(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='alertaAccesoriosPendientes24h') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('alertaAccesoriosPendientes24h')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
}


// ============================================================
// A PARTIR DE ACÁ: motor de Automatizaciones (WhatsApp + Email
// post-entrega) — se puede dejar en este mismo archivo o moverlo
// a un archivo .gs aparte, es indistinto, funciona igual.
// ============================================================
// ============================================================
// MOTOR DE AUTOMATIZACIONES — Comunicaciones post-entrega
// ============================================================
// Qué hace:
//  1) Cada vez que corre (via trigger de tiempo), busca entregas marcadas
//     "Entregada" que ya pasaron las horas configuradas (24hs WhatsApp,
//     48hs Email) y todavía no tienen una comunicación de ese canal enviada.
//  2) Envía el mensaje/mail correspondiente, reemplazando las variables.
//  3) Registra TODO en una hoja nueva llamada "Comunicaciones" —
//     esa hoja es la que alimenta la pantalla de Historial en la web.
//
// CÓMO INSTALAR:
//  1) Pegá este archivo como un archivo .gs nuevo en tu proyecto de Apps
//     Script (Archivo → Nuevo → Script), NO lo mezcles con tu código
//     principal para que sea fácil de encontrar y mantener.
//  2) Corré UNA VEZ, a mano desde el editor, la función
//     "configurarHojaComunicaciones" (crea la hoja con los encabezados).
//  3) Corré UNA VEZ, a mano, la función "crearTriggerAutomatizaciones"
//     (esto deja el motor corriendo solo cada 15 minutos, de ahí en más
//     no hace falta tocar nada).
//  4) Todo lo demás (activar/desactivar, horas, plantilla, marcas) se
//     maneja desde la pantalla "Automatizaciones" de la web, sin código.
// ============================================================

var HOJA_COMUNICACIONES = 'Comunicaciones';
var COLUMNAS_COMUNICACIONES = [
  'id','marca','entregaId','cliente','modelo','patente','vin','vendedor',
  'sucursal','fechaEntrega','canal','fechaHoraProgramada','fechaHoraEnvio',
  'estado','intentos','usuarioManual','motivoError','mensajeEnviado'
];

// ---- Punto de entrada del trigger (correr cada 15 min) ----
function ejecutarAutomatizaciones(){
  var config = leerConfigCompleta_(); // función que ya existe en tu código principal
  var auto = config.automatizaciones;
  if(!auto) return;

  var entregas = leerTodasLasEntregas_(); // función que ya existe en tu código principal
  var ahora = new Date();

  entregas.forEach(function(r){
    if(!r.entregada) return;

    // WhatsApp queda MANUAL a propósito — el cliente elige y toca el botón desde la web,
    // no se manda solo. Solo Email corre automático acá.
    if(auto.email && auto.email.activo && auto.email.marcas.indexOf(r.marca)>-1){
      procesarComunicacion_(r, 'email', auto.email, ahora, config);
    }
  });
}

function procesarComunicacion_(r, canal, configCanal, ahora, configCompleto){
  // r.entregadaFecha debe existir en tu esquema (fecha en que se marcó "Entregada").
  // Si tu campo se llama distinto, cambiá esta línea nada más.
  var fechaBase = parsearFechaHora_(r.entregadaFecha || r.fecha);
  if(!fechaBase) return;

  var horasPasadas = (ahora.getTime() - fechaBase.getTime()) / (1000*60*60);
  if(horasPasadas < configCanal.horas) return; // todavía no llegó la hora

  var existente = buscarComunicacionExistente_(r.marca, r.id, canal);
  if(existente && (existente.estado==='Enviada' || existente.estado==='Cancelada')) return; // ya resuelta
  if(existente && existente.intentos >= configCanal.reintentos && existente.estado==='Error') return; // se agotaron los reintentos

  var intentos = existente ? existente.intentos+1 : 1;

  try{
    if(canal==='whatsapp'){
      var mensaje = reemplazarVariablesServidor_(configCanal.template, r);
      enviarWhatsApp_(configCanal, r.telefono, mensaje);
      registrarComunicacion_(r, canal, 'Enviada', intentos, '', mensaje);
    } else if(canal==='email'){
      var asunto = reemplazarVariablesServidor_(configCanal.asunto, r);
      enviarEmailPostEntrega_(r, asunto, configCompleto); // ya conectada, con tu HTML calcado de la captura
      registrarComunicacion_(r, canal, 'Enviada', intentos, '', '');
    }
  } catch(err){
    registrarComunicacion_(r, canal, 'Error', intentos, String(err), '');
  }
}

// ---- Envío de WhatsApp: genérico para cualquier proveedor ----
function enviarWhatsApp_(configWhatsapp, telefono, mensaje){
  if(!telefono) throw new Error('El cliente no tiene teléfono cargado');
  var proveedor = configWhatsapp.proveedor;
  var payload, headers, url;

  if(proveedor==='meta'){
    url = configWhatsapp.url; // ej: https://graph.facebook.com/v20.0/TU_NUMERO_ID/messages
    headers = {'Authorization':'Bearer '+configWhatsapp.token, 'Content-Type':'application/json'};
    payload = JSON.stringify({messaging_product:'whatsapp', to:telefono, type:'text', text:{body:mensaje}});
  } else if(proveedor==='twilio'){
    url = configWhatsapp.url; // ej: https://api.twilio.com/2010-04-01/Accounts/SID/Messages.json
    var auth = Utilities.base64Encode(configWhatsapp.numero+':'+configWhatsapp.token);
    headers = {'Authorization':'Basic '+auth};
    payload = 'From=whatsapp:'+configWhatsapp.numero+'&To=whatsapp:'+telefono+'&Body='+encodeURIComponent(mensaje);
  } else if(proveedor==='evolution'){
    url = configWhatsapp.url; // ej: https://tu-servidor-evolution.com/message/sendText/instancia
    headers = {'apikey':configWhatsapp.apiKey, 'Content-Type':'application/json'};
    payload = JSON.stringify({number:telefono, text:mensaje});
  } else if(proveedor==='360dialog'){
    url = configWhatsapp.url;
    headers = {'D360-API-KEY':configWhatsapp.apiKey, 'Content-Type':'application/json'};
    payload = JSON.stringify({to:telefono, type:'text', text:{body:mensaje}});
  } else {
    throw new Error('Todavía no elegiste un proveedor de WhatsApp en Configuración → Automatizaciones');
  }

  var respuesta = UrlFetchApp.fetch(url, {
    method:'post', headers:headers, payload:payload,
    muteHttpExceptions:true, contentType: proveedor==='twilio' ? 'application/x-www-form-urlencoded' : 'application/json'
  });
  var codigo = respuesta.getResponseCode();
  if(codigo<200 || codigo>=300) throw new Error('WhatsApp respondió '+codigo+': '+respuesta.getContentText());
}

// ---- Reemplazo de variables (mismo criterio que en la web) ----
function reemplazarVariablesServidor_(texto, r){
  var partesNombre = (r.cliente||'').trim().split(' ');
  var nombre = partesNombre[0]||'';
  var apellido = partesNombre.slice(1).join(' ')||'';
  var mapa = {
    '{Nombre}':nombre, '{Apellido}':apellido, '{NombreCompleto}':r.cliente||'',
    '{Marca}':r.marca||'', '{Modelo}':r.modelo||'', '{Versión}':r.version||'', '{Patente}':r.dominio||'',
    '{VIN}':r.chasis||'', '{FechaEntrega}':r.fecha||'', '{Vendedor}':r.vendedor||'',
    '{Sucursal}':r.sucursal||'', '{Celular}':r.telefono||'', '{Email}':r.email||'',
    '{Entidad}':nombreEntidadPorMarca_(r.marca)
  };
  var resultado = texto;
  Object.keys(mapa).forEach(function(k){ resultado = resultado.split(k).join(mapa[k]); });
  return resultado;
}

// ---- Registro en la hoja "Comunicaciones" (alimenta el Historial web) ----
// Registra un envío MANUAL (por ejemplo el mensaje de Bienvenida, mandado por WhatsApp
// a mano por el usuario) en la misma hoja "Comunicaciones", para que aparezca en el
// Historial de Comunicaciones de la web junto con los envíos automáticos.
function registrarComunicacionManual_(p){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_COMUNICACIONES);
  if(!hoja) return {error:'No existe la hoja Comunicaciones. Corré configurarHojaComunicaciones primero.'};
  var id = Utilities.getUuid();
  var ahoraTexto = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  hoja.appendRow([
    id, p.marca, p.entregaId, p.cliente, p.modelo, p.patente, p.vin, p.vendedor,
    p.sucursal, p.fechaEntrega, p.canal, ahoraTexto, ahoraTexto, 'Enviada', 1, '', '',
    '['+(p.tipo||'Manual')+'] Enviado manualmente desde la web'
  ]);
  return {ok:true};
}

function registrarComunicacion_(r, canal, estado, intentos, motivoError, mensajeEnviado){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_COMUNICACIONES);
  if(!hoja) return;
  var id = Utilities.getUuid();
  var ahoraTexto = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  hoja.appendRow([
    id, r.marca, r.id, r.cliente, r.modelo, r.dominio, r.chasis, r.vendedor,
    r.sucursal, r.fecha, canal, ahoraTexto, ahoraTexto, estado, intentos, '', motivoError, mensajeEnviado
  ]);
}

function buscarComunicacionExistente_(marca, entregaId, canal){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_COMUNICACIONES);
  if(!hoja) return null;
  var datos = hoja.getDataRange().getValues();
  for(var i=datos.length-1; i>=1; i--){
    if(datos[i][1]===marca && String(datos[i][2])===String(entregaId) && datos[i][10]===canal){
      return {estado:datos[i][13], intentos:datos[i][14], fila:i+1};
    }
  }
  return null;
}

// ---- Configuración inicial (correr una sola vez a mano) ----
// ---- Leer todas las comunicaciones para el Historial de la web ----
function listarComunicaciones_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_COMUNICACIONES);
  if(!hoja) return [];
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1; i<datos.length; i++){
    var fila = datos[i];
    if(!fila[0]) continue; // fila vacía
    out.push({
      id: fila[0], marca: fila[1], entregaId: fila[2], cliente: fila[3], modelo: fila[4],
      patente: fila[5], vin: fila[6], vendedor: fila[7], sucursal: fila[8], fechaEntrega: fila[9],
      canal: fila[10], fechaHoraProgramada: fila[11], fechaHoraEnvio: fila[12], estado: fila[13],
      intentos: fila[14], usuarioManual: fila[15], motivoError: fila[16], mensajeEnviado: fila[17]
    });
  }
  return out;
}

function configurarHojaComunicaciones(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_COMUNICACIONES);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_COMUNICACIONES);
    hoja.appendRow(COLUMNAS_COMUNICACIONES);
    hoja.setFrozenRows(1);
  }
}

function crearTriggerAutomatizaciones(){
  // Borra triggers viejos de esta función para no duplicar
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='ejecutarAutomatizaciones') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('ejecutarAutomatizaciones')
    .timeBased()
    .everyMinutes(15)
    .create();
}

// ---- Reintentar manualmente (llamado desde la web) ----
function reenviarComunicacion(marca, entregaId, canal){
  var entregas = leerTodasLasEntregas_();
  var r = entregas.filter(function(x){ return x.marca===marca && String(x.id)===String(entregaId); })[0];
  if(!r) return {error:'No se encontró la entrega'};
  var config = leerConfigCompleta_();
  var auto = config.automatizaciones;
  var configCanal = canal==='whatsapp' ? auto.whatsapp : auto.email;
  procesarComunicacion_(r, canal, configCanal, new Date(), config);
  return {ok:true};
}

function cancelarComunicacion(marca, entregaId, canal){
  var existente = buscarComunicacionExistente_(marca, entregaId, canal);
  if(!existente) return {error:'No se encontró'};
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_COMUNICACIONES);
  hoja.getRange(existente.fila, 14).setValue('Cancelada'); // columna "estado"
  return {ok:true};
}

// ---- Utilidad simple de parseo de fecha dd/mm/aaaa ----
function parsearFechaHora_(fechaStr){
  if(!fechaStr) return null;
  var partes = String(fechaStr).split(' ')[0].split('/');
  if(partes.length!==3) return null;
  return new Date(Number(partes[2]), Number(partes[1])-1, Number(partes[0]));
}

// ============================================================
// OJO — Estas 3 funciones son "conectores" a tu código YA EXISTENTE.
// Reemplazá el contenido de cada una para que llamen a lo que ya tenés,
// en vez de reescribir toda tu lógica de datos de nuevo:
//   - leerConfigCompleta_()     → debería devolver el mismo objeto CONFIG
//                                  que ya usa tu función 'getConfig' o similar.
//   - leerTodasLasEntregas_()   → debería devolver el mismo array de
//                                  entregas que ya usa tu función 'getEntregas'.
//   - enviarEmailPostEntrega_() → debería llamar a tu función de email
//                                  YA APROBADA, pasándole el asunto nuevo
//                                  y los datos de "r" para completar el HTML.
// ============================================================
function leerConfigCompleta_(){
  return getConfig(); // ya conectada con tu función real
}
function leerTodasLasEntregas_(){
  return getEntregas(); // ya conectada con tu función real
}
// Grupo París opera bajo 3 razones sociales distintas según la marca:
//  - Paris Cars: Chevrolet
//  - Paris Autos: Peugeot, Citroën, DFSK/Jetour, Usados
//  - Paris Motos: Honda
function nombreEntidadPorMarca_(marca){
  if(marca==='chevrolet') return 'Paris Cars';
  if(marca==='honda') return 'Paris Motos';
  return 'Paris Autos'; // peugeot, citroen, dfsk, usados
}
function enviarEmailPostEntrega_(r, asunto, config){
  config = config || getConfig();
  var auto = config.automatizaciones && config.automatizaciones.email || {};
  var urlEncuesta = (auto.formUrl && auto.formUrl[r.marca]) || '#';
  var logoMarcaUrl = MARCA_LOGO[r.marca] || '';
  var logoHeader = logoMarcaUrl
    ? '<div style="width:56px;height:56px;border-radius:50%;background:#ffffff;margin:0 auto;display:table;"><div style="display:table-cell;vertical-align:middle;text-align:center;"><img src="'+logoMarcaUrl+'" width="40" style="max-width:40px;display:inline-block;"></div></div>'
    : '';
  var cuerpo = ''+
    '<div style="background:#000000;padding:0;font-family:Arial,sans-serif;">'+
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:26px 20px;">'+
        logoHeader+
      '</td></tr></table>'+
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 16px 40px;">'+
        '<table width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:32px 30px;">'+
          '<tr><td align="center" style="font-family:Arial,sans-serif;">'+
            '<h2 style="margin:0 0 18px;color:#111827;font-size:19px;">Tu opinión nos ayuda a mejorar 🚗</h2>'+
            '<p style="margin:0 0 10px;color:#1d4ed8;font-size:14px;">Hola '+r.cliente+',</p>'+
            '<p style="margin:0 0 10px;color:#374151;font-size:13.5px;line-height:1.6;">Esperamos que estés disfrutando tu <b>'+r.modelo+'</b>.</p>'+
            '<p style="margin:0 0 10px;color:#374151;font-size:13.5px;line-height:1.6;">Gracias por confiar en nosotros para la adquisición de tu 0km.</p>'+
            '<p style="margin:0 0 18px;color:#374151;font-size:13.5px;line-height:1.6;">Nos gustaría conocer cómo fue tu experiencia durante el proceso de entrega.</p>'+
            '<a href="'+urlEncuesta+'" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13.5px;padding:12px 26px;border-radius:8px;margin-bottom:12px;">RESPONDER ENCUESTA INTERNA</a>'+
            '<p style="margin:8px 0 0;color:#9ca3af;font-size:11.5px;">Te llevará menos de un minuto completarla.</p>'+
          '</td></tr>'+
        '</table>'+
      '</td></tr></table>'+
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#f3f4f6;padding:16px;font-family:Arial,sans-serif;color:#6b7280;font-size:11px;">'+
        '<b>'+nombreEntidadPorMarca_(r.marca)+'</b><br>Recepción: '+(config.telefonoContacto||'')+' | Calidad: '+(config.telefonoCalidad||'')+'<br>'+(config.copiaSiempreA||'')+
      '</td></tr></table>'+
    '</div>';
  MailApp.sendEmail({to:r.email, cc:armarCC_(r, config), subject:asunto, htmlBody:cuerpo, name:nombreEntidadPorMarca_(r.marca)});
}


// ============================================================
// Reportar Caso — módulo de intake para Planning (solo registro,
// el seguimiento se hace en el sistema aparte de Calidad)
// ============================================================
var HOJA_CASOS = 'Casos';

function getHojaCasos_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_CASOS);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_CASOS);
    hoja.appendRow(['Código','Fecha Reporte','Marca','Entrega ID','Cliente','DNI','Teléfono','Modelo',
      'Dominio/VIN','Sucursal','Vendedor','Administrativo','Responsable Entrega','Área de Origen',
      'Tipo de Caso','Motivo','Prioridad','Descripción','Reportado Por','Historial (JSON)','Estado Conocido (GC)']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,21).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  return hoja;
}

function listarCasos_(){
  var hoja = getHojaCasos_();
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1; i<datos.length; i++){
    var fila = datos[i];
    if(!fila[0]) continue;
    var historial = [];
    try{ historial = fila[19] ? JSON.parse(fila[19]) : []; }catch(e){}
    out.push({
      id: fila[0], fechaReporte: fila[1], marca: fila[2], entregaId: fila[3], cliente: fila[4],
      dni: fila[5], telefono: fila[6], modelo: fila[7], dominio: fila[8], sucursal: fila[9],
      vendedor: fila[10], administrativo: fila[11], responsableEntrega: fila[12], areaOrigen: fila[13],
      tipoCaso: fila[14], motivo: fila[15], prioridad: fila[16], descripcion: fila[17], reportadoPor: fila[18],
      historial: historial
    });
  }
  return out;
}

// Código legible tipo PA-2026-1050 — más fácil de comunicarle al cliente/equipo
// que un ID interno. Se arma con el año + la cantidad de filas ya cargadas.
function generarCodigoCaso_(hoja){
  var year = new Date().getFullYear();
  var numero = 1000 + Math.max(0, hoja.getLastRow() - 1) + 1;
  return 'PA-' + year + '-' + numero;
}

function reportarCaso_(p){
  try{
    var hoja = getHojaCasos_();
    var codigo = generarCodigoCaso_(hoja);
    var ahora = new Date();
    hoja.appendRow([
      codigo, ahora, p.marca||'', p.entregaId||'', p.cliente||'', p.dni||'', p.telefono||'', p.modelo||'',
      p.dominio||'', p.sucursal||'', p.vendedor||'', p.administrativo||'', p.responsableEntrega||'',
      p.areaOrigen||'', p.tipoCaso||'', p.motivo||'', p.prioridad||'Media', p.descripcion||'', p.reportadoPor||''
    ]);
    // El aviso a Gestión de Casos (enviarEventoGestionCasos_) YA NO se hace
    // acá — antes esta función esperaba a que la OTRA planilla terminara
    // toda su cadena (abrir spreadsheet ajeno, escribir evento, comparar
    // contra todos los casos existentes) antes de responderle a quien
    // reportó el caso, y eso era lo que hacía sentir lento "Enviar a
    // Calidad". Ahora el caso en Planning queda guardado y confirmado al
    // toque, y la sincronización se dispara aparte, en segundo plano
    // (ver sincronizarCasoGestionDeCasos_ + el POST 'sincronizarCasoGC'
    // que dispara el frontend justo después de mostrar la confirmación).
    crearNotificacion_('caso_creado', codigo, 'Caso reportado: '+(p.motivo||'—')+' — '+(p.cliente||'—'), p.marca, p.entregaId);
    return {ok:true, id:codigo, codigo:codigo};
  }catch(err){
    return {ok:false, error:String(err)};
  }
}

// Se llama aparte, después de que el usuario ya vio la confirmación del
// caso — así la demora de la otra planilla no se siente en la UI.
function sincronizarCasoGestionDeCasos_(p, codigo){
  try{
    var sincronizado = enviarEventoGestionCasos_(p, codigo);
    return {ok:true, sincronizadoGC: sincronizado};
  }catch(err){
    return {ok:false, sincronizadoGC:false, error:String(err)};
  }
}

// Envía el caso recién reportado al Motor de Eventos de Gestión de Casos,
// con el mismo contrato de datos que ya quedó definido en
// Engine_EventEngine.recibirEvento() de ese proyecto. No crea el caso
// directo del otro lado — CREAR_CASOS_AUTOMATICO está apagado a propósito,
// así que queda esperando en la Bandeja de entrada para que alguien lo
// confirme a mano.
function enviarEventoGestionCasos_(p, codigo){
  try{
    var payload = {
      action: 'recibirEvento',
      params: {
        fuente: 'Planning',
        vin: p.dominio || '',
        cliente: p.cliente || '',
        dni: p.dni || '',
        telefono: p.telefono || '',
        email: p.email || '',
        marca: MARCA_LABEL[p.marca] || p.marca || '',
        modelo: p.modelo || '',
        sucursal: p.sucursal || '',
        sector: p.areaOrigen || '',
        tipoCaso: p.tipoCaso || 'Otro',
        motivo: p.motivo || '',
        descripcion: p.descripcion || '',
        prioridadSugerida: p.prioridad || 'Media',
        origenId: codigo
      }
    };
    var respuesta = UrlFetchApp.fetch(URL_GESTION_CASOS_EXEC, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var codigoHttp = respuesta.getResponseCode();
    if(codigoHttp<200 || codigoHttp>=300) return false;
    var resultado = JSON.parse(respuesta.getContentText());
    return !!resultado.ok;
  }catch(err){
    return false; // no rompemos el reporte del caso en Planning por esto
  }
}

// Por si se reportó un caso por error (duplicado, mal cargado, etc.) —
// borra la fila entera de la hoja Casos. No hay "papelera": es definitivo.
function eliminarCaso_(codigo){
  try{
    if(!codigo) return {ok:false, error:'Falta el código del caso.'};
    var hoja = getHojaCasos_();
    var datos = hoja.getDataRange().getValues();
    for(var i=1; i<datos.length; i++){
      if(String(datos[i][0])===String(codigo)){
        hoja.deleteRow(i+1);
        return {ok:true};
      }
    }
    return {ok:false, error:'No se encontró ese caso.'};
  }catch(err){
    return {ok:false, error:String(err)};
  }
}

// Agrega una novedad al historial de un caso YA REPORTADO — para cuando el
// cliente/vehículo tiene un caso previo y en vez de reportar uno nuevo
// (duplicado) se prefiere sumar la novedad al mismo expediente.
function agregarComentarioCaso_(codigo, autor, texto){
  try{
    if(!codigo || !texto) return {ok:false, error:'Faltan datos.'};
    var hoja = getHojaCasos_();
    var datos = hoja.getDataRange().getValues();
    for(var i=1; i<datos.length; i++){
      if(String(datos[i][0])===String(codigo)){
        var historial = [];
        try{ historial = datos[i][19] ? JSON.parse(datos[i][19]) : []; }catch(e){}
        historial.push({fecha: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), autor: autor||'—', texto: texto});
        hoja.getRange(i+1, 20).setValue(JSON.stringify(historial));
        return {ok:true, historial: historial};
      }
    }
    return {ok:false, error:'No se encontró ese caso.'};
  }catch(err){
    return {ok:false, error:String(err)};
  }
}

// ============================================================
// BANDEJA DE ENTRADA (Notificaciones) — módulo propio de Planning,
// separado de la Bandeja de entrada de Gestión de Casos. Avisa cuando:
//  1) se reporta un caso nuevo, y
//  2) un caso reportado desde acá cambia de estado del otro lado
//     (Gestión de Casos) — se detecta al apretar "Revisar actualizaciones"
//     en la Bandeja, comparando contra el último estado conocido guardado
//     en la columna "Estado Conocido (GC)" de la hoja Casos.
// ============================================================
var HOJA_NOTIFICACIONES = 'Notificaciones';

function getHojaNotificaciones_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_NOTIFICACIONES);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_NOTIFICACIONES);
    hoja.appendRow(['ID','Fecha','Tipo','Caso ID','Mensaje','Leída','Marca','Entrega ID','Destinatario Rol','Destinatario Usuario','Autor']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,11).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  // Migración: si la hoja ya existía de antes (sin las columnas de destinatario), se agregan solas.
  var colsActuales = hoja.getLastColumn();
  var headersCompletos = ['ID','Fecha','Tipo','Caso ID','Mensaje','Leída','Marca','Entrega ID','Destinatario Rol','Destinatario Usuario','Autor'];
  if(colsActuales < headersCompletos.length){
    hoja.getRange(1, colsActuales+1, 1, headersCompletos.length-colsActuales).setValues([headersCompletos.slice(colsActuales)])
      .setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  return hoja;
}

// destinatarioRol: '' (=solo Calidad, comportamiento viejo) | 'logistica' | 'administrativo' |
//   'recepcion' | 'vendedor' | 'todos'. destinatarioUsuario: opcional, más puntual que el rol
// (ej. avisarle solo al administrativo de ESA entrega puntual, si su usuario coincide con el
// nombre cargado como "Administrativo" — ver resolverUsuarioPorNombre_).
function crearNotificacion_(tipo, casoId, mensaje, marca, entregaId, destinatarioRol, destinatarioUsuario, autor){
  var hoja = getHojaNotificaciones_();
  var id = Utilities.getUuid();
  hoja.appendRow([id, new Date(), tipo, casoId||'', mensaje, false, marca||'', entregaId||'', destinatarioRol||'', destinatarioUsuario||'', autor||'']);
  return id;
}

// Intenta encontrar el usuario del sistema cuyo NOMBRE coincide con el texto
// libre cargado en "Administrativo" o "Responsable de Entrega" de una entrega
// — así una notificación de rol amplio ('administrativo') puede además ir
// dirigida puntualmente a esa persona si tiene cuenta propia. Si no
// encuentra coincidencia exacta, no pasa nada: el aviso igual le llega por
// el rol.
function resolverUsuarioPorNombre_(nombre){
  if(!nombre) return '';
  var nombreNorm = String(nombre).trim().toLowerCase();
  var u = filaUsuarios_().find(function(x){ return String(x.nombre).trim().toLowerCase()===nombreNorm; });
  return u ? u.usuario : '';
}

function listarNotificaciones_(actorUsuario, actorRol){
  var hoja = getHojaNotificaciones_();
  var datos = hoja.getDataRange().getValues();
  var esAdmin = (actorRol==='calidad' || actorRol==='maestro');
  var out = [];
  for(var i=1;i<datos.length;i++){
    var fila = datos[i];
    if(!fila[0]) continue;
    var destRol = fila[8]||'', destUsuario = fila[9]||'';
    var meCorresponde = esAdmin || !destRol ||
      destRol==='todos' ||
      destRol===actorRol ||
      (destUsuario && actorUsuario && String(destUsuario).toLowerCase()===String(actorUsuario).toLowerCase());
    if(!meCorresponde) continue;
    out.push({
      id: fila[0], fecha: formatFechaGC_(fila[1]), tipo: fila[2], casoId: fila[3],
      mensaje: fila[4], leida: (fila[5]===true||fila[5]==='true'), marca: fila[6], entregaId: fila[7],
      destinatarioRol: destRol, destinatarioUsuario: destUsuario, autor: fila[10]||''
    });
  }
  return out.sort(function(a,b){ return String(b.fecha).localeCompare(String(a.fecha)); });
}

function marcarNotificacionLeida_(id){
  var hoja = getHojaNotificaciones_();
  var datos = hoja.getDataRange().getValues();
  for(var i=1;i<datos.length;i++){
    if(String(datos[i][0])===String(id)){
      hoja.getRange(i+1,6).setValue(true);
      return {ok:true};
    }
  }
  return {ok:false, error:'No se encontró la notificación.'};
}

function marcarTodasNotificacionesLeidas_(actorUsuario, actorRol){
  var hoja = getHojaNotificaciones_();
  var lastRow = hoja.getLastRow();
  if(lastRow<2) return {ok:true};
  var visibles = listarNotificaciones_(actorUsuario, actorRol);
  var idsVisibles = {}; visibles.forEach(function(n){ idsVisibles[n.id]=true; });
  var datos = hoja.getRange(2,1,lastRow-1,1).getValues();
  for(var i=0;i<datos.length;i++){
    if(idsVisibles[datos[i][0]]) hoja.getRange(i+2,6).setValue(true);
  }
  return {ok:true};
}

// Comunicado manual: lo escribe alguien de Calidad/Maestro y elige a quién
// va dirigido (un rol puntual, o "todos"). Queda igual que cualquier otra
// notificación, con tipo 'comunicado' para poder distinguirlo visualmente.
function enviarComunicado_(actorUsuario, actorPassword, mensaje, destinatarioRol){
  try{
    requiereCalidad_(actorUsuario, actorPassword);
  }catch(err){ return {error:String(err.message||err)}; }
  if(!mensaje || !mensaje.trim()) return {error:'Escribí el mensaje del comunicado.'};
  var autor = usuarioPorLogin_(actorUsuario);
  crearNotificacion_('comunicado', '', mensaje.trim(), '', '', destinatarioRol||'todos', '', autor);
  return {ok:true};
}
function usuarioPorLogin_(usuario){
  var u = buscarUsuario_(usuario);
  return u ? u.nombre : usuario;
}
function obtenerEntregaPorId_(marca, id){
  var sheet = getSheetPorMarca_(marca);
  var rowIdx = findRowIndexById_(marca, id);
  if(rowIdx===-1) return null;
  var row = sheet.getRange(rowIdx,1,1,CAMPOS.length).getValues()[0];
  return rowToObj_(row, marca);
}
// Wrappers callables desde el frontend (doPost) — buscan la entrega fresca
// en la planilla para armar el mensaje, en vez de confiar en lo que mande
// el navegador.
function notificarEntregaAgendadaAPI_(marca, id, autor){
  var r = obtenerEntregaPorId_(marca, id);
  if(r) notificarEntregaAgendada_(r, autor);
  return {ok:true};
}
function notificarItemMarcadoAPI_(marca, id, itemLabel, estado, motivo, autor){
  var r = obtenerEntregaPorId_(marca, id);
  if(r) notificarItemMarcado_(r, itemLabel, estado, motivo, autor);
  return {ok:true};
}
function notificarEntregaCompletadaAPI_(marca, id, autor, extra){
  var r = obtenerEntregaPorId_(marca, id);
  if(r) notificarEntregaCompletada_(r, autor, extra);
  return {ok:true};
}
function notificarComentarioEntregaAPI_(marca, id, autor, texto){
  var r = obtenerEntregaPorId_(marca, id);
  if(r) notificarComentarioEntrega_(r, autor, texto);
  return {ok:true};
}

// Resumen diario para Recepción — "Hoy tenés X entregas programadas". Corre
// solo una vez instalado el trigger (ver instalarTriggerResumenRecepcion_,
// se corre a mano UNA VEZ desde el editor).
function generarResumenDiarioRecepcion_(){
  var hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  var entregas = getEntregas().filter(function(r){ return r.fecha===hoy; });
  if(entregas.length===0) return;
  crearNotificacion_('resumen_diario', '', 'Hoy tenés '+entregas.length+' entrega(s) programada(s).', '', '', 'recepcion', '', 'Sistema');
}
// Pública (sin "_" al final) para que aparezca en el desplegable "Ejecutar" del editor.
function ejecutarInstalarTriggerResumenRecepcion(){
  instalarTriggerResumenRecepcion_();
}
function instalarTriggerResumenRecepcion_(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='generarResumenDiarioRecepcion_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('generarResumenDiarioRecepcion_').timeBased().everyDays(1).atHour(8).create();
}

// Ítem marcado por Logística (colocado / no colocado / pendiente) — avisa al
// administrativo de ESA entrega puntual (si tiene cuenta propia con nombre
// coincidente) y, en general, a todo el rol administrativo — Calidad ya ve
// todo por defecto.
function notificarItemMarcado_(r, itemLabel, estado, motivo, autor){
  var usuarioAdmin = resolverUsuarioPorNombre_(r.administrativo);
  var mensaje = autor+' marcó "'+itemLabel+'" como '+estado+' en la entrega de '+r.cliente+(motivo?' — '+motivo:'');
  crearNotificacion_('item_marcado', '', mensaje, r.marca, r.id, 'administrativo', usuarioAdmin, autor);
}
// Entrega recién agendada — avisa a Logística con los datos clave.
function notificarEntregaAgendada_(r, autor){
  var mensaje = autor+' agendó una entrega: '+r.cliente+' — '+r.fecha+' '+r.hora+' hs — '+(r.sucursal||'—')+' — VIN '+(r.dominio||r.chasis||'s/d');
  crearNotificacion_('entrega_agendada', '', mensaje, r.marca, r.id, 'logistica', '', autor);
}
// Unidad entregada / encuesta respondida — avisa al administrativo de esa entrega.
function notificarEntregaCompletada_(r, autor, extra){
  var usuarioAdmin = resolverUsuarioPorNombre_(r.administrativo);
  var mensaje = 'Se entregó la unidad de '+r.cliente+(extra?' — '+extra:'');
  crearNotificacion_('entrega_completada', '', mensaje, r.marca, r.id, 'administrativo', usuarioAdmin, autor);
}
// Comentario nuevo en una entrega — avisa al administrativo de esa entrega.
function notificarComentarioEntrega_(r, autor, texto){
  var usuarioAdmin = resolverUsuarioPorNombre_(r.administrativo);
  var mensaje = autor+' comentó en la entrega de '+r.cliente+': "'+texto.slice(0,80)+(texto.length>80?'…':'')+'"';
  crearNotificacion_('comentario', '', mensaje, r.marca, r.id, 'administrativo', usuarioAdmin, autor);
}
// Compara el estado actual en Gestión de Casos contra el último conocido
// (columna 21 de la hoja Casos) para cada caso reportado desde Planning, y
// genera una notificación cuando encuentra un cambio. Es manual (botón en
// la Bandeja) — así no se gasta cuota de llamadas a la otra planilla en
// cada carga de la app, solo cuando alguien realmente quiere revisar.
function revisarActualizacionesCasos_(){
  try{
    var hojaCasos = getHojaCasos_();
    var datos = hojaCasos.getDataRange().getValues();
    if(datos.length<2) return {ok:true, actualizados:0};

    var ssGC = SpreadsheetApp.openById(ID_GESTION_CASOS);
    var hojaGC = ssGC.getSheetByName('Casos');
    if(!hojaGC) return {ok:false, error:'No se encontró la hoja Casos en Gestión de Casos.'};
    var datosGC = hojaGC.getDataRange().getValues();
    // índice por origenId (columna 20, índice 19) -> {estado, responsable}
    var mapaGC = {};
    for(var g=1; g<datosGC.length; g++){
      var filaGC = datosGC[g];
      if(!filaGC[0]) continue;
      var origenId = String(filaGC[19]||'').trim();
      if(origenId) mapaGC[origenId] = {estado: filaGC[2], responsable: filaGC[17]};
    }

    var actualizados = 0;
    for(var i=1; i<datos.length; i++){
      var fila = datos[i];
      var codigo = fila[0];
      if(!codigo) continue;
      var infoGC = mapaGC[codigo];
      if(!infoGC) continue; // todavía no fue confirmado del otro lado
      var estadoConocido = fila[20] || ''; // columna 21
      if(infoGC.estado && infoGC.estado !== estadoConocido){
        var mensaje = 'Caso '+codigo+' ('+(fila[4]||'cliente s/d')+') cambió a estado "'+infoGC.estado+'"'+(infoGC.responsable?' — responsable: '+infoGC.responsable:'');
        crearNotificacion_('caso_actualizado', codigo, mensaje, fila[2], fila[3]);
        hojaCasos.getRange(i+1, 21).setValue(infoGC.estado);
        actualizados++;
      }
    }
    return {ok:true, actualizados: actualizados};
  }catch(err){
    return {ok:false, error:'No se pudo revisar Gestión de Casos: '+String(err)};
  }
}

// ============================================================
// CATÁLOGO DE ACCESORIOS — nombre + precio. Permite que al cargar un
// accesorio en una entrega se pueda buscar por nombre y traiga el precio
// solo, en vez de un campo de texto libre para todos los accesorios juntos.
// También sirve de base para el reporte de "qué accesorio se vende más".
// ============================================================
var HOJA_CATALOGO_ACCESORIOS = 'Catálogo Accesorios';

// ============================================================
// NPS — respuestas ANÓNIMAS (encuestas que llegan sin VIN, no se pueden
// atar a una entrega puntual). Una hoja por instancia (Fábrica, Alerta
// Temprana, Contacto Posterior) — se leen aparte y se suman al
// acumulado de cada página en el frontend. "tipo" es 'fabrica',
// 'alertatemprana' o 'contactoposterior'.
// ============================================================
var HOJAS_NPS_ANONIMAS_ = {
  fabrica: 'NPS Fábrica Anónimas',
  alertatemprana: 'NPS Alerta Temprana Anónimas',
  contactoposterior: 'NPS Contacto Posterior Anónimas'
};
function getHojaNpsAnonimas_(tipo){
  var nombre = HOJAS_NPS_ANONIMAS_[tipo];
  if(!nombre) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(nombre);
  if(!hoja){
    hoja = ss.insertSheet(nombre);
    hoja.appendRow(['Fecha', 'Canal', 'Puntaje', 'Comentario', 'CargadoPor']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,5).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  return hoja;
}
function agregarNpsAnonimo_(tipo, canal, puntaje, comentario, autor){
  if(canal!=='TD' && canal!=='PDA') return {ok:false, error:'Canal inválido.'};
  var n = Number(puntaje);
  if(isNaN(n) || n<0 || n>10) return {ok:false, error:'El puntaje tiene que ser un número de 0 a 10.'};
  var hoja = getHojaNpsAnonimas_(tipo);
  if(!hoja) return {ok:false, error:'Instancia de NPS inválida.'};
  var fecha = "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  hoja.appendRow([fecha, canal, n, comentario||'', autor||'—']);
  return {ok:true};
}
function eliminarNpsAnonimo_(tipo, fila){
  var hoja = getHojaNpsAnonimas_(tipo);
  if(!hoja) return {ok:false, error:'Instancia de NPS inválida.'};
  fila = Number(fila);
  if(!fila || fila<2) return {ok:false, error:'Fila inválida.'};
  hoja.deleteRow(fila);
  return {ok:true};
}
function listarNpsAnonimas_(tipo){
  var hoja = getHojaNpsAnonimas_(tipo);
  if(!hoja) return [];
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1;i<datos.length;i++){
    var fila = datos[i];
    if(!fila[1]) continue;
    out.push({fecha: fila[0], canal: fila[1], puntaje: fila[2], comentario: fila[3]||'', cargadoPor: fila[4]||'', fila: i+1});
  }
  return out;
}
// Se mantienen estos dos nombres (los usaba el frontend de Fábrica desde
// antes) como atajos de los genéricos de arriba — misma hoja de siempre,
// no se pierde nada de lo que ya habías cargado.
function agregarNpsFabricaAnonimo_(canal, puntaje, comentario, autor){
  return agregarNpsAnonimo_('fabrica', canal, puntaje, comentario, autor);
}
function listarNpsFabricaAnonimas_(){
  return listarNpsAnonimas_('fabrica');
}

// ============================================================
// NPS — Archivo Importado (compartido para TODOS los usuarios, no solo
// quien lo subió). Una fila por (instancia, canal) — al volver a subir
// un archivo del mismo canal, se REEMPLAZA esa fila, no se duplica.
// "PuntosJSON" guarda cada respuesta individual con su fecha, para poder
// armar el gráfico mensual del lado del frontend.
// ============================================================
var HOJA_NPS_ARCHIVO_IMPORTADO = 'NPS Archivo Importado';
function getHojaNpsArchivoImportado_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_NPS_ARCHIVO_IMPORTADO);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_NPS_ARCHIVO_IMPORTADO);
    hoja.appendRow(['Instancia','Canal','NombreArchivo','FechaCarga','FechaCorte','PuntosJSON','CargadoPor']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,7).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  return hoja;
}
// Agrega UN punto con nombre, VIN y vendedor directo al archivo (no al
// sistema de anónimas) — así entra en el Ranking y en las tarjetas de
// acumulado exactamente igual que si hubiera venido en el Excel. Si trae
// VIN, también lo suma a "ventas" (evitando duplicar el mismo VIN).
function agregarPuntoManualArchivo_(instancia, canal, punto, autor){
  if(['fabrica','alertatemprana','contactoposterior'].indexOf(instancia)===-1) return {ok:false, error:'Instancia inválida.'};
  if(canal!=='directa' && canal!=='pda') return {ok:false, error:'Canal inválido.'};
  punto.manual = true; // para distinguirlo de los que vinieron del Excel — así se puede listar y borrar por separado
  var hoja = getHojaNpsArchivoImportado_();
  var datos = hoja.getDataRange().getValues();
  var filaExistente = -1;
  for(var i=1;i<datos.length;i++){
    if(datos[i][0]===instancia && datos[i][1]===canal){ filaExistente = i+1; break; }
  }
  var puntos = [], fechaCorte = '0000-00-00', nombreArchivo = 'Cargas manuales';
  if(filaExistente>-1){
    try{ puntos = JSON.parse(datos[filaExistente-1][5]) || []; }catch(e){}
    fechaCorte = String(datos[filaExistente-1][4]||'').replace(/^'/,'');
    nombreArchivo = datos[filaExistente-1][2] || nombreArchivo;
  }
  puntos.push(punto);
  var fechaCarga = "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  var fila = [instancia, canal, nombreArchivo, fechaCarga, "'"+fechaCorte, JSON.stringify(puntos), autor||'—'];
  if(filaExistente>-1){ hoja.getRange(filaExistente,1,1,7).setValues([fila]); } else { hoja.appendRow(fila); }
  if(punto.vin){
    agregarPuntoManualArchivoVentas_(canal, {vin:punto.vin, vendedor:punto.vendedor, sucursal:punto.sucursal, fecha:punto.fecha, score:0, manual:true});
  }
  registrarCargaManualLegible_(instancia, canal, punto, autor);
  return {ok:true};
}
// Guarda además una copia en una hoja aparte, en filas normales y
// legibles (no adentro de un JSON) — para poder verla directo en la
// planilla de Google Sheets, sin pasar por la app. Esta hoja es solo
// para consulta/auditoría; los cálculos de NPS siguen usando el archivo
// de arriba, no esta.
function registrarCargaManualLegible_(instancia, canal, punto, autor){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nombreHoja = 'NPS Cargas Manuales';
  var hoja = ss.getSheetByName(nombreHoja);
  if(!hoja){
    hoja = ss.insertSheet(nombreHoja);
    hoja.appendRow(['Fecha y hora','Instancia','Canal','Cliente','VIN','Vendedor','Sucursal','Puntaje','Comentario','Cargado por']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,10).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  var etiquetaInstancia = {fabrica:'Fábrica', alertatemprana:'Alerta Temprana', contactoposterior:'Contacto Posterior'}[instancia] || instancia;
  var etiquetaCanal = canal==='pda' ? 'PDA' : 'Directa / Tradicional';
  var fechaHora = "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  hoja.appendRow([fechaHora, etiquetaInstancia, etiquetaCanal, punto.cliente||'', punto.vin||'', punto.vendedor||'', punto.sucursal||'', punto.score, punto.comentario||'', autor||'—']);
}
function agregarPuntoManualArchivoVentas_(canal, puntoVentas){
  var hoja = getHojaNpsArchivoImportado_();
  var datos = hoja.getDataRange().getValues();
  var filaExistente = -1;
  for(var i=1;i<datos.length;i++){
    if(datos[i][0]==='ventas' && datos[i][1]===canal){ filaExistente = i+1; break; }
  }
  var puntos = [], fechaCorte = '0000-00-00';
  if(filaExistente>-1){
    try{ puntos = JSON.parse(datos[filaExistente-1][5]) || []; }catch(e){}
    fechaCorte = String(datos[filaExistente-1][4]||'').replace(/^'/,'');
  }
  if(puntos.some(function(p){return p.vin===puntoVentas.vin;})) return; // ya estaba, no duplicar
  puntos.push(puntoVentas);
  var fechaCarga = "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  var fila = ['ventas', canal, 'Cargas manuales', fechaCarga, "'"+fechaCorte, JSON.stringify(puntos), '—'];
  if(filaExistente>-1){ hoja.getRange(filaExistente,1,1,7).setValues([fila]); } else { hoja.appendRow(fila); }
}
// Elimina UN punto cargado manualmente (con datos del cliente) — lo busca
// por VIN dentro del archivo de esa instancia+canal (y, si tenía VIN,
// también lo saca de "ventas" para no dejar un auto fantasma contando).
function eliminarPuntoManualArchivo_(instancia, canal, vin, indice){
  if(['fabrica','alertatemprana','contactoposterior'].indexOf(instancia)===-1) return {ok:false, error:'Instancia inválida.'};
  if(canal!=='directa' && canal!=='pda') return {ok:false, error:'Canal inválido.'};
  var hoja = getHojaNpsArchivoImportado_();
  var datos = hoja.getDataRange().getValues();
  var filaExistente = -1;
  for(var i=1;i<datos.length;i++){
    if(datos[i][0]===instancia && datos[i][1]===canal){ filaExistente = i+1; break; }
  }
  if(filaExistente===-1) return {ok:false, error:'No hay archivo cargado para ese canal.'};
  var puntos = [];
  try{ puntos = JSON.parse(datos[filaExistente-1][5]) || []; }catch(e){}
  if(indice==null || !puntos[indice] || !(puntos[indice].manual || puntos[indice].cliente)) return {ok:false, error:'No se encontró ese punto (o no es uno cargado con datos del cliente).'};
  puntos.splice(indice, 1);
  hoja.getRange(filaExistente, 6).setValue(JSON.stringify(puntos));
  if(vin){
    var filaVentas = -1;
    for(var j=1;j<datos.length;j++){
      if(datos[j][0]==='ventas' && datos[j][1]===canal){ filaVentas = j+1; break; }
    }
    if(filaVentas>-1){
      var puntosVentas = [];
      try{ puntosVentas = JSON.parse(datos[filaVentas-1][5]) || []; }catch(e){}
      puntosVentas = puntosVentas.filter(function(p){ return p.vin!==vin; }); // el VIN es único, alcanza con eso
      hoja.getRange(filaVentas, 6).setValue(JSON.stringify(puntosVentas));
    }
  }
  return {ok:true};
}
function guardarArchivoNpsImportado_(instancia, canal, nombreArchivo, fechaCorte, puntosJson, autor){
  if(['fabrica','alertatemprana','contactoposterior','ventas'].indexOf(instancia)===-1) return {ok:false, error:'Instancia inválida.'};
  if(canal!=='directa' && canal!=='pda') return {ok:false, error:'Canal inválido.'};
  var hoja = getHojaNpsArchivoImportado_();
  var datos = hoja.getDataRange().getValues();
  var filaExistente = -1;
  for(var i=1;i<datos.length;i++){
    if(datos[i][0]===instancia && datos[i][1]===canal){ filaExistente = i+1; break; }
  }
  var fechaCarga = "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  var fila = [instancia, canal, nombreArchivo, fechaCarga, "'" + fechaCorte, puntosJson, autor||'—'];
  if(filaExistente>-1){
    hoja.getRange(filaExistente,1,1,7).setValues([fila]);
  } else {
    hoja.appendRow(fila);
  }
  return {ok:true};
}
// Cambia SOLO la fecha de corte de un archivo ya subido (sin tocar los
// puntos ni tener que volver a importar el Excel) — para cuando quieren
// que el sistema empiece a contar en vivo desde una fecha puntual.
function actualizarFechaCorteArchivo_(instancia, canal, nuevaFecha){
  if(['fabrica','alertatemprana','contactoposterior','ventas'].indexOf(instancia)===-1) return {ok:false, error:'Instancia inválida.'};
  if(canal!=='directa' && canal!=='pda') return {ok:false, error:'Canal inválido.'};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) return {ok:false, error:'Fecha inválida.'};
  var hoja = getHojaNpsArchivoImportado_();
  var datos = hoja.getDataRange().getValues();
  for(var i=1;i<datos.length;i++){
    if(datos[i][0]===instancia && datos[i][1]===canal){
      hoja.getRange(i+1, 5).setValue("'" + nuevaFecha);
      return {ok:true};
    }
  }
  return {ok:false, error:'No hay ningún archivo cargado para ese canal todavía.'};
}
function listarArchivosNpsImportados_(){
  var hoja = getHojaNpsArchivoImportado_();
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1;i<datos.length;i++){
    var f = datos[i];
    if(!f[0]) continue;
    out.push({instancia:f[0], canal:f[1], nombreArchivo:f[2], fechaCarga:f[3], fechaCorte:f[4], puntosJson:f[5], cargadoPor:f[6]});
  }
  return out;
}

function getHojaCatalogoAccesorios_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_CATALOGO_ACCESORIOS);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_CATALOGO_ACCESORIOS);
    hoja.appendRow(['Nombre','Precio','Activo','Marca','Modelo','PN','ManoDeObra','PrecioContadoFinal','PrecioTarjeta','PrecioEn3Cuotas']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,10).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
    hoja.appendRow(['Cubrecárter', 45000, true, '', '', '', '', '', '', '']);
    hoja.appendRow(['Polarizado', 60000, true, '', '', '', '', '', '', '']);
    hoja.appendRow(['Sensores traseros', 38000, true, '', '', '', '', '', '', '']);
    hoja.appendRow(['Faros antiniebla', 52000, true, '', '', '', '', '', '', '']);
    hoja.appendRow(['Alarma', 70000, true, '', '', '', '', '', '', '']);
    hoja.appendRow(['Cámara de retroceso', 65000, true, '', '', '', '', '', '', '']);
  }
  // Por si la hoja ya existía de antes (sin las columnas nuevas), las agrega sin romper nada.
  if(hoja.getLastColumn()<6){
    hoja.getRange(1,4,1,3).setValues([['Marca','Modelo','PN']]);
    hoja.getRange(1,4,1,3).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  if(hoja.getLastColumn()<10){
    hoja.getRange(1,7,1,4).setValues([['ManoDeObra','PrecioContadoFinal','PrecioTarjeta','PrecioEn3Cuotas']]);
    hoja.getRange(1,7,1,4).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  return hoja;
}
function listarCatalogoAccesorios_(){
  var hoja = getHojaCatalogoAccesorios_();
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1;i<datos.length;i++){
    var fila = datos[i];
    if(!fila[0]) continue;
    out.push({
      nombre: fila[0], precio: Number(fila[1])||0, activo: fila[2]!==false, marca: fila[3]||'', modelo: fila[4]||'', pn: fila[5]||'',
      manoDeObra: Number(fila[6])||0, precioContadoFinal: Number(fila[7])||0, precioTarjeta: Number(fila[8])||0, precioEn3Cuotas: Number(fila[9])||0,
      fila: i+1
    });
  }
  return out;
}
 
function agregarItemCatalogoAccesorios_(nombre, precio, marca, modelo, pn, manoDeObra, precioContadoFinal, precioTarjeta, precioEn3Cuotas){
  if(!nombre) return {ok:false, error:'Falta el nombre.'};
  marca = marca||''; modelo = modelo||''; pn = pn||'';
  var hoja = getHojaCatalogoAccesorios_();
  var existentes = listarCatalogoAccesorios_();
  // Ahora matchea por nombre + marca + modelo (no solo nombre), para que el
  // mismo accesorio pueda tener precio distinto según la marca.
  var yaExiste = existentes.find(function(x){
    return x.nombre.trim().toLowerCase()===nombre.trim().toLowerCase() &&
           (x.marca||'')===marca && (x.modelo||'').toLowerCase()===modelo.toLowerCase();
  });
  if(yaExiste){
    hoja.getRange(yaExiste.fila, 2).setValue(Number(precio)||0);
    if(pn) hoja.getRange(yaExiste.fila, 6).setValue(pn);
    hoja.getRange(yaExiste.fila, 7, 1, 4).setValues([[Number(manoDeObra)||0, Number(precioContadoFinal)||0, Number(precioTarjeta)||0, Number(precioEn3Cuotas)||0]]);
    return {ok:true, actualizado:true};
  }
  hoja.appendRow([nombre.trim(), Number(precio)||0, true, marca, modelo, pn, Number(manoDeObra)||0, Number(precioContadoFinal)||0, Number(precioTarjeta)||0, Number(precioEn3Cuotas)||0]);
  return {ok:true};
}
 
function eliminarItemCatalogoAccesorios_(nombre, marca, modelo){
  var hoja = getHojaCatalogoAccesorios_();
  var existentes = listarCatalogoAccesorios_();
  var item = existentes.find(function(x){
    return x.nombre===nombre && (x.marca||'')===(marca||'') && (x.modelo||'')===(modelo||'');
  });
  if(!item) return {ok:false, error:'No se encontró ese ítem.'};
  hoja.deleteRow(item.fila);
  return {ok:true};
}
 
// Importación masiva desde un archivo. Cada fila viene como
// [nombre, precio, marca, modelo, pn, manoDeObra, precioContadoFinal, precioTarjeta, precioEn3Cuotas]
// — el frontend ya la arma así, buscando las columnas por nombre.
function importarCatalogoAccesorios_(filas){
  if(!filas || !filas.length) return {ok:false, error:'No llegaron filas para importar.'};
  var creados = 0, actualizados = 0;
  filas.forEach(function(f){
    var nombre = String(f[0]||'').trim();
    var precio = Number(f[1])||0;
    var marca = String(f[2]||'').trim();
    var modelo = String(f[3]||'').trim();
    var pn = String(f[4]||'').trim();
    var manoDeObra = Number(f[5])||0;
    var precioContadoFinal = Number(f[6])||0;
    var precioTarjeta = Number(f[7])||0;
    var precioEn3Cuotas = Number(f[8])||0;
    if(!nombre) return;
    var res = agregarItemCatalogoAccesorios_(nombre, precio, marca, modelo, pn, manoDeObra, precioContadoFinal, precioTarjeta, precioEn3Cuotas);
    if(res.actualizado) actualizados++; else creados++;
  });
  return {ok:true, creados:creados, actualizados:actualizados};
}

// ============================================================
// REPORTE DE ACCESORIOS — cuántos se vendieron/instalaron de cada uno,
// para Administrativos. Recorre accesoriosItems de todas las entregas.
// ============================================================
function reporteAccesorios_(){
  var porNombre = {}; // nombre -> {cantidad, colocados, pendientes, montoTotal}
  Object.keys(HOJAS).forEach(function(marcaId){
    var sheet = getSheetPorMarca_(marcaId);
    if(!sheet) return;
    var idxAccesorios = -1;
    for(var i=0;i<CAMPOS.length;i++){ if(CAMPOS[i].k==='accesoriosItems'){ idxAccesorios=i; break; } }
    if(idxAccesorios===-1) return;
    var lastRow = sheet.getLastRow();
    if(lastRow<2) return;
    var valores = sheet.getRange(2, idxAccesorios+1, lastRow-1, 1).getValues();
    valores.forEach(function(fila){
      var raw = fila[0];
      if(!raw) return;
      var items = [];
      try{ items = JSON.parse(raw); }catch(e){ return; }
      items.forEach(function(it){
        if(!it.nombre) return;
        if(!porNombre[it.nombre]) porNombre[it.nombre] = {nombre:it.nombre, cantidad:0, colocados:0, pendientes:0, montoTotal:0};
        var p = porNombre[it.nombre];
        p.cantidad++;
        if(it.estado==='colocado'){ p.colocados++; p.montoTotal += Number(it.precio)||0; }
        else p.pendientes++;
      });
    });
  });
  var lista = Object.keys(porNombre).map(function(k){ return porNombre[k]; });
  lista.sort(function(a,b){ return b.cantidad-a.cantidad; });
  return {ok:true, accesorios: lista};
}

// ============================================================
// CENTRO DE PREPARACIÓN DE ENTREGAS — Fase 1
// Ficha de la unidad + estados + checklist configurable + Kanban por
// responsable. Reutiliza el mismo diseño de Kanban que Asignación
// Logística. Ningún vehículo llega al Planning sin pasar por acá — esa
// parte (integración automática con Nueva Entrega) es una fase futura.
// ============================================================
var HOJA_PREPARACION = 'Centro de Preparación';
var HOJA_CHECKLIST_PREPARACION_CONFIG = 'Checklist Preparación (Config)';

var ESTADOS_PREPARACION = [
  'Sin asignar','Asignado','En preparación','Esperando Taller','Esperando Chapa y Pintura',
  'Esperando Accesorios','Esperando Administración','Esperando Patentamiento','Esperando Repuestos',
  'Esperando Lavadero','Esperando Calidad','Bloqueado','Listo para entregar','Agendado','Entregado','Venta caída'
];
var PREP_HEADERS = [
  'ID','Cliente','VIN','Patente','Modelo','Versión','Marca','Sucursal','Vendedor','Administrativo',
  'Fecha Venta','Fecha Prometida','Color','Motor','Responsable','Estado','Prioridad',
  'Checklist (JSON)','Historial (JSON)','FechaCreacion','FechaListoParaEntregar','EntregaVinculadaId','Referencia','Traslado (JSON)','AutoElectrico'
];

function getHojaPreparacion_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_PREPARACION);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_PREPARACION);
    hoja.appendRow(PREP_HEADERS);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,PREP_HEADERS.length).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  // Migración: si la hoja ya existía de antes de sumar FechaListoParaEntregar/EntregaVinculadaId, se agregan solas.
  var colsActuales = hoja.getLastColumn();
  if(colsActuales < PREP_HEADERS.length){
    hoja.getRange(1, colsActuales+1, 1, PREP_HEADERS.length-colsActuales).setValues([PREP_HEADERS.slice(colsActuales)])
      .setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
  }
  return hoja;
}
function getHojaChecklistPreparacionConfig_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_CHECKLIST_PREPARACION_CONFIG);
  if(!hoja){
    hoja = ss.insertSheet(HOJA_CHECKLIST_PREPARACION_CONFIG);
    hoja.appendRow(['Item','Orden','Activo']);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,3).setFontWeight('bold').setBackground('#FF6B4A').setFontColor('#FFFFFF');
    var itemsDefault = ['Campañas','Manual','Llaves','Kit Seguridad','Lavado','Detailing','Combustible','Accesorios','Fusible','Control Final'];
    itemsDefault.forEach(function(it, i){ hoja.appendRow([it, i+1, true]); });
  }
  return hoja;
}
function listarChecklistPreparacionConfig_(){
  var hoja = getHojaChecklistPreparacionConfig_();
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1;i<datos.length;i++){
    var f = datos[i];
    if(!f[0]) continue;
    out.push({item:f[0], orden:Number(f[1])||0, activo:f[2]!==false, fila:i+1});
  }
  out.sort(function(a,b){return a.orden-b.orden;});
  return out;
}
function agregarItemChecklistPreparacionConfig_(nombre){
  if(!nombre) return {ok:false, error:'Falta el nombre del ítem.'};
  var hoja = getHojaChecklistPreparacionConfig_();
  var existentes = listarChecklistPreparacionConfig_();
  if(existentes.some(function(x){return x.item.trim().toLowerCase()===nombre.trim().toLowerCase();})){
    return {ok:false, error:'Ya existe ese ítem en el checklist.'};
  }
  hoja.appendRow([nombre.trim(), existentes.length+1, true]);
  return {ok:true};
}
function eliminarItemChecklistPreparacionConfig_(nombre){
  var existentes = listarChecklistPreparacionConfig_();
  var item = existentes.find(function(x){return x.item===nombre;});
  if(!item) return {ok:false, error:'No se encontró ese ítem.'};
  getHojaChecklistPreparacionConfig_().deleteRow(item.fila);
  return {ok:true};
}

function prepGenerarId_(){
  var props = PropertiesService.getScriptProperties();
  var actual = Number(props.getProperty('PREP_CONTADOR')||0) + 1;
  props.setProperty('PREP_CONTADOR', String(actual));
  return 'PREP-' + new Date().getFullYear() + '-' + String(actual).padStart(4,'0');
}
function prepFilaAObjeto_(fila){
  var checklist = [], historial = [], traslado = null;
  try{ checklist = fila[17] ? JSON.parse(fila[17]) : []; }catch(e){}
  try{ historial = fila[18] ? JSON.parse(fila[18]) : []; }catch(e){}
  try{ traslado = fila[23] ? JSON.parse(fila[23]) : null; }catch(e){}
  return {
    id: fila[0], cliente: fila[1], vin: fila[2], patente: fila[3], modelo: fila[4], version: fila[5],
    marca: fila[6], sucursal: fila[7], vendedor: fila[8], administrativo: fila[9],
    fechaVenta: fila[10], fechaPrometida: fila[11], color: fila[12], motor: fila[13],
    responsable: fila[14], estado: fila[15], prioridad: fila[16],
    checklist: checklist, historial: historial, fechaCreacion: fila[19],
    fechaListoParaEntregar: fila[20] || '', entregaVinculadaId: fila[21] || '', referencia: fila[22] || '',
    traslado: traslado, autoElectrico: fila[24]===true || fila[24]==='true'
  };
}
function listarUnidadesPreparacion_(){
  var hoja = getHojaPreparacion_();
  var datos = hoja.getDataRange().getValues();
  var out = [];
  for(var i=1;i<datos.length;i++){
    if(!datos[i][0]) continue;
    out.push(prepFilaAObjeto_(datos[i]));
  }
  return out;
}

   function crearUnidadPreparacion_(p, autor){
    var hoja = getHojaPreparacion_();
    var id = prepGenerarId_();
    var configItems = listarChecklistPreparacionConfig_().filter(function(x){return x.activo;});
    var checklistInicial = configItems.map(function(c){ return {item:c.item, hecho:false, usuario:'', fecha:'', observaciones:''}; });
    // Si vino tildado "Auto Eléctrico" desde el formulario de Entrega
    // Futura, se lo marca ya hecho en el checklist inicial (con estado
    // "Pendiente" en el envío del cargador, listo para que Logística
    // complete la fecha cuando corresponda).
    if(p.autoElectrico){
      var itemAuto = checklistInicial.find(function(c){ return c.item==='Auto Eléctrico'; });
      if(itemAuto){
        itemAuto.hecho = true;
        itemAuto.usuario = autor || '—';
        itemAuto.fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
        itemAuto.observaciones = JSON.stringify({fecha:'', estado:'Pendiente'});
      }
    }
    var historial = [{fecha: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), texto:'Unidad creada'+(autor?' por '+autor:''), autor: autor||'—'}];
    hoja.appendRow([
      id, p.cliente||'', p.vin||'', p.patente||'', p.modelo||'', p.version||'', p.marca||'', p.sucursal||'',
      p.vendedor||'', p.administrativo||'', (p.fechaVenta?"'"+p.fechaVenta:''), (p.fechaPrometida?"'"+p.fechaPrometida:''), p.color||'', p.motor||'',
      '', 'Sin asignar', p.prioridad||'Media',
      JSON.stringify(checklistInicial), JSON.stringify(historial), new Date(), '', '', p.referencia||'', '', !!p.autoElectrico
    ]);
    return {ok:true, id:id};
  }
// Importación masiva (el frontend ya parseó el Excel a filas con SheetJS).
// Orden esperado de columnas: Cliente, VIN, Patente, Modelo, Versión, Marca,
// Sucursal, Vendedor, Administrativo, FechaVenta, FechaPrometida, Color, Motor, Referencia.
// Si la Referencia o el VIN ya existen en el Centro de Preparación, esa fila
// se saltea — así se puede volver a subir el mismo archivo del día (o uno
// más nuevo que lo pisa) sin generar duplicados.
function importarUnidadesPreparacion_(filas, autor){
  if(!filas || !filas.length) return {ok:false, error:'No llegaron filas para importar.'};
  var existentes = listarUnidadesPreparacion_();
  var referenciasExistentes = {}, vinsExistentes = {};
  existentes.forEach(function(u){
    if(u.referencia) referenciasExistentes[u.referencia] = true;
    if(u.vin) vinsExistentes[u.vin] = true;
  });
  var creadas = 0, saltadas = 0;
  filas.forEach(function(f){
    if(!f[0] && !f[1]) return; // sin cliente ni VIN, salteala
    var referencia = f[13]||'';
    var vin = f[1]||'';
    if((referencia && referenciasExistentes[referencia]) || (vin && vinsExistentes[vin])){ saltadas++; return; }
    crearUnidadPreparacion_({
      cliente:f[0], vin:vin, patente:f[2], modelo:f[3], version:f[4], marca:f[5],
      sucursal:f[6], vendedor:f[7], administrativo:f[8], fechaVenta:f[9], fechaPrometida:f[10],
      color:f[11], motor:f[12], referencia:referencia
    }, autor);
    if(referencia) referenciasExistentes[referencia] = true;
    if(vin) vinsExistentes[vin] = true;
    creadas++;
  });
  return {ok:true, creadas:creadas, saltadas:saltadas};
}
function prepBuscarFila_(id){
  var hoja = getHojaPreparacion_();
  var datos = hoja.getDataRange().getValues();
  for(var i=1;i<datos.length;i++){ if(String(datos[i][0])===String(id)) return {hoja:hoja, fila:i+1, datos:datos[i]}; }
  return null;
}
function prepAgregarHistorial_(id, texto, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  var historial = [];
  try{ historial = encontrado.datos[18] ? JSON.parse(encontrado.datos[18]) : []; }catch(e){}
  historial.push({fecha: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), texto:texto, autor:autor||'—'});
  encontrado.hoja.getRange(encontrado.fila, 19).setValue(JSON.stringify(historial));
  return {ok:true};
}
// Marca (o desmarca/completa) el traslado a otra sucursal de una unidad
// del Centro de Preparación — mismo concepto que ya existe para las
// entregas de Planning, adaptado a esta hoja separada.
function prepMarcarTraslado_(id, datos, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  var traslado = datos || null;
  encontrado.hoja.getRange(encontrado.fila, 24).setValue(traslado ? JSON.stringify(traslado) : '');
  var texto;
  if(!traslado) texto = '📦 Traslado eliminado';
  else if(traslado.completado) texto = '✓ Traslado completado — a "'+(traslado.destino||'sin especificar')+'"';
  else texto = '📦 Marcada para traslado a "'+(traslado.destino||'sin especificar')+'"'+(traslado.obs?' — '+traslado.obs:'');
  prepAgregarHistorial_(id, texto, autor);
  return {ok:true};
}
function prepAsignarResponsable_(id, responsable, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  var estadoActual = encontrado.datos[15];
  encontrado.hoja.getRange(encontrado.fila, 15).setValue(responsable||'');
  if(estadoActual==='Sin asignar' && responsable) encontrado.hoja.getRange(encontrado.fila, 16).setValue('Asignado');
  prepAgregarHistorial_(id, responsable ? 'Asignada a '+responsable : 'Se quitó la asignación', autor);
  return {ok:true};
}
// Antes de dejar pasar una unidad a "Listo para entregar", exige el
// checklist completo (Fase 1 no tiene pendientes/órdenes internas, así que
// por ahora esa es la única regla automática — se puede sumar más adelante
// sin romper nada).
function prepValidarListoParaEntregar_(datos){
  var checklist = [];
  try{ checklist = datos[17] ? JSON.parse(datos[17]) : []; }catch(e){}
  var faltantes = checklist.filter(function(it){ return !it.hecho; }).map(function(it){ return it.item; });
  return {ok: faltantes.length===0, faltantes: faltantes};
}
function prepCambiarEstado_(id, estado, autor){
  if(ESTADOS_PREPARACION.indexOf(estado)===-1) return {ok:false, error:'Estado inválido.'};
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  if(estado==='Listo para entregar'){
    var validacion = prepValidarListoParaEntregar_(encontrado.datos);
    if(!validacion.ok){
      return {ok:false, error:'Todavía falta completar el checklist: '+validacion.faltantes.join(', ')};
    }
  }
  encontrado.hoja.getRange(encontrado.fila, 16).setValue(estado);
  prepAgregarHistorial_(id, 'Cambió a estado "'+estado+'"', autor);
  if(estado==='Listo para entregar'){
    encontrado.hoja.getRange(encontrado.fila, 21).setValue(new Date());
    var cliente = encontrado.datos[1], modelo = encontrado.datos[4], administrativo = encontrado.datos[9], responsable = encontrado.datos[14];
    var usuarioAdmin = resolverUsuarioPorNombre_(administrativo);
    var mensaje = '🚗 Unidad lista para programar entrega — '+cliente+' ('+modelo+') — responsable: '+(responsable||'—');
    crearNotificacion_('prep_lista', id, mensaje, '', '', 'administrativo', usuarioAdmin, autor);
  }
  return {ok:true};
}
function prepCambiarPrioridad_(id, prioridad, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  encontrado.hoja.getRange(encontrado.fila, 17).setValue(prioridad);
  prepAgregarHistorial_(id, 'Prioridad cambiada a '+prioridad, autor);
  return {ok:true};
}
function prepMarcarChecklistItem_(id, itemNombre, hecho, observaciones, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  var checklist = [];
  try{ checklist = encontrado.datos[17] ? JSON.parse(encontrado.datos[17]) : []; }catch(e){}
  var item = checklist.find(function(x){return x.item===itemNombre;});
  if(!item){ item = {item:itemNombre, hecho:false, usuario:'', fecha:'', observaciones:''}; checklist.push(item); }
  item.hecho = !!hecho;
  item.usuario = hecho ? (autor||'—') : '';
  item.fecha = hecho ? Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '';
  if(observaciones!==undefined) item.observaciones = observaciones;
  encontrado.hoja.getRange(encontrado.fila, 18).setValue(JSON.stringify(checklist));
  prepAgregarHistorial_(id, 'Checklist "'+itemNombre+'": '+(hecho?'completado':'desmarcado'), autor);
  return {ok:true, checklist:checklist};
}
// Pisa el checklist completo de una unidad de una — lo usa el frontend
// cuando reconcilia una ficha vieja contra el catálogo vigente (agregó o
// sacó ítems desde que se creó esa unidad), sin tocar lo que ya estaba
// tildado en los ítems que siguen existiendo.
function prepSincronizarChecklist_(id, checklist, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  encontrado.hoja.getRange(encontrado.fila, 18).setValue(JSON.stringify(checklist||[]));
  prepAgregarHistorial_(id, 'Checklist actualizado según el catálogo vigente', autor);
  return {ok:true};
}
function prepEliminarUnidad_(id){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  encontrado.hoja.deleteRow(encontrado.fila);
  return {ok:true};
}

// Vincula la unidad de preparación con la entrega recién creada en el
// Planning — se llama justo después de guardar "Nueva Entrega" cuando vino
// precargada desde acá.
function prepVincularEntrega_(id, entregaId, fecha, autor){
  var encontrado = prepBuscarFila_(id);
  if(!encontrado) return {ok:false, error:'No se encontró la unidad.'};
  encontrado.hoja.getRange(encontrado.fila, 16).setValue('Agendado');
  encontrado.hoja.getRange(encontrado.fila, 22).setValue(entregaId);
  if(fecha) encontrado.hoja.getRange(encontrado.fila, 12).setValue(fecha);
  prepAgregarHistorial_(id, 'Entrega programada en el Planning para el '+(fecha||'—')+' (se le presionó "Programar Entrega" o se cruzó por VIN/dominio)', autor);
  return {ok:true};
}

// Recordatorio de 24hs y alerta de 48hs para unidades que están "Listo para
// entregar" hace rato y todavía nadie programó la entrega. Corre sola una
// vez instalado el trigger (instalarTriggerRecordatoriosPreparacion_, se
// corre a mano UNA VEZ desde el editor).
function revisarRecordatoriosPreparacion_(){
  var hoja = getHojaPreparacion_();
  var datos = hoja.getDataRange().getValues();
  for(var i=1;i<datos.length;i++){
    var fila = datos[i];
    if(!fila[0] || fila[15]!=='Listo para entregar') continue;
    var fechaListo = fila[20];
    if(!fechaListo) continue;
    var horas = (Date.now() - new Date(fechaListo).getTime())/(1000*60*60);
    var historial = [];
    try{ historial = fila[18] ? JSON.parse(fila[18]) : []; }catch(e){}
    var ya24 = historial.some(function(h){return h.texto && h.texto.indexOf('[recordatorio24h]')>-1;});
    var ya48 = historial.some(function(h){return h.texto && h.texto.indexOf('[recordatorio48h]')>-1;});
    var usuarioAdmin = resolverUsuarioPorNombre_(fila[9]);
    if(horas>=24 && !ya24){
      crearNotificacion_('prep_recordatorio', fila[0], '⏰ Hace 24hs que "'+fila[1]+'" ('+fila[4]+') está lista para entregar y todavía no se programó la entrega.', '', '', 'administrativo', usuarioAdmin, 'Sistema');
      prepAgregarHistorial_(fila[0], '[recordatorio24h] Recordatorio de 24hs enviado', 'Sistema');
    }
    if(horas>=48 && !ya48){
      crearNotificacion_('prep_alerta', fila[0], '🚨 Hace 48hs que "'+fila[1]+'" ('+fila[4]+') está lista para entregar y todavía no se programó la entrega.', '', '', 'administrativo', usuarioAdmin, 'Sistema');
      prepAgregarHistorial_(fila[0], '[recordatorio48h] Alerta de 48hs enviada', 'Sistema');
    }
  }
}
// Pública (sin "_" al final) para que aparezca en el desplegable "Ejecutar" del editor.
function ejecutarInstalarTriggerRecordatoriosPreparacion(){
  instalarTriggerRecordatoriosPreparacion_();
}
function instalarTriggerRecordatoriosPreparacion_(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='revisarRecordatoriosPreparacion_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('revisarRecordatoriosPreparacion_').timeBased().everyHours(1).create();
}

// ---- Dashboards ----
function parseFechaBackend_(str){
  if(!str) return null;
  var partes = String(str).split(' ')[0].split('/');
  if(partes.length!==3) return null;
  var d = new Date(Number(partes[2]), Number(partes[1])-1, Number(partes[0]));
  return isNaN(d.getTime()) ? null : d;
}
function prepDashboardSupervisor_(){
  var unidades = listarUnidadesPreparacion_();
  var porEstado = {};
  ESTADOS_PREPARACION.forEach(function(e){ porEstado[e]=0; });
  var tiempos = [];
  unidades.forEach(function(u){
    porEstado[u.estado] = (porEstado[u.estado]||0)+1;
    if(u.fechaCreacion && u.fechaListoParaEntregar){
      var ini = new Date(u.fechaCreacion).getTime(), fin = new Date(u.fechaListoParaEntregar).getTime();
      if(fin>ini) tiempos.push((fin-ini)/(1000*60*60*24));
    }
  });
  var tiempoPromedio = tiempos.length ? (tiempos.reduce(function(a,b){return a+b;},0)/tiempos.length) : 0;
  var demoradas = unidades.filter(function(u){
    if(u.estado==='Entregado' || u.estado==='Agendado') return false;
    var f = parseFechaBackend_(u.fechaPrometida);
    return f && f.getTime() < Date.now();
  }).length;
  return {ok:true, porEstado:porEstado, total:unidades.length, tiempoPromedioDias: Math.round(tiempoPromedio*10)/10, demoradas: demoradas};
}
function prepDashboardResponsable_(nombre){
  var unidades = listarUnidadesPreparacion_().filter(function(u){return u.responsable===nombre;});
  var listas = unidades.filter(function(u){return u.estado==='Listo para entregar';}).length;
  var bloqueadas = unidades.filter(function(u){return u.estado==='Bloqueado';}).length;
  var porVencer = unidades.filter(function(u){
    var f = parseFechaBackend_(u.fechaPrometida);
    if(!f) return false;
    var dias = (f.getTime()-Date.now())/(1000*60*60*24);
    return dias>=0 && dias<=2 && u.estado!=='Entregado' && u.estado!=='Agendado';
  }).length;
  var checklistPendiente = unidades.reduce(function(acc,u){
    return acc + (u.checklist||[]).filter(function(it){return !it.hecho;}).length;
  }, 0);
  return {ok:true, total:unidades.length, listas:listas, bloqueadas:bloqueadas, porVencer:porVencer, checklistPendiente:checklistPendiente};
}

// ============================================================
// MIGRACIÓN — agrega {{accesoriosBlock}} a las plantillas de confirmación
// que ya estaban guardadas en la planilla (antes de que existiera ese
// bloque). Se corre UNA SOLA VEZ a mano desde el editor. Es segura: si una
// plantilla ya tiene {{accesoriosBlock}}, no la toca; si no tiene
// {{usadoBlock}} tampoco (para no adivinar dónde insertarlo), la deja
// como está y avisa cuál quedó pendiente de hacer a mano.
// Función pública (sin guión bajo al final) para poder seleccionarla y
// correrla desde el desplegable "Ejecutar" del editor — las que terminan
// en "_" Apps Script las esconde ahí porque las trata como privadas.
function ejecutarMigracionPlantillasAccesorios(){
  migrarPlantillasAgregarAccesoriosBlock_();
}
function migrarPlantillasAgregarAccesoriosBlock_(){
  var sheet = getSS_().getSheetByName('Plantillas');
  var lastRow = sheet.getLastRow();
  if(lastRow<2) return;
  var data = sheet.getRange(2,1,lastRow-1,4).getValues();
  var actualizadas = [], sinTocar = [];
  for(var i=0;i<data.length;i++){
    var marca=data[i][0], tipo=data[i][1], cuerpo=data[i][3];
    if(tipo!=='confirmacion' || !cuerpo) continue;
    if(cuerpo.indexOf('{{accesoriosBlock}}')>-1) continue; // ya la tiene, no la toco
    if(cuerpo.indexOf('{{usadoBlock}}')===-1){ sinTocar.push(marca); continue; }
    var nuevoCuerpo = cuerpo.replace('{{usadoBlock}}', '{{accesoriosBlock}}{{usadoBlock}}');
    sheet.getRange(i+2, 4).setValue(nuevoCuerpo);
    actualizadas.push(marca);
  }
  Logger.log('Plantillas actualizadas: '+actualizadas.join(', ')+(sinTocar.length ? ' — sin tocar (no tenían {{usadoBlock}} para ubicarse): '+sinTocar.join(', ') : ''));
}
// Corré ESTA (sin guión bajo, para que aparezca en el desplegable) UNA
// sola vez. Agrega {{usadoBlock}} a TODAS las plantillas que todavía no
// lo tengan — tanto "confirmacion" como "recordatorio" (antes solo se
// había agregado a confirmación) — así el mensaje de "en caso de
// entregar un usado..." aparece siempre que corresponda, en los dos
// mensajes, en todas las marcas. Si una plantilla ya lo tiene, no la
// toca; si no lo tiene, lo agrega al final del cuerpo.
// Agrega {{usadoBlock}} a las plantillas de "confirmacion" que todavía no
// lo tengan (recordatorio NO lleva este bloque — así lo pidió el dueño).
function ejecutarMigracionUsadoBlockTodasLasPlantillas(){
  var sheet = getSS_().getSheetByName('Plantillas');
  var lastRow = sheet.getLastRow();
  if(lastRow<2) return;
  var data = sheet.getRange(2,1,lastRow-1,4).getValues();
  var actualizadas = [];
  for(var i=0;i<data.length;i++){
    var marca=data[i][0], tipo=data[i][1], cuerpo=data[i][3];
    if(tipo!=='confirmacion' || !cuerpo) continue;
    if(cuerpo.indexOf('{{usadoBlock}}')>-1) continue; // ya la tiene, no la toco
    var nuevoCuerpo = cuerpo + '{{usadoBlock}}';
    sheet.getRange(i+2, 4).setValue(nuevoCuerpo);
    actualizadas.push(marca+' / '+tipo);
  }
  Logger.log('Plantillas con {{usadoBlock}} agregado: '+(actualizadas.length ? actualizadas.join(', ') : '(ninguna — todas ya lo tenían)'));
}
// Corré ESTA UNA sola vez para deshacer lo que agregó la migración
// anterior en las plantillas de "recordatorio" (no correspondía ahí,
// solo en confirmación). Le saca el "{{usadoBlock}}" del final del
// cuerpo, solo si es lo último que hay en el texto (así no toca nada
// que hayas escrito vos a mano después).
function deshacerUsadoBlockDeRecordatorio(){
  var sheet = getSS_().getSheetByName('Plantillas');
  var lastRow = sheet.getLastRow();
  if(lastRow<2) return;
  var data = sheet.getRange(2,1,lastRow-1,4).getValues();
  var revertidas = [], sinTocar = [];
  for(var i=0;i<data.length;i++){
    var marca=data[i][0], tipo=data[i][1], cuerpo=data[i][3];
    if(tipo!=='recordatorio' || !cuerpo) continue;
    if(cuerpo.lastIndexOf('{{usadoBlock}}')===cuerpo.length-'{{usadoBlock}}'.length){
      var nuevoCuerpo = cuerpo.slice(0, cuerpo.length-'{{usadoBlock}}'.length);
      sheet.getRange(i+2, 4).setValue(nuevoCuerpo);
      revertidas.push(marca);
    } else if(cuerpo.indexOf('{{usadoBlock}}')>-1){
      sinTocar.push(marca); // lo tiene pero no al final — puede que ya lo hayas movido a mano, no lo toco
    }
  }
  Logger.log('Recordatorio — {{usadoBlock}} sacado de: '+(revertidas.length?revertidas.join(', '):'(ninguna)')+(sinTocar.length?' — no tocadas por tener el bloque movido de lugar: '+sinTocar.join(', '):''));
}
// ============================================================
// Correr UNA SOLA VEZ, a mano, desde el editor de Apps Script.
// Requiere que ya hayas agregado 'usados' a HOJAS, MARCA_LABEL,
// MARCA_COLOR y MARCA_TEXTO en tu Code.gs (ver instrucciones).
// No borra ni toca ninguna hoja existente — solo crea "Usados"
// si todavía no existe, con los mismos encabezados y formato que
// las demás marcas.
// ============================================================
function agregarHojaUsados(){
  var ss = getSS_();
  var nombre = HOJAS['usados'];
  if(!nombre){
    SpreadsheetApp.getUi().alert('Todavía no agregaste "usados" al diccionario HOJAS en Code.gs. Hacé ese cambio primero.');
    return;
  }
  var headers = CAMPOS.map(function(c){return c.h;});
  var fechaIdx = CAMPOS.findIndex(function(c){return c.k==='fecha';});
  var horaIdx = CAMPOS.findIndex(function(c){return c.k==='hora';});

  var sheet = ss.getSheetByName(nombre);
  if(sheet){
    ss.toast('La hoja "'+nombre+'" ya existía — no se tocó nada.');
    return;
  }
  sheet = ss.insertSheet(nombre);
  var headerRange = sheet.getRange(1,1,1,headers.length);
  headerRange.setValues([headers])
    .setFontWeight('bold')
    .setBackground(MARCA_COLOR['usados'])
    .setFontColor(MARCA_TEXTO['usados'])
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setFontSize(10);
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.autoResizeColumns(1, headers.length);
  CAMPOS.forEach(function(c,i){ if(c.hide) sheet.hideColumns(i+1); });
  sheet.getRange(2, fechaIdx+1, 3000, 1).setNumberFormat('@');
  sheet.getRange(2, horaIdx+1, 3000, 1).setNumberFormat('@');
  sheet.setTabColor(MARCA_COLOR['usados']);
  headerRange.setBorder(null, null, true, null, null, null, MARCA_COLOR['usados'], SpreadsheetApp.BorderStyle.SOLID_THICK);
  try{
    sheet.getRange(1,1,Math.max(sheet.getMaxRows(),2),headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  }catch(e){}

  ss.toast('Hoja "'+nombre+'" creada correctamente. Ya podés cargar entregas de Usados.');
}
// ============================================================
// CONTACTO POSTERIOR — cruce de solo lectura contra la encuesta pública
// de satisfacción 0km (Google Forms post-venta), por VIN o patente.
// No toca nada de la Alerta Temprana (NPS interno) — es un módulo aparte.
// ============================================================

// ID de "Encuesta de Satisfacción 0km - PARIS CARS (respuestas)"
// (sacado de la URL: .../spreadsheets/d/ESTE_ID/edit...)
var ID_ENCUESTA_POSTERIOR = '1rQjwJNERCuMspAi8CEqIwXZCeQywrzF7ylQVQ8HVOd4';

// Normaliza VIN/patente para comparar sin que importen espacios,
// mayúsculas/minúsculas ni guiones — la gente lo tipea de mil formas
// distintas en el formulario ("Ai 124 cn", "AI181WE", etc.).
function normalizarVinPatente_(s){
  return String(s||'').replace(/[\s\-\.]+/g,'').toUpperCase();
}

// Busca la fila cuya columna D (VIN o patente) matchea, por VIN primero
// y si no aparece, por patente. Devuelve la respuesta completa si hay
// coincidencia.
function obtenerEncuestaPosterior_(vin, patente){
  try{
    var ss = SpreadsheetApp.openById(ID_ENCUESTA_POSTERIOR);
    var hoja = ss.getSheets()[0]; // la hoja de respuestas del formulario
    var datos = hoja.getDataRange().getValues();
    if(datos.length < 2) return {ok:true, encontrado:false};

    var idx = {
      fecha:0, email:1, nombre:2, vinPatente:3,
      recomienda:4, atencionAsesor:5, gestionAdmin:6, experienciaEntrega:7,
      usado:8, comentario:9
    };

    var vinN = normalizarVinPatente_(vin);
    var patenteN = normalizarVinPatente_(patente);
    var filaEncontrada = null;

    // 1) Buscar por VIN
    if(vinN){
      for(var i=1; i<datos.length; i++){
        if(normalizarVinPatente_(datos[i][idx.vinPatente]) === vinN){
          filaEncontrada = datos[i];
          break;
        }
      }
    }
    // 2) Si no apareció, buscar por patente
    if(!filaEncontrada && patenteN){
      for(var j=1; j<datos.length; j++){
        if(normalizarVinPatente_(datos[j][idx.vinPatente]) === patenteN){
          filaEncontrada = datos[j];
          break;
        }
      }
    }

    if(!filaEncontrada) return {ok:true, encontrado:false};

    return {
      ok:true, encontrado:true,
      respuesta: {
        fecha: formatFechaGC_(filaEncontrada[idx.fecha]),
        email: filaEncontrada[idx.email],
        nombre: filaEncontrada[idx.nombre],
        vinPatente: filaEncontrada[idx.vinPatente],
        recomienda: filaEncontrada[idx.recomienda],
        atencionAsesor: filaEncontrada[idx.atencionAsesor],
        gestionAdmin: filaEncontrada[idx.gestionAdmin],
        experienciaEntrega: filaEncontrada[idx.experienciaEntrega],
        usado: filaEncontrada[idx.usado],
        comentario: filaEncontrada[idx.comentario]
      }
    };
  }catch(err){
    return {ok:false, error:'No se pudo conectar con la encuesta de satisfacción: '+String(err)};
  }
}

// ============================================================
// AUDITORÍA DE ENTREGA — lectura de la planilla de la app de auditoría
// ------------------------------------------------------------
// Solo LEE. Devuelve, para un VIN, lo que la app de auditoría guardó
// (fases, respuestas, accesorios, hallazgos) para mostrarlo en el
// detalle del cliente. No modifica nada de esa planilla.
// ============================================================

// ID de la planilla "Auditorías de entregas" (la de la app de auditoría).
// Sale de su URL: .../spreadsheets/d/ESTE_ID/edit
var ID_AUDITORIA = '1tRvnC3EyyJwjDO_eD_RaPe962QfJQWFkQvbgALUGah4';

function audSi_(v){ return /^s[ií]$/i.test(String(v == null ? '' : v).trim()); }
function audNo_(v){ return /^no$/i.test(String(v == null ? '' : v).trim()); }
function audLista_(s){ return String(s == null ? '' : s).split('|').filter(function(x){ return x; }); }
function audTexto_(v){
  if(v instanceof Date) return v.toISOString();
  return v == null ? '' : String(v);
}
function audLeerHoja_(ss, nombre){
  var sh = ss.getSheetByName(nombre);
  if(!sh) return [];
  var v = sh.getDataRange().getValues();
  if(v.length < 2) return [];
  var h = v[0].map(function(x){ return String(x).toLowerCase(); });
  var out = [];
  for(var i = 1; i < v.length; i++){
    var o = {};
    for(var j = 0; j < h.length; j++){ o[h[j]] = v[i][j]; }
    out.push(o);
  }
  return out;
}

function obtenerAuditoriaEntrega_(vin){
  try{
    if(!ID_AUDITORIA) return {ok:true, configurado:false};
    var vinN = normalizarVinPatente_(vin);
    if(!vinN) return {ok:true, configurado:true, encontrado:false};
    var ss = SpreadsheetApp.openById(ID_AUDITORIA);
    var esDelVin = function(o){ return normalizarVinPatente_(o.vin) === vinN; };

    var auds = audLeerHoja_(ss, 'Auditorias').filter(esDelVin);
    if(!auds.length) return {ok:true, configurado:true, encontrado:false};
    var aud = {};
    var cruda = auds[auds.length - 1];
    Object.keys(cruda).forEach(function(k){ aud[k] = audTexto_(cruda[k]); });

    var preguntas = audLeerHoja_(ss, 'Preguntas').filter(function(q){ return q.id_pregunta; }).map(function(q){
      return {
        id: String(q.id_pregunta), seccion: String(q.seccion), texto: String(q.texto_pregunta),
        req_foto: audSi_(q.req_foto), fase: Number(q.fase) || 1, critica: audSi_(q.critica), activo: !audNo_(q.activo)
      };
    });

    var ids = [];
    ['firma_auditor', 'firma_responsable', 'firma_cliente'].forEach(function(k){ if(aud[k]) ids.push(aud[k]); });

    var respuestas = {};
    audLeerHoja_(ss, 'Respuestas').filter(esDelVin).forEach(function(r){
      var fotos = audLista_(r.fotos);
      fotos.forEach(function(f){ ids.push(f); });
      respuestas[String(r.id_pregunta)] = {
        r: audTexto_(r.respuesta), obs: audTexto_(r.observacion), fotos: fotos,
        auditor: audTexto_(r.auditor), ts: audTexto_(r.timestamp)
      };
    });

    var accesorios = audLeerHoja_(ss, 'Accesorios').filter(esDelVin).map(function(a){
      var fotos = audLista_(a.fotos);
      fotos.forEach(function(f){ ids.push(f); });
      return { clave: audTexto_(a.clave), item: audTexto_(a.item), inst: audTexto_(a.instalado), fotos: fotos, obs: audTexto_(a.observacion) };
    });

    var hallazgos = audLeerHoja_(ss, 'Hallazgos').filter(esDelVin).map(function(h){
      if(h.foto_resolucion) ids.push(String(h.foto_resolucion));
      return {
        id: audTexto_(h.id), origen: audTexto_(h.origen), descripcion: audTexto_(h.descripcion), responsable: audTexto_(h.responsable),
        estado: audTexto_(h.estado), creado: audTexto_(h.creado), resuelto: audTexto_(h.resuelto),
        nota_resolucion: audTexto_(h.nota_resolucion), foto_resolucion: audTexto_(h.foto_resolucion)
      };
    });

    // Las fotos que se pueden pedir para este VIN (para que no se pueda leer cualquier archivo de Drive).
    try{ CacheService.getScriptCache().put('audids_' + vinN, JSON.stringify(ids), 900); }catch(e){}

    return {ok:true, configurado:true, encontrado:true, auditoria:aud, preguntas:preguntas, respuestas:respuestas, accesorios:accesorios, hallazgos:hallazgos};
  }catch(err){
    return {ok:false, error:'No se pudo leer la planilla de auditorías: ' + String(err)};
  }
}

// Ejecutala UNA vez a mano desde el editor (menú de funciones > autorizarAuditoria > Ejecutar)
// para aceptar los permisos nuevos (Drive y la planilla de auditorías). Después no hace falta.
function autorizarAuditoria(){
  DriveApp.getRootFolder();
  if(ID_AUDITORIA) SpreadsheetApp.openById(ID_AUDITORIA);
  Logger.log('Permisos OK');
}

// Devuelve una foto de la auditoría como data URL (imagen en base64).
function obtenerFotoAuditoria_(vin, id){
  try{
    if(!ID_AUDITORIA) return {ok:false, error:'La auditoría no está configurada'};
    id = String(id || '');
    var vinN = normalizarVinPatente_(vin);
    var cache = CacheService.getScriptCache();
    var permitidas = cache.get('audids_' + vinN);
    if(!permitidas){ obtenerAuditoriaEntrega_(vin); permitidas = cache.get('audids_' + vinN); }
    if(!permitidas || JSON.parse(permitidas).indexOf(id) < 0) return {ok:false, error:'Foto no encontrada'};
    var blob = DriveApp.getFileById(id).getBlob();
    return {ok:true, data:'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes())};
  }catch(err){
    return {ok:false, error:String(err)};
  }
}

// ============================================================
// Cruce MASIVO de Contacto Posterior — revisa TODAS las entregas
// pendientes de una sola vez (lee la hoja pública una sola vez, en vez de
// una consulta por auto). Pensada para correr sola, disparada por un
// trigger de tiempo (ver instalarTriggerCruceContactoPosterior más
// abajo) — así no hace falta que alguien abra cada ficha para que se
// entere si el cliente ya respondió.
// ============================================================
function cruzarContactoPosteriorMasivo_(){
  var ss = SpreadsheetApp.openById(ID_ENCUESTA_POSTERIOR);
  var hoja = ss.getSheets()[0];
  var datos = hoja.getDataRange().getValues();
  var idx = {
    fecha:0, email:1, nombre:2, vinPatente:3,
    recomienda:4, atencionAsesor:5, gestionAdmin:6, experienciaEntrega:7,
    usado:8, comentario:9
  };
  var mapaPorVin = {};
  for(var i=1;i<datos.length;i++){
    var v = normalizarVinPatente_(datos[i][idx.vinPatente]);
    if(v && !mapaPorVin[v]) mapaPorVin[v] = datos[i];
  }

  var todas = getEntregas();
  var ahora = Date.now();
  var TRES_DIAS_MS = 3*24*60*60*1000;
  var revisados = 0, encontrados = 0;

  todas.forEach(function(r){
    if(!r.chasis && !r.dominio) return; // sin VIN ni patente, no se puede cruzar
    var cache = null;
    try{ cache = r.contactoPosteriorData ? JSON.parse(r.contactoPosteriorData) : null; }catch(e){}
    if(cache && cache.encontrado) return; // ya está encontrado — no se toca más, como pediste
    if(cache && cache.fechaUltimoIntento && (ahora - cache.fechaUltimoIntento) < TRES_DIAS_MS) return; // todavía no toca reintentar esta

    revisados++;
    var vinN = normalizarVinPatente_(r.chasis);
    var patN = normalizarVinPatente_(r.dominio);
    var fila = (vinN && mapaPorVin[vinN]) || (patN && mapaPorVin[patN]);
    var nuevoCache;
    if(fila){
      nuevoCache = {
        buscado:true, encontrado:true, fechaUltimoIntento: ahora,
        respuesta: {
          fecha: formatFechaGC_(fila[idx.fecha]), email: fila[idx.email], nombre: fila[idx.nombre],
          vinPatente: fila[idx.vinPatente], recomienda: fila[idx.recomienda], atencionAsesor: fila[idx.atencionAsesor],
          gestionAdmin: fila[idx.gestionAdmin], experienciaEntrega: fila[idx.experienciaEntrega],
          usado: fila[idx.usado], comentario: fila[idx.comentario]
        }
      };
      encontrados++;
    } else {
      nuevoCache = {buscado:true, encontrado:false, fechaUltimoIntento: ahora};
    }
    updateEntregaFields(r.marca, r.id, {contactoPosteriorData: JSON.stringify(nuevoCache)});
  });

  return {ok:true, revisados:revisados, encontrados:encontrados};
}

// Corré ESTA función UNA sola vez, a mano, desde el editor de Apps Script
// (▶ al lado de "instalarTriggerCruceContactoPosterior" arriba, elegís
// esta función y le das Ejecutar). Deja instalado el reloj que corre
// cruzarContactoPosteriorMasivo_ dos veces por día, solo, para siempre —
// no hace falta volver a correr esto de nuevo después.
function instalarTriggerCruceContactoPosterior(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='cruzarContactoPosteriorMasivo_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('cruzarContactoPosteriorMasivo_').timeBased().everyHours(12).create();
}
 // Junta login + carga inicial de datos en un solo viaje de red, para
  // que entrar a la app sea más rápido (antes eran 2 pedidos seguidos).
  // No reemplaza ni modifica login_/getEntregas/getConfig — solo las
  // encadena.
  function loginYCargarTodo_(usuario, password){
    var res = login_(usuario, password);
    if(res.error) return res;
    res.entregas = getEntregas();
    res.config = getConfig();
    return res;
  }