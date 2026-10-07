// Proxy same-origin para la Web App de Apps Script de Traslados.
// El navegador habla con /api/traslados (mismo dominio del Planning) y
// Vercel hace la llamada server-side a la URL /exec de Apps Script.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const targetUrl = String(body.targetUrl || '').trim();

    if (!targetUrl) {
      res.status(400).json({ error: 'Falta la URL del backend de Traslados.' });
      return;
    }

    let target;
    try {
      target = new URL(targetUrl);
    } catch (_) {
      res.status(400).json({ error: 'La URL del backend de Traslados no es válida.' });
      return;
    }

    // No convertir esta ruta en un proxy abierto. Solo aceptamos Web Apps
    // de Google Apps Script con la ruta /exec.
    const hostOk = target.hostname === 'script.google.com' || target.hostname === 'script.googleusercontent.com';
    const pathOk = target.pathname.startsWith('/macros/s/') && target.pathname.endsWith('/exec');
    if (target.protocol !== 'https:' || !hostOk || !pathOk) {
      res.status(400).json({ error: 'La URL de Traslados debe ser una Web App de Google Apps Script (/exec).' });
      return;
    }

    const payload = JSON.stringify({
      action: body.action,
      params: body.params || {}
    });

    // Apps Script / ContentService procesa el POST y luego puede responder
    // con un 302 hacia una URL temporal de script.googleusercontent.com donde
    // queda disponible el contenido generado. El redirect posterior debe ser
    // un GET: no hay que reenviar el POST al endpoint de salida.
    let upstream = await fetch(currentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Accept': 'application/json, text/plain, */*'
      },
      body: payload,
      redirect: 'manual'
    });

    for (let i = 0; i < 5 && [301, 302, 303, 307, 308].includes(upstream.status); i++) {
      const location = upstream.headers.get('location');
      if (!location) break;
      currentUrl = new URL(location, currentUrl).toString();
      // El primer 302 de ContentService apunta al contenido generado.
      // A partir de aquí se recupera con GET.
      upstream = await fetch(currentUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json, text/plain, */*' },
        redirect: 'manual'
      });
    }

    const text = await upstream.text();
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch (_) {
      parsed = { error: 'El backend de Traslados devolvió una respuesta no JSON.', detalle: text.slice(0, 500) };
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.ok ? 200 : upstream.status).json(parsed);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'No se pudo conectar con el backend de Traslados.', detalle: String(err && err.message || err) });
  }
}
