import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/upload', require('./routes/upload'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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