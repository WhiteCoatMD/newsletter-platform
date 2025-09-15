import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/database';
import aiRoutes from './routes/ai';
import testRoutes from './routes/test';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(compression());
const origins: string[] = [
  'http://localhost:3000',
  'https://frontend-19fgofw00-mitch-brattons-projects.vercel.app',
  'https://frontend-tan-alpha-36.vercel.app',
  'https://frontend-bvty3ezp4-mitch-brattons-projects.vercel.app',
  'https://frontend-njcsj8h9d-mitch-brattons-projects.vercel.app',
  'https://frontend-i7zve79xf-mitch-brattons-projects.vercel.app'
];

if (process.env.CORS_ORIGIN) {
  origins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: origins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/newsletters', require('./routes/newsletters'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/segments', require('./routes/segments'));
app.use('/api/test', testRoutes);
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai', aiRoutes);
app.use('/api/upload', require('./routes/upload'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Newsletter Platform API',
    status: 'running',
    endpoints: ['/health', '/api/auth', '/api/newsletters', '/api/posts', '/api/ai'],
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});