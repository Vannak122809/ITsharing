import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from '@tailwindcss/vite';

function b2DevMiddleware() {
  return {
    name: 'b2-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/upload-b2', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 200;
          return res.end();
        }
        if (req.method !== 'POST') return next();

        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(bodyStr || '{}');
            const handler = (await import('./api/upload-b2.js')).default;
            await handler({ method: 'POST', body }, {
              setHeader: (k, v) => res.setHeader(k, v),
              status: (code) => {
                res.statusCode = code;
                return {
                  json: (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end: () => res.end()
                };
              }
            });
            } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      server.middlewares.use('/api/download-b2', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.statusCode = 200;
          return res.end();
        }
        if (req.method !== 'GET') return next();

        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const key = urlObj.searchParams.get('key') || urlObj.searchParams.get('file');
          const json = urlObj.searchParams.get('json');
          const handler = (await import('./api/download-b2.js')).default;
          await handler({ method: 'GET', query: { key, json } }, {
            setHeader: (k, v) => res.setHeader(k, v),
            status: (code) => {
              res.statusCode = code;
              return {
                json: (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => res.end()
              };
            }
          });
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    cloudflare(),
    b2DevMiddleware()
  ],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://itsharing.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split Three.js into its own chunk — it's ~500KB
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          // Split Firebase into its own chunk
          if (id.includes('firebase')) {
            return 'firebase-vendor';
          }
          // Split Sentry into its own chunk
          if (id.includes('@sentry')) {
            return 'sentry-vendor';
          }
          // Split framer-motion into its own chunk
          if (id.includes('framer-motion')) {
            return 'framer-vendor';
          }
          // Group remaining node_modules into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
