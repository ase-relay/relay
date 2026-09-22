import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://otewe-relay.vercel.app',
  ],
  credentials: true,
}));

app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Relay API is running smoothly 🚀',
  });
});

// Register Modular API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error Details]:', err);
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`⚡ [server]: Relay Backend is running at http://localhost:${PORT}`);
});
