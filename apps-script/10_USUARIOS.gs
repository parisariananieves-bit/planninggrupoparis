// ============================================================
// USUARIOS Y AUTENTICACIÓN
// ============================================================

var TOKEN_DURACION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function generarSalt() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 16);
}

function hashPassword(password, salt) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + password,
    Utilities.Charset.UTF_8
  );
  return raw.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function getUsuariosSheet() {
  return getSheet('USUARIOS');
}

function filaAUsuario(headers, row) {
  var o = rowToObj(headers, row);
  return {
    id: String(o['ID'] || ''),
    nombre: String(o['Nombre'] || ''),
    usuario: String(o['Usuario'] || ''),
    email: String(o['Email'] || ''),
    rol: String(o['Rol'] || ''),
    permisos: String(o['Permisos'] || '').split(',').map(function(p) { return p.trim(); }).filter(Boolean),
    activo: o['Activo'] !== 'NO' && o['Activo'] !== false,
  };
}

// Devuelve el usuario + un token nuevo si el usuario/contraseña son correctos.
function login(body) {
  var sheet = getUsuariosSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var usuarioBuscado = String(body.usuario || '').trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var o = rowToObj(headers, row);
    var usuarioFila = String(o['Usuario'] || '').trim().toLowerCase();
    var emailFila = String(o['Email'] || '').trim().toLowerCase();

    if (usuarioFila === usuarioBuscado || (emailFila && emailFila === usuarioBuscado)) {
      if (o['Activo'] === 'NO') throw new Error('Este usuario está desactivado');

      var hashIngresado = hashPassword(body.password, o['Salt']);
      if (hashIngresado !== o['PasswordHash']) throw new Error('Usuario o contraseña incorrectos');

      var token = Utilities.getUuid();
      var expira = new Date(Date.now() + TOKEN_DURACION_MS);
      var fila = i + 1;
      sheet.getRange(fila, headers.indexOf('Token') + 1).setValue(token);
      sheet.getRange(fila, headers.indexOf('TokenExpira') + 1).setValue(expira);

      var usuario = filaAUsuario(headers, row);
      usuario.token = token;
      return usuario;
    }
  }

  throw new Error('Usuario o contraseña incorrectos');
}

// Valida un token de sesión y devuelve el usuario asociado (o null).
function validarToken(token) {
  if (!token) return null;
  var sheet = getUsuariosSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  for (var i = 1; i < data.length; i++) {
    var o = rowToObj(headers, data[i]);
    if (String(o['Token']) === String(token)) {
      var expira = o['TokenExpira'] instanceof Date ? o['TokenExpira'] : new Date(o['TokenExpira']);
      if (!expira || expira.getTime() < Date.now()) return null;
      if (o['Activo'] === 'NO') return null;
      return filaAUsuario(headers, data[i]);
    }
  }
  return null;
}

function getUsuarios() {
  var sheet = getUsuariosSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).filter(function(r) { return r[0]; }).map(function(r) {
    return filaAUsuario(headers, r);
  });
}

function addUsuario(body) {
  var sheet = getUsuariosSheet();
  var id = generateId('USR');
  var salt = generarSalt();
  var hash = hashPassword(body.password, salt);
  var permisos = Array.isArray(body.permisos) ? body.permisos.join(',') : String(body.permisos || '');

  sheet.appendRow([
    id, body.nombre, body.usuario, body.email || '', hash, salt,
    body.rol || '', permisos, 'SI', '', '', new Date()
  ]);

  return { id: id };
}

function updateUsuario(body) {  var sheet = getUsuariosSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { rowIndex = i; break; }
  }
  if (rowIndex === -1) throw new Error('Usuario no encontrado');

  var fila = rowIndex + 1;
  function setCol(nombreCol, valor) {
    var idx = headers.indexOf(nombreCol);
    if (idx > -1) sheet.getRange(fila, idx + 1).setValue(valor);
  }

  if (body.nombre !== undefined) setCol('Nombre', body.nombre);
  if (body.email !== undefined) setCol('Email', body.email);
  if (body.rol !== undefined) setCol('Rol', body.rol);
  if (body.activo !== undefined) setCol('Activo', body.activo ? 'SI' : 'NO');
  if (body.permisos !== undefined) {
    var permisos = Array.isArray(body.permisos) ? body.permisos.join(',') : String(body.permisos);
    setCol('Permisos', permisos);
  }
  if (body.password) {
    var salt = generarSalt();
    setCol('Salt', salt);
    setCol('PasswordHash', hashPassword(body.password, salt));
  }

  return { ok: true };
}

// Ejecutar UNA VEZ: agrega el permiso "reportes" a todos los usuarios que
// ya tengan "cuotas" (o sea, los que ya usan casi todo el sistema), sin
// tocar a los que tengan permisos bien acotados a propósito.
function agregarPermisoReportes() {
  var sheet = getUsuariosSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var idxPermisos = headers.indexOf('Permisos');
  var actualizados = 0;

  for (var i = 1; i < data.length; i++) {
    var permisos = String(data[i][idxPermisos] || '').split(',').map(function(p) { return p.trim(); }).filter(Boolean);
    if (permisos.indexOf('cuotas') > -1 && permisos.indexOf('reportes') === -1) {
      permisos.push('reportes');
      sheet.getRange(i + 1, idxPermisos + 1).setValue(permisos.join(','));
      actualizados++;
    }
  }

  Browser.msgBox('Listo. Se agregó el permiso "reportes" a ' + actualizados + ' usuario(s).');
}
