// Service Worker mejorado para PWA optimizada
const CACHE_NAME = 'tec-community-v1';
const API_CACHE_NAME = 'tec-community-api-v1';
const STATIC_CACHE_NAME = 'tec-community-static-v1';

// URLs críticas para cachear
const URLS_TO_CACHE = [
  '/',
  '/dashboard',
  '/login',
  '/users',
  '/profile',
  '/manifest.json',
  '/logoTec.png',
  '/icon-512x512.png'
];

// API endpoints importantes
const API_URLS_TO_CACHE = [
  '/api/global',
  '/api/users/me',
  '/api/auth/me'
];

// Install event - Cache optimizado
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Install - PWA Optimizada');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(URLS_TO_CACHE);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - Limpieza inteligente
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activate - Limpiando caché antigua');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return !['tec-community-v1', 'tec-community-api-v1', 'tec-community-static-v1'].includes(cacheName);
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - Estrategias inteligentes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API requests - Network First con timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE_NAME, 3000));
    return;
  }
  
  // Assets estáticos - Cache First
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.url.includes('/icon-')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
    return;
  }
  
  // Navigation - Network First con fallback rápido
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
    return;
  }
  
  // Default - Network First
  event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

// Network First con timeout optimizado
async function networkFirstWithTimeout(request, cacheName, timeout = 3000) {
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('⚠️ Network failed, usando caché:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Respuesta de fallback para API
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'Conexión no disponible' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network First Strategy optimizada
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network failed, usando caché:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache First Strategy optimizada
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Actualizar en background si es posible
    fetch(request).then(response => {
      if (response && response.status === 200) {
        caches.open(cacheName).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('💥 Tanto caché como red fallaron para:', request.url);
    throw error;
  }
}

// Push notifications mejoradas
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recibida');
  
  let notificationData = {
    title: 'Tec Community',
    body: 'Tienes una nueva notificación',
    icon: '/logoTec.png',
    badge: '/logoTec.png',
    image: '/icon-512x512.png',
    tag: 'tec-community-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {
      timestamp: Date.now(),
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: '👁️ Ver más',
        icon: '/logoTec.png'
      },
      {
        action: 'dismiss',
        title: '❌ Cerrar',
        icon: '/logoTec.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error al parsear push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handler mejorado
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification click:', event.action);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Si ya hay una ventana abierta, enfocarla
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          // Si no, abrir nueva ventana
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Solo cerrar la notificación
    console.log('🚫 Notification dismissed');
  } else {
    // Default action - abrir app
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Background sync mejorado
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  try {
    console.log('🔄 Ejecutando sincronización en background...');
    
    // Aquí puedes implementar lógica de sincronización
    // Por ejemplo, enviar datos en cola, actualizar caché, etc.
    
    // Ejemplo: Sincronizar datos pendientes
    const pendingData = await getStoredPendingData();
    
    if (pendingData && pendingData.length > 0) {
      for (const data of pendingData) {
        try {
          await fetch(data.url, {
            method: data.method,
            headers: data.headers,
            body: data.body
          });
          await removePendingData(data.id);
        } catch (error) {
          console.log('❌ Error syncing:', error);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Background sync failed:', error);
  }
}

// Utilidades para datos pendientes
async function getStoredPendingData() {
  // Implementar según necesidades (IndexedDB, localStorage, etc.)
  return [];
}

async function removePendingData(id) {
  // Implementar según necesidades
  console.log('✅ Removed pending data:', id);
}

// Manejo de mensajes del main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { data } = event.data;
    self.registration.showNotification(data.title, data);
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Error handling global
self.addEventListener('error', (event) => {
  console.error('🚨 Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Service Worker Unhandled Rejection:', event.reason);
});

console.log('🎉 Service Worker PWA Optimizado cargado correctamente');
