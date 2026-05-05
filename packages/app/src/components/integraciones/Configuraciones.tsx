import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  GitHub,
  Brightness4,
  Brightness7,
  CheckCircle,
  Logout,
} from '@mui/icons-material';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar: string;
}

export const Configuraciones = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [gitUser, setGitUser] = useState<GitHubUser | null>(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark';
    if (savedTheme) {
      setThemeMode(savedTheme);
      applyTheme(savedTheme);
    }
    
    checkGitHubSession();
  }, []);

  const applyTheme = (mode: 'light' | 'dark') => {
    document.body.style.backgroundColor = mode === 'dark' ? '#121212' : '#f5f5f5';
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: mode } }));
  };

  const handleThemeToggle = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
    applyTheme(newMode);
    setSuccess(`Modo ${newMode === 'dark' ? 'oscuro' : 'claro'} activado`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const checkGitHubSession = async () => {
    const token = localStorage.getItem('github_token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:7009/api/auth/github/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setGitUser(data.user);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // CORREGIDA: Primero obtener la URL de GitHub, luego abrir la ventana
  const handleGitHubLogin = async () => {
    setGitLoading(true);
    setError(null);
    
    try {
      // 1. Obtener la URL de autenticación del backend
      const response = await fetch('http://localhost:7009/api/auth/github/login');
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
      
      // 2. Abrir ventana emergente con la URL de GitHub
      const width = 800;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.url,
        'github-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // 3. Escuchar mensajes de la ventana popup
      const handleMessage = (event: MessageEvent) => {
        // Aceptar mensajes del callback (origin puede ser localhost:3000)
        if (event.data.type === 'github-auth-success') {
          setGitUser(event.data.user);
          localStorage.setItem('github_token', event.data.token);
          setSuccess(`Bienvenido, ${event.data.user.name || event.data.user.login}`);
          setGitLoading(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setTimeout(() => setSuccess(null), 3000);
        } else if (event.data.type === 'github-auth-error') {
          setError(event.data.error);
          setGitLoading(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (err) {
      setError('Error al conectar con GitHub');
      setGitLoading(false);
    }
  };

  const handleGitHubLogout = () => {
    localStorage.removeItem('github_token');
    setGitUser(null);
    setSuccess('Sesión cerrada correctamente');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={themeMode === 'dark' ? <Brightness4 sx={{ color: '#1976d2' }} /> : <Brightness7 sx={{ color: '#1976d2' }} />}
          title="Apariencia"
          subheader="Personaliza la apariencia de la aplicación"
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>Modo {themeMode === 'light' ? 'claro' : 'oscuro'}</Typography>
            <FormControlLabel
              control={<Switch checked={themeMode === 'dark'} onChange={handleThemeToggle} />}
              label="Activar modo oscuro"
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          avatar={<GitHub sx={{ color: '#1976d2' }} />}
          title="Integración con GitHub"
          subheader="Conecta tu cuenta de GitHub para gestionar repositorios"
        />
        <Divider />
        <CardContent>
          {!gitUser ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={gitLoading ? <CircularProgress size={20} /> : <GitHub />}
                onClick={handleGitHubLogin}
                disabled={gitLoading}
                sx={{ mb: 2 }}
              >
                {gitLoading ? 'Conectando...' : 'Iniciar sesión con GitHub'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Conecta tu cuenta de GitHub para vincular repositorios
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={gitUser.avatar} sx={{ width: 56, height: 56 }} />
                <Box>
                  <Typography variant="h6">{gitUser.name || gitUser.login}</Typography>
                  <Typography variant="body2" color="text.secondary">@{gitUser.login}</Typography>
                </Box>
              </Box>
              <Button variant="outlined" color="error" startIcon={<Logout />} onClick={handleGitHubLogout}>
                Cerrar sesión
              </Button>
            </Box>
          )}

          {success && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>Beneficios:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Vincular repositorios a integraciones" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Acceder al código desde el inventario" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Configuraciones;