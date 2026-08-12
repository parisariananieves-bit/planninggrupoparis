// ============================================================
// NOTIFICACIONES POR EMAIL
// Usa MailApp (cuota gratis de Gmail: ~100 mails/día en cuentas
// normales, 1500/día en Workspace). No requiere ningún servicio
// externo ni configuración adicional.
// ============================================================

function nombreNegocioActual() {
  try { return getConfig().nombreNegocio || 'Oletha Beauty'; } catch (e) { return 'Oletha Beauty'; }
}

function coloresDeMarca() {
  try {
    var c = getConfig();
    return { primario: c.colorPrimario || '#8CA896', secundario: c.colorSecundario || '#D9A28D' };
  } catch (e) {
    return { primario: '#8CA896', secundario: '#D9A28D' };
  }
}

function formatearFechaLegible(fechaISO) {
  var d = new Date(fechaISO + 'T00:00:00');
  var opciones = { weekday: 'long', day: 'numeric', month: 'long' };
  return d.toLocaleDateString('es-AR', opciones);
}

// Envoltorio HTML compartido por todos los mails: logo, franja de color
// de marca arriba, tarjeta blanca redondeada, footer con el nombre del
// negocio, WhatsApp de contacto y links a reservar/tienda.
// contenidoHtml es lo único que cambia entre mails.
function armarHtmlMail(contenidoHtml) {
  var negocio = nombreNegocioActual();
  var config = {};
  try { config = getConfig(); } catch (e) {}

  var logoUrl = config.logoUrl || '';
  var whatsapp = config.whatsappContacto || '';
  var sitioUrl = (config.sitioUrl || '').replace(/\/$/, '');

  var footerLinks = '';
  if (whatsapp) {
    footerLinks += '<a href="https://wa.me/' + String(whatsapp).replace(/\D/g, '') + '" style="color:#8CA896;text-decoration:none;margin:0 8px;">WhatsApp: ' + whatsapp + '</a>';
  }
  if (sitioUrl) {
    footerLinks += '<br/><a href="' + sitioUrl + '/reservar" style="color:#8CA896;text-decoration:none;margin:0 8px;">Reservar un turno</a>'
      + '<span style="color:#cbd5e1;">·</span>'
      + '<a href="' + sitioUrl + '/tienda" style="color:#8CA896;text-decoration:none;margin:0 8px;">Ver la tienda</a>';
  }

  return ''
    + '<div style="background:#FBF8F3;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">'
    + '<div style="max-width:480px;margin:0 auto;">'
    + '<div style="text-align:center;padding-bottom:20px;">'
    + (logoUrl
        ? '<img src="' + logoUrl + '" width="64" height="64" style="border-radius:50%;object-fit:cover;" alt="' + negocio + '" />'
        : '')
    + '<p style="font-size:20px;font-weight:bold;color:#1e293b;margin:12px 0 0;">' + negocio + '</p>'
    + '</div>'
    + '<div style="background:#ffffff;border-radius:24px;padding:28px 24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">'
    + contenidoHtml
    + '</div>'
    + '<p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;line-height:1.8;">'
    + negocio
    + (footerLinks ? '<br/>' + footerLinks : '')
    + '</p>'
    + '</div>'
    + '</div>';
}

function enviarEmailConfirmacion(turno, servicio) {
  var negocio = nombreNegocioActual();
  var colores = coloresDeMarca();
  var asunto = 'Turno confirmado — ' + negocio;
  var nombrePila = turno.cliente.split(' ')[0];

  var contenido = ''
    + '<p style="font-size:16px;color:#1e293b;margin:0 0 4px;">¡Hola ' + nombrePila + '!</p>'
    + '<p style="font-size:14px;color:#475569;margin:0 0 20px;">Tu turno quedó confirmado 🎉</p>'
    + '<div style="background:' + colores.primario + '1A;border-radius:16px;padding:16px 18px;margin-bottom:20px;">'
    + '<p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Servicio:</strong> ' + turno.servicio + '</p>'
    + '<p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Fecha:</strong> ' + formatearFechaLegible(turno.fecha) + '</p>'
    + '<p style="margin:0;font-size:14px;color:#1e293b;"><strong>Hora:</strong> ' + turno.hora + 'hs</p>'
    + '</div>'
    + (servicio && servicio.descripcion
        ? '<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 16px;">' + servicio.descripcion + '</p>'
        : '')
    + '<p style="font-size:13px;color:#94a3b8;margin:0;">Cualquier consulta, respondé este mail.</p>';

  MailApp.sendEmail({ to: turno.email, subject: asunto, htmlBody: armarHtmlMail(contenido) });
}

function armarHtmlCuidados(servicio) {
  if (!servicio || (!servicio.cuidados.antes.length && !servicio.cuidados.despues.length)) return '';

  function lista(items) {
    return '<ol style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.7;">'
      + items.map(function(i) { return '<li>' + i + '</li>'; }).join('')
      + '</ol>';
  }

  var html = '<p style="font-size:15px;font-weight:bold;color:#1e293b;margin:20px 0 10px;">Guía de cuidados — ' + servicio.nombre + '</p>';

  if (servicio.cuidados.antes.length) {
    html += '<p style="font-size:12px;font-weight:bold;color:#64748b;text-transform:uppercase;margin:14px 0 4px;">Primeras 24 hs</p>' + lista(servicio.cuidados.antes);
  }
  if (servicio.cuidados.despues.length) {
    html += '<p style="font-size:12px;font-weight:bold;color:#64748b;text-transform:uppercase;margin:14px 0 4px;">Después de las 24 hs</p>' + lista(servicio.cuidados.despues);
  }
  if (servicio.cuidados.importante) {
    html += '<p style="font-size:12px;color:#92400e;background:#fffbeb;border-radius:10px;padding:10px 12px;margin-top:12px;"><strong>Importante:</strong> ' + servicio.cuidados.importante + '</p>';
  }

  return html;
}

