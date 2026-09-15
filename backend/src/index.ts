import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

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
