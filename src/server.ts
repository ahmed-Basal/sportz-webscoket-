import http from 'http';
import path from 'path';
import fs from 'fs';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sportsRouter from './routes/sports';
import { initWebSocket } from './websocket';
import { db, users } from './db/index';
import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec } from './docs/openapi';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket server
initWebSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OpenAPI Spec endpoint
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Scalar Interactive API Documentation
app.use(
  '/docs',
  apiReference({
    pageTitle: 'Real-Time Sports API Documentation',
    theme: 'purple',
    spec: {
      content: openApiSpec,
    },
  })
);

const clientDistPath = path.resolve(process.cwd(), 'client/dist');
const hasClientDist = fs.existsSync(clientDistPath);

if (hasClientDist) {
  app.use(express.static(clientDistPath));
}

// Root Welcome Route or React SPA
app.get('/', (_req: Request, res: Response) => {
  if (hasClientDist) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.json({
      message: 'Real-Time Sports API is running',
      version: '1.0.0',
      documentation: '/docs',
      openapi: '/openapi.json',
      health: '/api/health',
    });
  }
});

// Sports & Real-time Commentary Routes
app.use('/api', sportsRouter);

// Health check Route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Users endpoint
app.get('/api/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const allUsers = await db.select().from(users);
    res.json({ users: allUsers });
  } catch (err) {
    next(err);
  }
});

// 404 Handler for all unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err?.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`Server and WebSocket running on http://localhost:${PORT}`);
});

export { app, server };
