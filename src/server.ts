import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import cors from 'cors';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

const startServer = async () => {
  const app = express();
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    appType: 'spa',
  });

  // Configure CORS
  app.use(cors());

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files
  app.use(express.static(resolve(__dirname, '../dist')));

  // Redirect root to dashboard
  app.get('/', (req, res) => {
    res.redirect(301, '/dashboard?tab=dashboard');
  });

  // Handle client-side routing
  app.get('*', (req, res, next) => {
    const url = req.url;
    
    // Skip API routes
    if (url.startsWith('/api/')) {
      return next();
    }

    // For all other routes, serve the index.html
    res.sendFile(resolve(__dirname, '../dist/index.html'));
  });

  const port = process.env.PORT || 3000;
  const server = createServer(app);

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
}); 