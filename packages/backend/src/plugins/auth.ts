import { Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la ubicación correcta
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3000/auth/github/callback';

console.log('🔐 [auth.ts] GITHUB_CLIENT_ID:', GITHUB_CLIENT_ID ? '✅ Cargado' : '❌ No encontrado');

export function createAuthRouter(): Router {
  const router = Router();

  // Iniciar login con GitHub
  router.get('/github/login', (req, res) => {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ error: 'GitHub OAuth no está configurado' });
    }
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`;
    res.json({ url: authUrl });
  });

  // Callback después de autenticación
  router.get('/github/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'No se recibió código' });
    }

    try {
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      }, {
        headers: { 'Accept': 'application/json' }
      });
      
      const accessToken = tokenResponse.data.access_token;
      
      if (!accessToken) {
        throw new Error('No se recibió token de acceso');
      }
      
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      res.json({
        success: true,
        user: {
          id: userResponse.data.id,
          login: userResponse.data.login,
          name: userResponse.data.name || userResponse.data.login,
          avatar: userResponse.data.avatar_url
        },
        token: accessToken
      });
    } catch (error) {
      console.error('Error en callback:', error);
      res.status(500).json({ success: false, error: 'Error al autenticar con GitHub' });
    }
  });

  // Verificar usuario actual
  router.get('/github/user', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.json({ success: true, user: null });
    }
    
    try {
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      res.json({
        success: true,
        user: {
          id: userResponse.data.id,
          login: userResponse.data.login,
          name: userResponse.data.name || userResponse.data.login,
          avatar: userResponse.data.avatar_url
        }
      });
    } catch (error) {
      res.json({ success: true, user: null });
    }
  });

  // Cerrar sesión
  router.post('/github/logout', (req, res) => {
    res.json({ success: true });
  });

  return router;
}