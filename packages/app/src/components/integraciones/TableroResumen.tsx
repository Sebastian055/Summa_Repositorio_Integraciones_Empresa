import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ApiIcon from '@mui/icons-material/Api';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';

interface ResumenData {
  totalIntegraciones: number;
  activas: number;
  altaCriticidad: number;
  responsablesUnicos: number;
  protocolosUsados: string[];
}

export const TableroResumen = () => {
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumen = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          'http://localhost:7008/api/integraciones/integraciones/stats/resumen',
        );
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        const data = await response.json();
        setResumen(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    fetchResumen();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error: {error}</Typography>
      </Card>
    );
  }

  if (!resumen) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No hay datos disponibles</Typography>
      </Card>
    );
  }

  return (
    <>
      {/* Tarjetas de métricas */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <ApiIcon sx={{ fontSize: 48, color: '#2e7d32', mb: 1 }} />
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {resumen.totalIntegraciones}
            </Typography>
            <Typography sx={{ color: '#666', mt: 1 }}>
              Total integraciones
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 48, color: '#2e7d32', mb: 1 }} />
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {resumen.activas}
            </Typography>
            <Typography sx={{ color: '#666', mt: 1 }}>
              Integraciones activas
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <StorageIcon sx={{ fontSize: 48, color: '#d32f2f', mb: 1 }} />
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {resumen.altaCriticidad}
            </Typography>
            <Typography sx={{ color: '#666', mt: 1 }}>
              Alta criticidad
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {resumen.responsablesUnicos}
            </Typography>
            <Typography sx={{ color: '#666', mt: 1 }}>
              Responsables únicos
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Protocolos disponibles */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Protocolos utilizados en el sistema
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {resumen.protocolosUsados &&
              resumen.protocolosUsados.length > 0 ? (
                resumen.protocolosUsados.map((protocolo: string) => (
                  <Chip
                    key={protocolo}
                    label={protocolo}
                    color="primary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay protocolos registrados
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default TableroResumen;
