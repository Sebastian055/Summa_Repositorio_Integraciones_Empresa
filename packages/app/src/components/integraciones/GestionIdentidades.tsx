import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  Box,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ApiIcon from '@mui/icons-material/Api';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Identidad {
  id: number;
  nombre: string;
  tipo: string;
  email: string;
  descripcion: string;
  activo: boolean;
}

const tiposIdentidad = ['API', 'Sistema', 'Servicio', 'Usuario', 'Aplicacion'];

export const GestionIdentidades = () => {
  const [identidades, setIdentidades] = useState<Identidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Identidad>>({ tipo: 'API', activo: true });
  const [error, setError] = useState<string | null>(null);

  const fetchIdentidades = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:7009/api/integraciones/identidades');
      if (!response.ok) throw new Error('Error al cargar identidades');
      const data = await response.json();
      setIdentidades(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las identidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentidades();
  }, []);

  const handleSave = async () => {
    const url = selectedId
      ? `http://localhost:7009/api/integraciones/identidades/${selectedId}`
      : 'http://localhost:7009/api/integraciones/identidades';
    const method = selectedId ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setDialogOpen(false);
        fetchIdentidades();
        setFormData({ tipo: 'API', activo: true });
        setSelectedId(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al conectar con el servidor');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta identidad?')) {
      try {
        const response = await fetch(`http://localhost:7009/api/integraciones/identidades/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchIdentidades();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const openDialog = (identidad?: Identidad) => {
    setError(null);
    if (identidad) {
      setSelectedId(identidad.id);
      setFormData(identidad);
    } else {
      setSelectedId(null);
      setFormData({ nombre: '', tipo: 'API', email: '', descripcion: '', activo: true });
    }
    setDialogOpen(true);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'API': return 'secondary';
      case 'Sistema': return 'info';
      case 'Servicio': return 'warning';
      case 'Usuario': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography>Cargando identidades...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              <ApiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Catálogo de Identidades
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchIdentidades}
                size="small"
              >
                Actualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openDialog()}
              >
                Nueva Identidad
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Recursos de integración (APIs, Sistemas, Servicios) que pueden ser asociados a escenarios de integración
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {identidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No hay identidades registradas. Haz clic en "Nueva Identidad" para crear una.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  identidades.map((identidad) => (
                    <TableRow key={identidad.id} sx={{ opacity: identidad.activo ? 1 : 0.6 }}>
                      <TableCell>
                        <strong>{identidad.nombre}</strong>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={identidad.tipo} 
                          size="small" 
                          color={getTipoColor(identidad.tipo)}
                        />
                      </TableCell>
                      <TableCell>{identidad.email || '-'}</TableCell>
                      <TableCell>{identidad.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={identidad.activo ? 'Activo' : 'Inactivo'} 
                          size="small" 
                          color={identidad.activo ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => openDialog(identidad)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(identidad.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar identidad */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedId ? 'Editar Identidad' : 'Nueva Identidad'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre"
                required
                value={formData.nombre || ''}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                helperText="Nombre único de la identidad (ej: API Gateway, SAP Integration Hub)"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={formData.tipo || 'API'}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
              >
                {tiposIdentidad.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                helperText="Email de contacto (opcional)"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción"
                value={formData.descripcion || ''}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la identidad y su propósito..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo ?? true}
                    onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {selectedId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GestionIdentidades;