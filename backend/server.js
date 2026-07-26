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

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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

// ========== ALL ROUTES MUST BE REGISTERED HERE ==========
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/bid-packs', bidPackRoutes);   // ✅ MOVED BEFORE 404 HANDLER

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is working!',
    port: PORT,
    frontend: 'http://localhost:5174'
  });
});

// ========== 404 HANDLER – MUST BE LAST ==========
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Backend URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Frontend URL: http://localhost:5174`);
  console.log(`✅ CORS enabled for: http://localhost:5174`);
});