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

    const upstream = await fetch(target.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow'
    });

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
