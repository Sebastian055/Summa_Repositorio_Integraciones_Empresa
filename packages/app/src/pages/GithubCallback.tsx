import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';

export const GithubCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');
    
    if (error) {
      // Error de GitHub
      if (window.opener) {
        window.opener.postMessage({ type: 'github-auth-error', error: error }, '*');
        window.close();
      } else {
        navigate('/integraciones');
      }
      return;
    }
    
    if (code) {
      // Enviar código al backend
      fetch(`http://localhost:7009/api/auth/github/callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('github_token', data.token);
            // Cerrar ventana emergente y enviar mensaje
            if (window.opener) {
              window.opener.postMessage({
                type: 'github-auth-success',
                user: data.user,
                token: data.token
              }, '*');
              window.close();
            } else {
              navigate('/integraciones');
            }
          } else {
            if (window.opener) {
              window.opener.postMessage({ type: 'github-auth-error', error: data.error }, '*');
              window.close();
            }
          }
        })
        .catch(err => {
          if (window.opener) {
            window.opener.postMessage({ type: 'github-auth-error', error: err.message }, '*');
            window.close();
          }
        });
    } else {
      // No hay código, redirigir a inicio
      navigate('/integraciones');
    }
  }, [location, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Autenticando con GitHub...</Typography>
    </Box>
  );
};