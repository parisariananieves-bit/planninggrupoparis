// ============================================================
// SERVICIOS
// ============================================================

function listaDesdeTexto(texto) {
  if (!texto) return [];
  return String(texto).split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
}

// Las preguntas se guardan como JSON: [{ texto, tipo }], tipo es
// 'si_no' o 'texto'. Si la planilla todavía tiene el formato viejo
// (una línea de texto por pregunta, sin JSON), se interpreta cada
// línea como una pregunta de Sí/No, para no perder lo ya cargado.
function parsearPreguntas(valor) {
  if (!valor) return [];
  try {
    var parsed = JSON.parse(valor);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // no era JSON — formato viejo
  }
  return listaDesdeTexto(valor).map(function(texto) { return { texto: texto, tipo: 'si_no' }; });
}

function getServicios(params) {
  var sheet = getSheet('SERVICIOS');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var servicios = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) {
    var o = rowToObj(headers, r);
    var receta = [];
    try { receta = o['Receta'] ? JSON.parse(o['Receta']) : []; } catch (e) { receta = []; }
    return {
      id: String(o['ID'] || ''),
      nombre: String(o['Nombre'] || ''),
      descripcion: String(o['Descripción'] || ''),
      duracion: Number(o['Duración (min)']) || 0,
      precio: Number(o['Precio']) || 0,
      activo: o['Activo'] !== 'NO' && o['Activo'] !== false,
      cuidados: {
        antes: listaDesdeTexto(o['Cuidados Antes']),
        despues: listaDesdeTexto(o['Cuidados Después']),
        importante: String(o['Cuidados Importante'] || ''),
      },
      preguntas: parsearPreguntas(o['Preguntas']),
      costoManoObra: Number(o['Costo Mano de Obra']) || 0,
      receta: receta,
      fotoUrl: String(o['Foto URL'] || ''),
    };
  });

  if (params && params.soloActivos === 'true') {
    servicios = servicios.filter(function(s) { return s.activo; });
  }
  return servicios;
}

function getServicioPorNombre(nombre) {
  var servicios = getServicios();
  for (var i = 0; i < servicios.length; i++) {
    if (servicios[i].nombre === nombre) return servicios[i];
  }
  return null;
}

function addServicio(body) {
  var sheet = getSheet('SERVICIOS');
  var id = generateId('SRV');

  var fotoUrl = '';
  if (body.fotoBase64) {
    try {
      fotoUrl = subirFotoServicio(body.nombre, body.fotoBase64, body.fotoMimeType, body.fotoNombre);
    } catch (e) {
      fotoUrl = '';
    }
  }

  sheet.appendRow([
    id, body.nombre, body.descripcion || '', body.duracion || 0, body.precio || 0, 'SI',
    (body.cuidados && body.cuidados.antes || []).join('\n'),
    (body.cuidados && body.cuidados.despues || []).join('\n'),
    (body.cuidados && body.cuidados.importante) || '',
    JSON.stringify(body.preguntas || []),
    Number(body.costoManoObra) || 0,
    JSON.stringify(body.receta || []),
    fotoUrl
  ]);
  return { id: id };
}

function updateServicio(body) {
  var sheet = getSheet('SERVICIOS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Servicio no encontrado');

  var fila = rowIndex + 1;
  function setCol(nombreCol, valor) {
    var idx = headers.indexOf(nombreCol);
    if (idx > -1) sheet.getRange(fila, idx + 1).setValue(valor);
  }

  if (body.nombre !== undefined)      setCol('Nombre', body.nombre);
  if (body.descripcion !== undefined) setCol('Descripción', body.descripcion);
  if (body.duracion !== undefined)    setCol('Duración (min)', Number(body.duracion));
  if (body.precio !== undefined)      setCol('Precio', Number(body.precio));
  if (body.activo !== undefined)      setCol('Activo', body.activo ? 'SI' : 'NO');
  if (body.cuidados) {
    if (body.cuidados.antes !== undefined)       setCol('Cuidados Antes', body.cuidados.antes.join('\n'));
    if (body.cuidados.despues !== undefined)     setCol('Cuidados Después', body.cuidados.despues.join('\n'));
    if (body.cuidados.importante !== undefined)  setCol('Cuidados Importante', body.cuidados.importante);
  }
  if (body.preguntas !== undefined) setCol('Preguntas', JSON.stringify(body.preguntas));
  if (body.costoManoObra !== undefined) setCol('Costo Mano de Obra', Number(body.costoManoObra));
  if (body.receta !== undefined) setCol('Receta', JSON.stringify(body.receta));

  if (body.fotoBase64) {
    try {
      var nombreServ = body.nombre || String(data[rowIndex][headers.indexOf('Nombre')]);
      var fotoUrl = subirFotoServicio(nombreServ, body.fotoBase64, body.fotoMimeType, body.fotoNombre);
      setCol('Foto URL', fotoUrl);
    } catch (e) {
      // no interrumpe la edición si falla la subida de foto
    }
  }
  if (body.fotoUrlExistente) {
    setCol('Foto URL', body.fotoUrlExistente);
  }

  return { ok: true };
}

