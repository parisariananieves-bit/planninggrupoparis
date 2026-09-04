// api/config.js
// Función serverless de Vercel. Se despliega automáticamente si este archivo
// vive en la carpeta /api de la raíz del repo (Vercel detecta esa carpeta
// sola, no hace falta configurar nada extra en vercel.json).
//
// Lee la variable de entorno VITE_API_URL (ya está creada en tu proyecto de
// Vercel: Project Settings > Environment Variables > VITE_API_URL) y se la
// devuelve al frontend como JSON.
//
// Esto es necesario porque este proyecto es HTML estático (sin build de
// Vite/Next/Webpack), así que el navegador nunca podría leer process.env
// directamente — sólo el servidor (esta función) puede.

export default function handler(req, res) {
  const apiUrl = process.env.VITE_API_URL;

  if (!apiUrl) {
    res.status(500).json({ error: 'VITE_API_URL no está configurada en Vercel' });
    return;
  }

  // No cachear: si cambiás la variable en Vercel, se refleja al toque.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ apiUrl });
}
