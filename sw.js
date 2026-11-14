// Service worker de Planning de Entregas — Grupo París.
// Regla de oro: la app SIEMPRE se carga de la red cuando hay conexión (así nunca
// queda "trabada" en una versión vieja). La caché solo se usa como respaldo:
//  - sin internet se abre la última versión guardada, con los últimos datos vistos
//    (o una pantalla de "Sin conexión" que se recarga sola),
//  - íconos, logos, fuentes y librerías se sirven al instante desde la caché.
// Nunca se cachean los datos (Apps Script, /api), que siempre van directo a la red.
var VERSION = 'pe-v3';
var CACHE_APP = VERSION + '-app';
var CACHE_EST = VERSION + '-estaticos';
var PRECARGA = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-180.png', '/icons/icon-32.png', '/assets/logos/logo-grupoparis-icon.png'];

var OFFLINE_HTML = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#1D2330"><title>Sin conexión · Planning de Entregas</title>' +
  '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0F131A;color:#EAEDF3;font-family:Inter,system-ui,sans-serif;padding:24px;box-sizing:border-box;text-align:center}' +
  '.c{max-width:360px}img{width:72px;height:72px;border-radius:16px;margin-bottom:18px}h1{font-size:20px;margin:0 0 8px}p{color:#A3ABBD;font-size:14px;line-height:1.5;margin:0 0 22px}' +
  'button{background:#E8A33D;color:#1D2330;border:0;border-radius:10px;padding:12px 22px;font-weight:700;font-size:14px;cursor:pointer}</style></head>' +
  '<body><div class="c"><img src="/icons/icon-192.png" alt=""><h1>Sin conexión</h1><p>No hay internet en este momento. Apenas vuelva la conexión, la app se abre sola.</p>' +
  '<button onclick="location.reload()">Reintentar</button></div>' +
  '<script>window.addEventListener("online",function(){location.reload()});</script></body></html>';

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_APP).then(function(c){
    return Promise.all(PRECARGA.map(function(u){
      return fetch(u, {cache:'reload'}).then(function(r){ if(r && r.ok) return c.put(u, r); }).catch(function(){});
    }));
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf(VERSION) !== 0; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function esEstatico_(url){
  if(url.origin === self.location.origin){
    return /^\/(icons|assets|manual\/img)\//.test(url.pathname) || url.pathname === '/manifest.json';
  }
  return /^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname);
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  // Páginas (abrir la app): red primero, caché solo si no hay internet.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(r){
        // Guardamos la última versión buena de la app para poder abrirla sin internet.
        if(r && r.ok && url.origin === self.location.origin && (url.pathname === '/' || url.pathname === '/index.html')){
          var copia = r.clone();
          caches.open(CACHE_APP).then(function(c){ c.put('/', copia); });
        }
        return r;
      }).catch(function(){
        // Sin internet: abrimos la última versión guardada (muestra los últimos datos
        // vistos) o, si nunca se guardó, la pantalla de "Sin conexión".
        var esApp = url.origin === self.location.origin && (url.pathname === '/' || url.pathname === '/index.html');
        return (esApp ? caches.match('/', {cacheName: CACHE_APP}) : Promise.resolve(null)).then(function(r){
          return r || new Response(OFFLINE_HTML, {headers:{'Content-Type':'text/html; charset=utf-8'}});
        });
      })
    );
    return;
  }

  // Íconos, logos, fuentes y librerías: caché primero y se actualiza en segundo plano.
  if(esEstatico_(url)){
    e.respondWith(caches.open(CACHE_EST).then(function(c){
      return c.match(req).then(function(enCache){
        var red = fetch(req).then(function(r){
          if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
          return r;
        }).catch(function(){ return enCache; });
        return enCache || red;
      });
    }));
    return;
  }
  // Todo lo demás (datos, Apps Script, /api, analytics): directo a la red, sin tocar.
});

self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting') self.skipWaiting();
});
