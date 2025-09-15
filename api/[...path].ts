import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from '../backend/src/config/database';
import testRoutes from '../backend/src/routes/test';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(compression());

const origins: string[] = [
  'http://localhost:3000',
  'https://www.newsbuildr.com',
  'https://newsbuildr.com',
  'http://www.newsbuildr.com',
  'http://newsbuildr.com'
];

if (process.env.CORS_ORIGIN) {
  origins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/test', testRoutes);
app.use('/auth', require('../backend/src/routes/auth'));
app.use('/newsletters', require('../backend/src/routes/newsletters'));
app.use('/posts', require('../backend/src/routes/posts'));
app.use('/subscribers', require('../backend/src/routes/subscribers'));
app.use('/templates', require('../backend/src/routes/templates'));
app.use('/segments', require('../backend/src/routes/segments'));
app.use('/payments', require('../backend/src/routes/payments'));
app.use('/ai', require('../backend/src/routes/ai'));
app.use('/upload', require('../backend/src/routes/upload'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Newsletter Platform API',
    status: 'running',
    endpoints: ['/health', '/auth', '/newsletters', '/posts', '/ai'],
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

export default app;