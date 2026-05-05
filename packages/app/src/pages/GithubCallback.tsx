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
      // Si hay error, redirigir a configuraciones
      navigate('/integraciones?tab=configuraciones');
      return;
    }
    
    if (code) {
      // Enviar código al backend
      fetch(`http://localhost:7009/api/auth/github/callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Guardar token
            localStorage.setItem('github_token', data.token);
            
            // Si hay ventana padre (popup), cerrarla
            if (window.opener) {
              window.opener.postMessage({
                type: 'github-auth-success',
                user: data.user,
                token: data.token
              }, '*');
              window.close();
            } else {
              // Si no hay popup, redirigir directamente
              navigate('/integraciones?tab=configuraciones');
            }
          }
        })
        .catch(err => {
          console.error('Error:', err);
          navigate('/integraciones?tab=configuraciones');
        });
    }
  }, [location, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Autenticando con GitHub...</Typography>
    </Box>
  );
};