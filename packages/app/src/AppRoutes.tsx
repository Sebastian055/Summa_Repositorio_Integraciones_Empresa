import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { IntegracionesPage } from './components/integraciones/IntegracionesPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirige la raíz a integraciones */}
      <Route path="/" element={<Navigate to="/integraciones" replace />} />
      <Route path="/integraciones" element={<IntegracionesPage />} />
      {/* Opcional: si quieres mantener otras rutas, añádelas aquí */}
    </Routes>
  );
};
