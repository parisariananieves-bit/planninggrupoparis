function getConfig() {
  var sheet = getSheet('CONFIG');
  return {
    nombreNegocio:   String(sheet.getRange('B4').getValue() || ''),
    email:           String(sheet.getRange('B8').getValue() || ''),
    logoUrl:         String(sheet.getRange('B12').getValue() || ''),
    whatsappContacto: String(sheet.getRange('B10').getValue() || ''),
    iva:             Number(sheet.getRange('B17').getValue()),
    colorPrimario:   String(sheet.getRange('B48').getValue() || '#8CA896'),
    colorSecundario: String(sheet.getRange('B49').getValue() || '#D9A28D'),
    comisiones: {
      efectivo:        Number(sheet.getRange('B36').getValue()),
      debito:          Number(sheet.getRange('B37').getValue()),
      credito1:        Number(sheet.getRange('B38').getValue()),
      credito3:        Number(sheet.getRange('B39').getValue()),
      credito6:        Number(sheet.getRange('B40').getValue()),
      mercadoPago:     Number(sheet.getRange('B41').getValue()),
      transferencia:   Number(sheet.getRange('B42').getValue()),
      cuentaCorriente: Number(sheet.getRange('B43').getValue()),
    },
    turnos: {
      horaInicio:         horaComoTexto(sheet.getRange('B53').getValue(), '09:00'),
      horaFin:             horaComoTexto(sheet.getRange('B54').getValue(), '18:00'),
      duracionSlot:        Number(sheet.getRange('B55').getValue()) || 60,
      requiereFichaSalud:  sheet.getRange('B56').getValue() !== 'NO',
      politicasReserva:    String(sheet.getRange('B58').getValue() || ''),
    },
    gastosFijosMensuales: Number(sheet.getRange('B60').getValue()) || 0,
    fechasBloqueadas: String(sheet.getRange('B62').getValue() || '').split(',').map(function(f) { return f.trim(); }).filter(Boolean),
    sitioUrl: String(sheet.getRange('B64').getValue() || ''),
    mensajeBanner: String(sheet.getRange('B66').getValue() || '✨ Coordinamos tu pedido directo por WhatsApp — respuesta rápida'),
    canalesVenta: String(sheet.getRange('B68').getValue() || 'Mostrador,Feria,Redes sociales').split(',').map(function(c) { return c.trim(); }).filter(Boolean),
    googleClientId: String(sheet.getRange('B70').getValue() || ''),
    googleApiKey: String(sheet.getRange('B71').getValue() || ''),
  };
}

// Si escribís "09:00" en una celda de Sheets, a veces Sheets la detecta
// sola como una celda de tipo Hora y getValue() te devuelve un objeto
// Date en vez del texto — eso rompía el cálculo de horarios disponibles
// (parecía que no quedaba ningún horario libre, en TODOS los días).
// Esta función normaliza cualquiera de los dos casos a texto "HH:mm".
function horaComoTexto(valor, porDefecto) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }
  var texto = String(valor || '').trim();
  return texto || porDefecto;
}

// Permite que el negocio edite toda su configuración desde el módulo
// de Configuración del frontend, sin tocar la planilla a mano.
function updateConfig(body) {
  var sheet = getSheet('CONFIG');

  if (body.nombreNegocio !== undefined) sheet.getRange('B4').setValue(body.nombreNegocio);
  if (body.email !== undefined)         sheet.getRange('B8').setValue(body.email);
  if (body.logoUrl !== undefined)       sheet.getRange('B12').setValue(body.logoUrl);
  if (body.logoBase64) {
    try {
      var logoUrl = subirLogoNegocio(body.logoBase64, body.logoMimeType, body.logoNombre);
      sheet.getRange('B12').setValue(logoUrl);
    } catch (e) {
      // no interrumpe el guardado si falla la subida del logo
    }
  }
  if (body.whatsappContacto !== undefined) sheet.getRange('B10').setNumberFormat('@').setValue(body.whatsappContacto);
  if (body.iva !== undefined)           sheet.getRange('B17').setValue(Number(body.iva));
  if (body.colorPrimario !== undefined)   sheet.getRange('B48').setValue(body.colorPrimario);
  if (body.colorSecundario !== undefined) sheet.getRange('B49').setValue(body.colorSecundario);

  if (body.comisiones) {
    var c = body.comisiones;
    if (c.efectivo !== undefined)        sheet.getRange('B36').setValue(Number(c.efectivo));
    if (c.debito !== undefined)          sheet.getRange('B37').setValue(Number(c.debito));
    if (c.credito1 !== undefined)        sheet.getRange('B38').setValue(Number(c.credito1));
    if (c.credito3 !== undefined)        sheet.getRange('B39').setValue(Number(c.credito3));
    if (c.credito6 !== undefined)        sheet.getRange('B40').setValue(Number(c.credito6));
    if (c.mercadoPago !== undefined)     sheet.getRange('B41').setValue(Number(c.mercadoPago));
    if (c.transferencia !== undefined)   sheet.getRange('B42').setValue(Number(c.transferencia));
    if (c.cuentaCorriente !== undefined) sheet.getRange('B43').setValue(Number(c.cuentaCorriente));
  }

  if (body.turnos) {
    var t = body.turnos;
    if (t.horaInicio !== undefined)  sheet.getRange('B53').setNumberFormat('@').setValue(t.horaInicio);
    if (t.horaFin !== undefined)      sheet.getRange('B54').setNumberFormat('@').setValue(t.horaFin);
    if (t.duracionSlot !== undefined) sheet.getRange('B55').setValue(Number(t.duracionSlot));
    if (t.requiereFichaSalud !== undefined) sheet.getRange('B56').setValue(t.requiereFichaSalud ? 'SI' : 'NO');
    if (t.politicasReserva !== undefined)   sheet.getRange('B58').setValue(t.politicasReserva);
  }

  if (body.gastosFijosMensuales !== undefined) sheet.getRange('B60').setValue(Number(body.gastosFijosMensuales));
  if (body.fechasBloqueadas !== undefined) sheet.getRange('B62').setValue((body.fechasBloqueadas || []).join(','));
  if (body.sitioUrl !== undefined) sheet.getRange('B64').setValue(body.sitioUrl);
  if (body.mensajeBanner !== undefined) sheet.getRange('B66').setValue(body.mensajeBanner);
  if (body.canalesVenta !== undefined) sheet.getRange('B68').setValue((body.canalesVenta || []).join(','));
  if (body.googleClientId !== undefined) sheet.getRange('B70').setValue(body.googleClientId);
  if (body.googleApiKey !== undefined) sheet.getRange('B71').setValue(body.googleApiKey);

  return getConfig();
}