// Botones del 1 al 10, cada uno linkeando a la página pública /encuesta
// con la nota ya elegida — así la clienta solo toca un número, no tiene
// que escribir nada. Va con gradiente de color (rojo a verde), como un
// medidor NPS, para que se note más de un vistazo. Necesita que
// Configuración > URL de la app esté cargada; si no está, se omiten.
function colorParaNota(n) {
  // 1-3 rojo, 4-6 ámbar, 7-8 verde clarito, 9-10 verde fuerte (marca)
  if (n <= 3) return '#ef4444';
  if (n <= 6) return '#f59e0b';
  if (n <= 8) return '#84cc16';
  return '#8CA896';
}

function armarHtmlBotonesNota(turnoId) {
  var sitioUrl = '';
  try { sitioUrl = getConfig().sitioUrl; } catch (e) {}
  if (!sitioUrl) return '';

  var base = sitioUrl.replace(/\/$/, '') + '/encuesta?id=' + encodeURIComponent(turnoId) + '&nota=';
  var botones = '';
  for (var n = 1; n <= 10; n++) {
    botones += '<a href="' + base + n + '" style="display:inline-block;width:34px;height:34px;line-height:34px;'
      + 'text-align:center;margin:3px;border-radius:10px;background:' + colorParaNota(n) + ';color:#ffffff;'
      + 'font-size:14px;font-weight:bold;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.15);">' + n + '</a>';
  }
  return '<div style="background:#f8fafc;border-radius:18px;padding:18px;margin-top:20px;text-align:center;">'
    + '<p style="font-size:14px;font-weight:bold;color:#1e293b;margin:0 0 4px;">¿Qué tan probable es que nos recomiendes?</p>'
    + '<p style="font-size:11px;color:#94a3b8;margin:0 0 12px;">Del 1 (nada probable) al 10 (totalmente probable)</p>'
    + '<div>' + botones + '</div>'
    + '</div>';
}

function enviarEmailCuidadosYEncuesta(turno, servicio, turnoId) {
  var asunto = 'Gracias por tu visita — ' + nombreNegocioActual();
  var nombrePila = turno.cliente.split(' ')[0];

  var contenido = ''
    + '<p style="font-size:16px;color:#1e293b;margin:0 0 4px;">¡Hola ' + nombrePila + '! 💜</p>'
    + '<p style="font-size:14px;color:#475569;margin:0 0 4px;">Gracias por tu visita hoy.</p>'
    + armarHtmlCuidados(servicio)
    + armarHtmlBotonesNota(turnoId);

  MailApp.sendEmail({ to: turno.email, subject: asunto, htmlBody: armarHtmlMail(contenido) });
}

// Recordatorio del día anterior. Pensada para correr sola todos los días
// a través de un disparador (trigger) — ver crearTriggerRecordatorios().
function enviarRecordatoriosDeManana() {
  var manana = new Date();
  manana.setDate(manana.getDate() + 1);
  var tz = Session.getScriptTimeZone();
  var fechaManana = Utilities.formatDate(manana, tz, 'yyyy-MM-dd');

  var turnos = getTurnos({ desde: fechaManana, hasta: fechaManana });
  var negocio = nombreNegocioActual();

  turnos.forEach(function(t) {
    if (t.estado !== 'confirmado' || !t.email) return;
    try {
      var contenido = ''
        + '<p style="font-size:16px;color:#1e293b;margin:0 0 4px;">Hola ' + t.cliente.split(' ')[0] + ',</p>'
        + '<p style="font-size:14px;color:#475569;margin:0 0 16px;">Te recordamos tu turno de mañana:</p>'
        + '<div style="background:#8CA8961A;border-radius:16px;padding:16px 18px;">'
        + '<p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Servicio:</strong> ' + t.servicio + '</p>'
        + '<p style="margin:0;font-size:14px;color:#1e293b;"><strong>Hora:</strong> ' + t.hora + 'hs</p>'
        + '</div>'
        + '<p style="font-size:13px;color:#94a3b8;margin:16px 0 0;">¡Te esperamos!</p>';

      MailApp.sendEmail({
        to: t.email,
        subject: 'Recordatorio de tu turno mañana — ' + negocio,
        htmlBody: armarHtmlMail(contenido)
      });
    } catch (e) {
      // sigue con el resto de los turnos aunque uno falle
    }
  });
}

// Ejecutar UNA VEZ desde el editor para que los recordatorios se manden
// solos todos los días a las 18:00, sin que tengas que hacer nada.
function crearTriggerRecordatorios() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'enviarRecordatoriosDeManana') {
      Browser.msgBox('Ya existe el recordatorio automático, no hace falta crear otro.');
      return;
    }
  }
  ScriptApp.newTrigger('enviarRecordatoriosDeManana')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();
  Browser.msgBox('Listo. Todos los días a las 18:00 se van a mandar solos los recordatorios de los turnos del día siguiente.');
}
