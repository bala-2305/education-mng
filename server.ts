import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import authRoutes from './server/routes/auth';
import studentRoutes from './server/routes/students';
import staffRoutes from './server/routes/staff';
import campusLifeRoutes from './server/routes/campusLife';
import fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database Connection
  let MONGODB_URI = process.env.MONGODB_URI;
  let isInMemory = false;

  if (!MONGODB_URI) {
    console.log('No MONGODB_URI provided. Starting in-memory MongoDB server for development...');
    const mongoServer = await MongoMemoryServer.create();
    MONGODB_URI = mongoServer.getUri();
    isInMemory = true;
  }
  
  mongoose.connect(MONGODB_URI)
    .then(() => console.log(`Connected to MongoDB at ${isInMemory ? 'in-memory server' : 'remote server'}`))
    .catch((err) => console.error('MongoDB connection error:', err));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/campus-life', campusLifeRoutes);

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbState: mongoose.connection.readyState });
  });

  // Vite Middleware (for development)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
