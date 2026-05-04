import React from 'react';
import { createApp } from '@backstage/frontend-defaults';
import { IntegracionesPage } from './components/integraciones/IntegracionesPage';

// Crear la app (sin usar .createRoot aquí)
const app = createApp({
  features: [], // Sin plugins para que no salga el catálogo
});

// Exportar un COMPONENTE React, NO el elemento
export default function App() {
  return <IntegracionesPage />;
}
