import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ITsharing API is running...' });
});

app.use('/api/auth', authRoutes);
app.use('/api', resourceRoutes);
app.use('/api/upload', uploadRoutes);

// Backend Admin Dashboard Routes
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Serve index.html or login.html explicitly for SPA-like navigation in backend dashboard
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/login.html')));

// Use error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
