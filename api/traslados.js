// Proxy same-origin para la Web App de Apps Script de Traslados.
// La URL del backend se configura SOLO en Vercel como TRASLADOS_API_URL.
// El navegador nunca recibe ni necesita conocer la URL de Apps Script.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const targetUrl = String(process.env.TRASLADOS_API_URL || '').trim();

    if (!targetUrl) {
      res.status(500).json({
        error: 'TRASLADOS_API_URL no está configurada en Vercel.'
      });
      return;
    }

    let target;
    try {
      target = new URL(targetUrl);
    } catch (_) {
      res.status(500).json({ error: 'TRASLADOS_API_URL no contiene una URL válida.' });
      return;
    }

    // Evitar que esta función se convierta en un proxy abierto.
    const hostOk = target.hostname === 'script.google.com' || target.hostname === 'script.googleusercontent.com';
    const pathOk = target.pathname.startsWith('/macros/s/') && target.pathname.endsWith('/exec');
    if (target.protocol !== 'https:' || !hostOk || !pathOk) {
      res.status(500).json({
        error: 'TRASLADOS_API_URL debe ser una Web App de Google Apps Script que termine en /exec.'
      });
      return;
    }

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const payload = JSON.stringify({
      action: body.action,
      params: body.params || {}
    });

    // Apps Script /exec puede responder con un 302 hacia
    // script.googleusercontent.com. Node fetch sigue ese redirect y, según
    // las reglas HTTP para 302, transforma el POST redirigido en GET.
    // Esto es exactamente lo que necesita ContentService para entregar el JSON.
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Accept': 'application/json, text/plain, */*'
      },
      body: payload,
      redirect: 'follow'
    });

    const text = await upstream.text();
    let parsed;

    try {
      parsed = text ? JSON.parse(text) : {};
    } catch (_) {
      parsed = {
        error: 'El backend de Traslados devolvió una respuesta no JSON.',
        statusBackend: upstream.status,
        detalle: text.slice(0, 1000)
      };
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.ok ? 200 : upstream.status).json(parsed);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({
      error: 'No se pudo conectar con el backend de Traslados.',
      detalle: String(err && err.message || err)
    });
  }
}
