// Service worker mínimo — solo para que Chrome/Android permitan instalar la app.
// A propósito NO cachea nada, así siempre se ve la versión más nueva del sitio.
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ self.clients.claim(); });
self.addEventListener('fetch', function(e){
  // Deja pasar todo directo a la red, sin cachear nada.
});
