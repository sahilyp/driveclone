import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireAuth } from './middleware/auth.js';

// Routers
import filesRouter from './routes/files.js';
import foldersRouter from './routes/folders.js';
import sharesRouter from './routes/shares.js';
import linksRouter from './routes/links.js';
import starsRouter from './routes/stars.js';
import searchRouter from './routes/search.js';
import trashRouter from './routes/trash.js';
import publicRouter from './routes/public.js';

const app = express();

// --- Security ---
app.use(
  helmet({
    crossOriginResourcePolicy: false, // allow serving files from other origins
  })
);

// --- CORS ---
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// --- Body parsing ---
app.use(express.json({ limit: '10mb' })); // allow bigger payloads for file metadata
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// --- Protected routes (use requireAuth everywhere) ---
app.use('/folders', requireAuth, foldersRouter);
app.use('/files', requireAuth, filesRouter);
app.use('/shares', requireAuth, sharesRouter);
app.use('/links', requireAuth, linksRouter);
app.use('/stars', requireAuth, starsRouter);
app.use('/search', requireAuth, searchRouter);
app.use('/trash', requireAuth, trashRouter);

// --- Public routes ---
app.use('/public', publicRouter);

// --- Start server ---
const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`✅ API listening on http://localhost:${port}`);
});
