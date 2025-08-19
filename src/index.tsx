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

// Main application route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>רמיקוב - משחק הקלפים המותאם לנייד</title>
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
          /* Mobile-first responsive design */
          @media (orientation: landscape) and (max-height: 640px) {
            .game-container {
              height: 100vh;
              overflow: hidden;
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
        <script type="text/babel" src="/static/game-components.js"></script>
        <script type="text/babel" src="/static/game-board.js"></script>
        
        <!-- Main application -->
        <script type="text/babel" src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app