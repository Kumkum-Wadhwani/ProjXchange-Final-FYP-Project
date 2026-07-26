import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import postsRoutes from "./routes/postsRoutes.js";
import commentsRoutes from "./routes/commentsRoutes.js";
import bidPackRoutes from './routes/bidPackRoutes.js';
import deliverableRoutes from './routes/deliverableRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ UPDATED CORS — works for both local and deployed
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use('/api/deliverables', deliverableRoutes);

// Debug logger
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ========== ALL ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/bid-packs', bidPackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is working!',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ========== 404 HANDLER ==========
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Backend URL: http://localhost:${PORT}/api`);
  console.log(`✅ CORS enabled for: ${process.env.FRONTEND_URL || 'localhost'}`);
});
