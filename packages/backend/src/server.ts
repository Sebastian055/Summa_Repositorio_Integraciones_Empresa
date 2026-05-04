import express from 'express';
import cors from 'cors';
import { createIntegracionesRouter } from './plugins/integraciones';

const app = express();
const port = 7008;

app.use(cors());
app.use(express.json());

app.use('/api/integraciones', createIntegracionesRouter());

app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
  console.log(
    `📋 API endpoint: http://localhost:${port}/api/integraciones/integraciones`,
  );
});
