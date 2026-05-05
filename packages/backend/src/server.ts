import express from 'express';
import cors from 'cors';
import { createIntegracionesRouter } from './plugins/integraciones';
import { createAuthRouter } from './plugins/auth';

const app = express();
const port = 7009;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:7008'],
  credentials: true
}));
app.use(express.json());

app.use('/api/integraciones', createIntegracionesRouter());
app.use('/api/auth', createAuthRouter());

app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
  console.log(`📋 API endpoint: http://localhost:${port}/api/integraciones/integraciones`);
  console.log(`🔐 Auth endpoint: http://localhost:${port}/api/auth/github/login`);
});