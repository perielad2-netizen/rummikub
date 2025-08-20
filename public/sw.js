// Service Worker for Rummikub PWA
const CACHE_NAME = 'rummikub-v1.0.0';
const STATIC_CACHE_URLS = [
  '/',
  '/static/app.js',
  '/static/game-components.js', 
  '/static/game-board.js',
  '/static/styles.css',
  '/manifest.json',
  // CDN resources
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('SW: Installation completed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('SW: Activation completed');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and other protocols
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }
        
        // Fallback to network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('SW: Network fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html lang="he" dir="rtl">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>אופליין - רמיקוב</title>
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px;
                      background: linear-gradient(135deg, #1e40af, #7c3aed);
                      color: white;
                      min-height: 100vh;
                      margin: 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    .offline-content {
                      background: rgba(255,255,255,0.1);
                      padding: 30px;
                      border-radius: 20px;
                      backdrop-filter: blur(10px);
                    }
                    h1 { font-size: 2em; margin-bottom: 20px; }
                    p { font-size: 1.2em; line-height: 1.6; }
                    button {
                      background: #10b981;
                      color: white;
                      border: none;
                      padding: 15px 30px;
                      border-radius: 10px;
                      font-size: 1.1em;
                      margin-top: 20px;
                      cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-content">
                    <h1>🎯 אופליין</h1>
                    <p>אין חיבור לאינטרנט כרגע.<br>בדוק את החיבור ונסה שוב.</p>
                    <button onclick="location.reload()">נסה שוב</button>
                  </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            }
            
            throw error;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'game-sync') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  try {
    // Get pending game actions from IndexedDB
    const pendingActions = await getPendingGameActions();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch('/api/game/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': action.authToken
          },
          body: JSON.stringify(action.data)
        });
        
        if (response.ok) {
          await removePendingAction(action.id);
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getPendingGameActions() {
  // Implementation for IndexedDB operations
  return [];
}

async function removePendingAction(id) {
  // Implementation for removing synced actions
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'התקבלה הודעה חדשה במשחק',
    icon: '/static/icon-192x192.png',
    badge: '/static/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'rummikub-notification',
    actions: [
      {
        action: 'open',
        title: 'פתח משחק'
      },
      {
        action: 'close',
        title: 'סגור'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('רמיקוב', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});