// ============================================================
// TURNOS
// ============================================================

function getTurnos(params) {
  var sheet = getSheet('TURNOS');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var turnos = data.slice(1).filter(function(r) { return r[0]; }).map(function(r) {
    var o = rowToObj(headers, r);
    var fecha = o['Fecha'] instanceof Date ? o['Fecha'] : new Date(o['Fecha']);
    var respuestas = {};
    try { respuestas = o['Respuestas'] ? JSON.parse(o['Respuestas']) : {}; } catch (e) { respuestas = {}; }
    return {
      id: String(o['ID'] || ''),
      fecha: fecha instanceof Date && !isNaN(fecha) ? Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(o['Fecha']),
      hora: horaComoTexto(o['Hora'], ''),
      cliente: String(o['Cliente'] || ''),
      telefono: String(o['Teléfono'] || ''),
      email: String(o['Email'] || ''),
      servicio: String(o['Servicio'] || ''),
      profesional: String(o['Profesional'] || ''),
      estado: String(o['Estado'] || 'confirmado').toLowerCase(),
      notas: String(o['Notas'] || ''),
      fechaCreacion: o['Fecha Creación'] instanceof Date ? o['Fecha Creación'].toISOString() : '',
      alergias: String(o['Alergias'] || ''),
      condiciones: String(o['Condiciones'] || ''),
      consentimiento: o['Consentimiento'] === 'SI',
      respuestas: respuestas,
      fotoUrl: String(o['Foto URL'] || ''),
      cobrado: o['Cobrado'] !== 'NO',
      duracion: Number(o['Duración (min)']) || 0,
      notaEncuesta: o['Nota Encuesta'] !== '' && o['Nota Encuesta'] !== undefined ? Number(o['Nota Encuesta']) : null,
      comentarioEncuesta: String(o['Comentario Encuesta'] || ''),
    };
  });

  if (params && params.desde) {
    turnos = turnos.filter(function(t) { return t.fecha >= params.desde; });
  }
  if (params && params.hasta) {
    turnos = turnos.filter(function(t) { return t.fecha <= params.hasta; });
  }
  if (params && params.estado) {
    turnos = turnos.filter(function(t) { return t.estado === params.estado; });
  }

  return turnos.sort(function(a, b) {
    return (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
  });
}

// Usada tanto por el panel interno como por la página pública de
// reserva (/reservar). No requiere login — solo la API_KEY general.
function addTurno(body) {
  if (!body.fecha || !body.hora || !body.cliente || !body.servicio) {
    throw new Error('Faltan datos obligatorios del turno');
  }

  var servicioInfo = getServicioPorNombre(body.servicio);
  var duracion = (servicioInfo && servicioInfo.duracion) || 60;

  var configActual = getConfig();
  if (configActual.fechasBloqueadas.indexOf(body.fecha) > -1) {
    throw new Error('Ese día no se atiende. Elegí otra fecha, por favor.');
  }

  var fotoUrl = '';
  if (body.fotoBase64) {
    try {
      fotoUrl = subirFotoTurno(body.cliente, body.fotoBase64, body.fotoMimeType, body.fotoNombre);
    } catch (e) {
      // si falla la subida de la foto, el turno se guarda igual
      fotoUrl = '';
    }
  }

  // Bloqueo real: si dos clientas confirman casi al mismo tiempo, Apps
  // Script podría procesar ambos pedidos en paralelo y que ninguno vea
  // el turno del otro todavía. El lock obliga a que se procesen de a
  // uno, así el chequeo de superposición es confiable de verdad.
  var lock = LockService.getScriptLock();
  var id;
  try {
    lock.waitLock(10000); // espera hasta 10 seg si hay otra reserva en curso

    var inicioNuevo = minutosDesdeHHMM(body.hora);
    var finNuevo = inicioNuevo + duracion;

    var existentes = getTurnos({ desde: body.fecha, hasta: body.fecha });
    var superpuesto = existentes.some(function(t) {
      if (t.estado === 'cancelado') return false;
      var inicioExistente = minutosDesdeHHMM(t.hora);
      var finExistente = inicioExistente + (t.duracion || 60);
      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });
    if (superpuesto) {
      throw new Error('Ese horario se superpone con otro turno ya reservado. Elegí otro, por favor.');
    }

    var sheet = getSheet('TURNOS');
    id = generateId('TUR');

    // La columna Hora (C) se fuerza a texto ANTES de escribir el valor,
    // para que Sheets no la auto-convierta a un objeto Fecha (eso rompía
    // la comparación de superposición y dejaba agendar turnos pisados).
    var filaNueva = sheet.getLastRow() + 1;
    sheet.getRange(filaNueva, 3).setNumberFormat('@');

    sheet.appendRow([
      id, new Date(body.fecha + 'T00:00:00'), body.hora, body.cliente,
      body.telefono || '', body.email || '', body.servicio,
      body.profesional || '', 'confirmado', body.notas || '', new Date(),
      body.alergias || '', body.condiciones || '', body.consentimiento ? 'SI' : 'NO',
      body.respuestas ? JSON.stringify(body.respuestas) : '', fotoUrl, 'NO', duracion
    ]);
  } finally {
    lock.releaseLock();
  }

  // Email de confirmación automático (si dejó email). No corta el flujo
  // si falla el envío — el turno ya quedó guardado de todas formas.
  try {
    if (body.email) {
      enviarEmailConfirmacion({
        id: id, fecha: body.fecha, hora: body.hora, cliente: body.cliente,
        email: body.email, servicio: body.servicio
      }, servicioInfo);
    }
  } catch (e) {
    // no interrumpe la reserva por un error de mail
  }

  return { id: id };
}

// Ejecutar UNA VEZ: repara la columna Hora de los turnos que ya quedaron
// guardados como fecha rara (Sat Dec 30 1899...) en vez de texto "HH:mm".
// No borra ni mueve turnos, solo corrige cómo está guardada la hora.
function repararHorasTurnos() {
  var sheet = getSheet('TURNOS');
  var data = sheet.getDataRange().getValues();
  var reparadas = 0;

  for (var i = 1; i < data.length; i++) {
    var valorHora = data[i][2]; // columna C = Hora
    if (valorHora instanceof Date) {
      var horaTexto = Utilities.formatDate(valorHora, Session.getScriptTimeZone(), 'HH:mm');
      sheet.getRange(i + 1, 3).setNumberFormat('@').setValue(horaTexto);
      reparadas++;
    }
  }

  Browser.msgBox('Listo. Se repararon ' + reparadas + ' turno(s) con la hora mal guardada. Revisalos en el Calendario.');
}

function updateTurno(body) {  var sheet = getSheet('TURNOS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Turno no encontrado');

  var fila = rowIndex + 1;
  var estadoAnterior = String(data[rowIndex][headers.indexOf('Estado')] || '');

  // Si se está reprogramando (cambia fecha y/u hora), validamos que no
  // se superponga con otro turno — el mismo chequeo que al reservar.
  if (body.fecha !== undefined || body.hora !== undefined) {
    var nuevaFecha = body.fecha !== undefined ? body.fecha : Utilities.formatDate(data[rowIndex][headers.indexOf('Fecha')], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var nuevaHora  = body.hora !== undefined ? body.hora : horaComoTexto(data[rowIndex][headers.indexOf('Hora')], '');
    var duracionActual = Number(data[rowIndex][headers.indexOf('Duración (min)')]) || 60;

    var inicioNuevo = minutosDesdeHHMM(nuevaHora);
    var finNuevo = inicioNuevo + duracionActual;

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var otros = getTurnos({ desde: nuevaFecha, hasta: nuevaFecha }).filter(function(t) { return t.id !== body.id; });
      var superpuesto = otros.some(function(t) {
        if (t.estado === 'cancelado') return false;
        var inicioExistente = minutosDesdeHHMM(t.hora);
        var finExistente = inicioExistente + (t.duracion || 60);
        return inicioNuevo < finExistente && finNuevo > inicioExistente;
      });
      if (superpuesto) {
        throw new Error('Ese horario se superpone con otro turno ya reservado. Elegí otro, por favor.');
      }
    } finally {
      lock.releaseLock();
    }
  }

  if (body.estado !== undefined)      sheet.getRange(fila, 9).setValue(body.estado);
  if (body.notas !== undefined)       sheet.getRange(fila, 10).setValue(body.notas);
  if (body.profesional !== undefined) sheet.getRange(fila, 8).setValue(body.profesional);
  if (body.fecha !== undefined)       sheet.getRange(fila, 2).setValue(new Date(body.fecha + 'T00:00:00'));
  if (body.hora !== undefined)        sheet.getRange(fila, 3).setNumberFormat('@').setValue(body.hora);
  if (body.cliente !== undefined)     sheet.getRange(fila, 4).setValue(body.cliente);
  if (body.telefono !== undefined)    sheet.getRange(fila, 5).setNumberFormat('@').setValue(body.telefono);
  if (body.email !== undefined)       sheet.getRange(fila, 6).setValue(body.email);
  if (body.cobrado !== undefined) {
    var idxCobrado = headers.indexOf('Cobrado');
    if (idxCobrado > -1) sheet.getRange(fila, idxCobrado + 1).setValue(body.cobrado ? 'SI' : 'NO');
  }

  // Al marcar como completado (recién ahora, no si ya lo estaba), mandar
  // cuidados post-servicio + encuesta por mail si la clienta dejó email.
  if (body.estado === 'completado' && estadoAnterior !== 'completado') {
    try {
      var o = rowToObj(headers, data[rowIndex]);
      if (o['Email']) {
        var servicio = getServicioPorNombre(o['Servicio']);
        enviarEmailCuidadosYEncuesta({
          cliente: o['Cliente'], email: o['Email'], servicio: o['Servicio']
        }, servicio, body.id);
      }
    } catch (e) {
      // no interrumpe el cobro por un error de mail
    }
  }

  return { ok: true };
}

// Borra el turno de la planilla directamente (no lo deja como "cancelado").
// Se usa para sacar turnos de prueba o cargados por error, con cualquier
// fecha — no valida nada, es una eliminación real y definitiva.
function deleteTurno(body) {
  var sheet = getSheet('TURNOS');
  var data = sheet.getDataRange().getValues();

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Turno no encontrado');

  sheet.deleteRow(rowIndex + 1);
  return { ok: true };
}

// Se llama desde la página pública /encuesta (el link que la clienta toca
// en el mail de "Gracias por tu visita"). No requiere login.
function registrarEncuesta(body) {
  var sheet = getSheet('TURNOS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.turnoId)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Turno no encontrado');

  var fila = rowIndex + 1;
  var idxNota = headers.indexOf('Nota Encuesta');
  var idxComentario = headers.indexOf('Comentario Encuesta');

  if (body.nota !== undefined && idxNota > -1) {
    sheet.getRange(fila, idxNota + 1).setValue(Number(body.nota));
  }
  if (body.comentario !== undefined && idxComentario > -1) {
    sheet.getRange(fila, idxComentario + 1).setValue(body.comentario);
  }

  var o = rowToObj(headers, data[rowIndex]);
  return {
    cliente: String(o['Cliente'] || ''),
    servicio: String(o['Servicio'] || ''),
    nota: body.nota !== undefined ? Number(body.nota) : (idxNota > -1 ? Number(data[rowIndex][idxNota]) : null),
  };
}
