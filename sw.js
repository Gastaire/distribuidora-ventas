
    const CACHE_NAME = 'distribuidora-cache-v3'; // Incrementamos la versión
    const urlsToCache = [
      '/',
      '/index.html', // O el nombre de tu archivo HTML principal
      'https://cdn.tailwindcss.com',
      'https://unpkg.com/react@17/umd/react.development.js',
      'https://unpkg.com/react-dom@17/umd/react-dom.development.js',
      'https://unpkg.com/babel-standalone@6/babel.min.js'
    ];

    // Instalar el SW y guardar los archivos base en el cache
    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('Cache abierto');
            return cache.addAll(urlsToCache);
          })
          .then(() => self.skipWaiting()) // Forzar al nuevo SW a activarse
      );
    });

    // Activar el SW y limpiar caches viejos
    self.addEventListener('activate', event => {
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
          );
        }).then(() => self.clients.claim()) // Tomar control de las pestañas abiertas
      );
    });

    // Estrategia de Fetch: Network First para la API, Cache First para lo demás
    self.addEventListener('fetch', event => {
      if (event.request.url.includes('/api/')) {
        event.respondWith(
          fetch(event.request)
            .catch(() => {
              // Si la red falla, no hacemos nada. La lógica de offline está en la app.
              return new Response(JSON.stringify({ error: "Sin conexión" }), {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              });
            })
        );
        return;
      }

      event.respondWith(
        caches.match(event.request)
          .then(response => {
            return response || fetch(event.request);
          })
      );
    });
