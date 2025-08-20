import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

// Import routes
import { authRoutes } from './routes/auth'
import { gameRoutes } from './routes/game'
import { adminRoutes } from './routes/admin'
import { websocketHandler } from './routes/websocket'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Use JSX renderer for main pages
app.use(renderer)

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/game', gameRoutes)
app.route('/api/admin', adminRoutes)

// WebSocket upgrade handler
app.get('/ws', websocketHandler)

// Serve PWA files from public directory
app.get('/manifest.json', (c) => {
  return c.json({
    "name": "רמיקוב",
    "short_name": "רמיקוב",
    "description": "משחק קלפי רמי מותאם לנייד עם מצב offline",
    "start_url": "/",
    "display": "standalone",
    "orientation": "landscape-primary",
    "theme_color": "#7c3aed",
    "background_color": "#1e40af",
    "scope": "/",
    "lang": "he",
    "dir": "rtl",
    "categories": ["games", "entertainment"],
    "icons": [
      {
        "src": "/static/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/static/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable any"
      }
    ]
  })
})

app.get('/sw.js', (c) => {
  return c.text(`
// Service Worker for רמיקוב PWA
const CACHE_NAME = 'rummikub-v2';
const urlsToCache = [
  '/',
  '/static/app.js',
  '/static/game-components.js',
  '/static/game-board.js',
  '/static/styles.css',
  '/static/icon-192x192.png',
  '/static/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
  `, 200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'no-cache'
  })
})

// Main application route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        
        <!-- PWA Meta Tags -->
        <meta name="application-name" content="רמיקוב">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="רמיקוב">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="msapplication-TileColor" content="#1e40af">
        <meta name="theme-color" content="#7c3aed">
        
        <title>רמיקוב - משחק הקלפים המותאם לנייד</title>
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <!-- Apple Touch Icons -->
        <link rel="apple-touch-icon" href="/static/icon-192x192.png">
        <link rel="apple-touch-icon" sizes="192x192" href="/static/icon-192x192.png">
        <link rel="apple-touch-icon" sizes="512x512" href="/static/icon-512x512.png">
        
        <!-- Favicon -->
        <link rel="icon" type="image/png" sizes="32x32" href="/static/icon-192x192.png">
        <link rel="shortcut icon" href="/static/icon-192x192.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#1e40af',
                  secondary: '#7c3aed',
                  accent: '#f59e0b',
                  success: '#10b981',
                  danger: '#ef4444',
                }
              }
            }
          }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <style>
          /* Mobile landscape optimization - NO SCROLLING */
          body, html {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
          }
          
          #root {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
          }
          
          /* Mobile-first responsive design */
          @media (orientation: landscape) and (max-height: 640px) {
            .game-container {
              height: 100vh;
              overflow: hidden;
            }
            
            /* AuthScreen landscape optimization */
            .auth-landscape {
              height: 100vh !important;
              width: 100vw !important;
              overflow: hidden !important;
              padding: 8px !important;
            }
            
            .auth-container-landscape {
              max-width: none !important;
              max-height: none !important;
              width: 100% !important;
              height: calc(100vh - 16px) !important;
              display: flex !important;
              flex-direction: row-reverse !important;
              align-items: stretch !important;
              gap: 24px !important;
              padding: 16px !important;
            }
          }
          
          /* RTL Support */
          [dir="rtl"] .rtl\\:flex-row-reverse {
            flex-direction: row-reverse;
          }
          
          /* Custom styles for game elements */
          .tile {
            transition: all 0.2s ease;
            user-select: none;
          }
          
          .tile:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          
          .tile.dragging {
            opacity: 0.5;
            transform: rotate(5deg);
          }
          
          .drop-zone {
            transition: all 0.2s ease;
          }
          
          .drop-zone.drag-over {
            background-color: rgba(34, 197, 94, 0.2);
            border-color: #22c55e;
          }
          
          /* Custom scrollbar for mobile */
          ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 2px;
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 min-h-screen">
        <div id="root"></div>
        
        <!-- React and required libraries -->
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        
        <!-- Game components -->
        <script type="text/babel" src="/static/game-components.js?v=${Date.now()}"></script>
        <script type="text/babel" src="/static/game-board.js?v=${Date.now()}"></script>
        
        <!-- Main application -->
        <script type="text/babel" src="/static/app.js?v=${Date.now()}"></script>
        
        <!-- Service Worker Registration & PWA -->
        <script>
          // Service Worker Registration
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                  console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                  console.log('SW registration failed: ', registrationError);
                });
            });
          }
          
          // PWA Install Prompt
          let deferredPrompt;
          window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            e.preventDefault();
            deferredPrompt = e;
            window.deferredPrompt = e;
          });
          
          // PWA Install Success
          window.addEventListener('appinstalled', (evt) => {
            console.log('PWA installed successfully');
          });
          
          // Fullscreen API Support
          function toggleFullscreen() {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err.message);
              });
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }
          }
          
          // Screen Orientation Lock
          function lockOrientation() {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape-primary').catch(err => {
                console.log('Orientation lock failed:', err.message);
              });
            }
          }
          
          // Make functions globally available
          window.toggleFullscreen = toggleFullscreen;
          window.lockOrientation = lockOrientation;
        </script>
    </body>
    </html>
  `)
})

export default app