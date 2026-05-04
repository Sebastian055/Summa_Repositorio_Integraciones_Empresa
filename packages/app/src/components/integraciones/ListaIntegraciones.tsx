import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
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
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';

interface Integracion {
  id: number;
  identificador_escenario: string;
  aplicaciones_involucradas: string[];
  componente_emisor: string;
  componente_receptor: string;
  namespace_interfaz: string;
  tipo_interfaz: string;
  protocolo_comunicacion: string;
  criticidad: string;
  responsable: string;
  documentacion_soporte: string;
  descripcion_flujo: string;
  estado: string;
  fecha_registro: string;
}

const aplicacionesOptions = [
  'SAP',
  'Salesforce',
  'Oracle',
  'Dynamics',
  'Mainframe',
  'SummaCore',
];
const protocolosOptions = [
  'REST',
  'SOAP',
  'GraphQL',
  'Kafka',
  'RabbitMQ',
  'gRPC',
  'SFTP',
];
const criticidadOptions = ['Alta', 'Media', 'Baja'];
const tiposInterfaz = ['Sincrónica', 'Asincrónica', 'Batch'];
const estadosOptions = [
  'Activo',
  'En desarrollo',
  'Deprecado',
  'Descontinuado',
];

export const ListaIntegraciones = () => {
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIntegracion, setSelectedIntegracion] =
    useState<Integracion | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIntegraciones = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `http://localhost:7008/api/integraciones/integraciones?search=${encodeURIComponent(
            searchTerm,
          )}`
        : 'http://localhost:7008/api/integraciones/integraciones';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar');
      const data = await response.json();
      setIntegraciones(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar integraciones',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegraciones();
  }, [searchTerm]);

  const handleEditClick = (integracion: Integracion) => {
    setSelectedIntegracion(integracion);
    setEditFormData({
      identificador_escenario: integracion.identificador_escenario,
      aplicaciones_involucradas: integracion.aplicaciones_involucradas,
      componente_emisor: integracion.componente_emisor,
      componente_receptor: integracion.componente_receptor,
      namespace_interfaz: integracion.namespace_interfaz,
      tipo_interfaz: integracion.tipo_interfaz,
      protocolo_comunicacion: integracion.protocolo_comunicacion,
      criticidad: integracion.criticidad,
      responsable: integracion.responsable,
      documentacion_soporte: integracion.documentacion_soporte || '',
      descripcion_flujo: integracion.descripcion_flujo || '',
      estado: integracion.estado,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (integracion: Integracion) => {
    setSelectedIntegracion(integracion);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedIntegracion) return;

    try {
      const response = await fetch(
        `http://localhost:7008/api/integraciones/integraciones/${selectedIntegracion.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData),
        },
      );

      if (!response.ok) throw new Error('Error al actualizar');

      setEditDialogOpen(false);
      fetchIntegraciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedIntegracion) return;

    try {
      const response = await fetch(
        `http://localhost:7008/api/integraciones/integraciones/${selectedIntegracion.id}`,
        { method: 'DELETE' },
      );

      if (!response.ok) throw new Error('Error al eliminar');

      setDeleteDialogOpen(false);
      fetchIntegraciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  // EXPORTAR A CSV (no necesita librerías externas)
  const exportarACSV = () => {
    const headers = [
      'Identificador',
      'Aplicaciones',
      'Componente Emisor',
      'Componente Receptor',
      'Namespace',
      'Tipo Interfaz',
      'Protocolo',
      'Criticidad',
      'Responsable',
      'Estado',
      'Fecha Registro',
      'URL Documentación',
      'Descripción',
    ];

    const rows = integraciones.map(row => [
      `"${row.identificador_escenario}"`,
      `"${row.aplicaciones_involucradas?.join(', ') || ''}"`,
      `"${row.componente_emisor}"`,
      `"${row.componente_receptor}"`,
      `"${row.namespace_interfaz}"`,
      `"${row.tipo_interfaz}"`,
      `"${row.protocolo_comunicacion}"`,
      `"${row.criticidad}"`,
      `"${row.responsable}"`,
      `"${row.estado}"`,
      `"${new Date(row.fecha_registro).toLocaleDateString()}"`,
      `"${row.documentacion_soporte || ''}"`,
      `"${row.descripcion_flujo || ''}"`,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    // Agregar BOM para que funcione con caracteres especiales en español (ñ, tildes)
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `integraciones_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad) {
      case 'Alta':
        return '#d32f2f';
      case 'Media':
        return '#ed6c02';
      default:
        return '#2e7d32';
    }
  };

  if (loading) return <Typography>Cargando...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <>
      <Card>
        <CardContent>
          {/* HEADER CON BOTÓN DE EXPORTAR */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h5">Inventario de integraciones</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {integraciones.length} registros
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportarACSV}
              size="medium"
            >
              Exportar a CSV
            </Button>
          </Box>

          {/* BARRA DE BÚSQUEDA */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por identificador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Identificador</TableCell>
                  <TableCell>Aplicaciones</TableCell>
                  <TableCell>Emisor → Receptor</TableCell>
                  <TableCell>Protocolo</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell>Criticidad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integraciones.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.identificador_escenario}</TableCell>
                    <TableCell>
                      {row.aplicaciones_involucradas?.map(a => (
                        <Chip key={a} label={a} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      {row.componente_emisor} → {row.componente_receptor}
                    </TableCell>
                    <TableCell>{row.protocolo_comunicacion}</TableCell>
                    <TableCell>{row.responsable}</TableCell>
                    <TableCell
                      sx={{
                        color: getCriticidadColor(row.criticidad),
                        fontWeight: 'bold',
                      }}
                    >
                      {row.criticidad}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.estado}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(row.fecha_registro).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(row)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(row)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar integración</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Identificador"
                value={editFormData.identificador_escenario || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    identificador_escenario: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Aplicaciones</InputLabel>
                <Select
                  multiple
                  value={editFormData.aplicaciones_involucradas || []}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      aplicaciones_involucradas: e.target.value,
                    })
                  }
                  input={<OutlinedInput label="Aplicaciones" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map(value => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {aplicacionesOptions.map(opt => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Componente emisor"
                value={editFormData.componente_emisor || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    componente_emisor: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Componente receptor"
                value={editFormData.componente_receptor || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    componente_receptor: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Namespace"
                value={editFormData.namespace_interfaz || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    namespace_interfaz: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Tipo interfaz"
                value={editFormData.tipo_interfaz || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    tipo_interfaz: e.target.value,
                  })
                }
              >
                {tiposInterfaz.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Protocolo"
                value={editFormData.protocolo_comunicacion || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    protocolo_comunicacion: e.target.value,
                  })
                }
              >
                {protocolosOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Criticidad"
                value={editFormData.criticidad || 'Media'}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    criticidad: e.target.value,
                  })
                }
              >
                {criticidadOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Responsable"
                value={editFormData.responsable || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    responsable: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={2}
                value={editFormData.descripcion_flujo || ''}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    descripcion_flujo: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Estado"
                value={editFormData.estado || 'Activo'}
                onChange={e =>
                  setEditFormData({ ...editFormData, estado: e.target.value })
                }
              >
                {estadosOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar la integración "
            {selectedIntegracion?.identificador_escenario}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ListaIntegraciones;
