import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { IntegracionesPage } from './components/integraciones/IntegracionesPage';
import { GithubCallback } from './pages/GithubCallback';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirige la raíz a integraciones */}
      <Route path="/" element={<Navigate to="/integraciones" replace />} />
      <Route path="/integraciones" element={<IntegracionesPage />} />
      {/* Ruta para el callback de GitHub */}
      <Route path="/auth/github/callback" element={<GithubCallback />} />
    </Routes>
  );
};