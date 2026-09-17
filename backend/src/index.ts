import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for all routes (Next.js FE on port 3000 or any client)
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Root Hello Endpoint
app.get('/', (req, res) => {
  res.json({
    app: 'OTEWE Backend API',
    team: 'RELAY - ASE Lab 2026',
    docs: '/api/health',
  });
});

app.listen(PORT, () => {
  console.log(`⚡️ OTEWE Server running on http://localhost:${PORT}`);
});
