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
  tipo_recurso?: string;
  compania?: string;
  pais?: string;
  dominio?: string;
  subdominio?: string;
  git_repo?: string;
  ejemplo_payload?: string;
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
const tiposRecursoOptions = ['Integracion', 'API'];
const paisesOptions = ['Colombia', 'USA', 'México', 'Chile', 'Perú', 'Argentina', 'Brasil', 'España'];
const companiasOptions = ['Summa S.A.S', 'Grupo Argos', 'Cementos Argos', 'Celsia', 'Odinsa'];
const dominiosOptions = ['Tecnología', 'Finanzas', 'Talento Humano', 'Abastecimiento'];
const subdominiosOptions = ['Infraestructura', 'Arquitectura', 'Seguridad', 'Contabilidad', 'Facturación', 'Tesorería', 'Nómina', 'Reclutamiento', 'Gestión del Talento', 'Proveedores', 'Compras', 'Logística'];

export const ListaIntegraciones = () => {
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIntegracion, setSelectedIntegracion] = useState<Integracion | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIntegraciones = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `http://localhost:7009/api/integraciones/integraciones?search=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:7009/api/integraciones/integraciones';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar');
      const data = await response.json();
      setIntegraciones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar integraciones');
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
      tipoRecurso: integracion.tipo_recurso || 'Integracion',
      compania: integracion.compania || '',
      pais: integracion.pais || '',
      dominio: integracion.dominio || '',
      subdominio: integracion.subdominio || '',
      gitRepo: integracion.git_repo || '',
      ejemploPayload: integracion.ejemplo_payload || '',
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
      const response = await fetch(`http://localhost:7009/api/integraciones/integraciones/${selectedIntegracion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

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
      const response = await fetch(`http://localhost:7009/api/integraciones/integraciones/${selectedIntegracion.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setDeleteDialogOpen(false);
      fetchIntegraciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  // EXPORTAR A CSV con separador punto y coma
  const exportarACSV = () => {
    const headers = [
      'Identificador Escenario',
      'Aplicaciones involucradas',
      'Componente emisor',
      'Componente Receptor',
      'Namespace de la interfaz',
      'Tipo de interfaz',
      'Protocolo de comunicación',
      'Criticidad',
      'Responsable',
      'Descripcion del flujo',
      'URL Documentacion',
      'Estado',
      'Tipo de recurso',
      'Compañía',
      'Pais',
      'Dominio',
      'Subdominio',
      'Git Repository'
    ];

    const rows = integraciones.map(row => [
      `"${(row.identificador_escenario || '').replace(/"/g, '""')}"`,
      `"${(row.aplicaciones_involucradas?.join(', ') || '').replace(/"/g, '""')}"`,
      `"${(row.componente_emisor || '').replace(/"/g, '""')}"`,
      `"${(row.componente_receptor || '').replace(/"/g, '""')}"`,
      `"${(row.namespace_interfaz || '').replace(/"/g, '""')}"`,
      `"${(row.tipo_interfaz || '').replace(/"/g, '""')}"`,
      `"${(row.protocolo_comunicacion || '').replace(/"/g, '""')}"`,
      `"${(row.criticidad || '').replace(/"/g, '""')}"`,
      `"${(row.responsable || '').replace(/"/g, '""')}"`,
      `"${(row.descripcion_flujo || '').replace(/"/g, '""')}"`,
      `"${(row.documentacion_soporte || '').replace(/"/g, '""')}"`,
      `"${(row.estado || '').replace(/"/g, '""')}"`,
      `"${(row.tipo_recurso || 'Integracion').replace(/"/g, '""')}"`,
      `"${(row.compania || '').replace(/"/g, '""')}"`,
      `"${(row.pais || '').replace(/"/g, '""')}"`,
      `"${(row.dominio || '').replace(/"/g, '""')}"`,
      `"${(row.subdominio || '').replace(/"/g, '""')}"`,
      `"${(row.git_repo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `integraciones_${new Date().toISOString().split('T')[0]}.csv`);
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5">Inventario de integraciones</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {integraciones.length} registros
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportarACSV} size="medium">
              Exportar CSV
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por identificador, responsable o compañía..."
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

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Identificador</TableCell>
                  <TableCell>Aplicaciones</TableCell>
                  <TableCell>Emisor → Receptor</TableCell>
                  <TableCell>Protocolo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Compañía</TableCell>
                  <TableCell>País</TableCell>
                  <TableCell>Dominio</TableCell>
                  <TableCell>Subdominio</TableCell>
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
                    <TableCell>{row.componente_emisor} → {row.componente_receptor}</TableCell>
                    <TableCell>{row.protocolo_comunicacion}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.tipo_recurso || 'Integracion'} 
                        size="small" 
                        color={row.tipo_recurso === 'API' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{row.compania || '-'}</TableCell>
                    <TableCell>{row.pais || '-'}</TableCell>
                    <TableCell>{row.dominio || '-'}</TableCell>
                    <TableCell>{row.subdominio || '-'}</TableCell>
                    <TableCell>{row.responsable}</TableCell>
                    <TableCell sx={{ color: getCriticidadColor(row.criticidad), fontWeight: 'bold' }}>
                      {row.criticidad}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.estado} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{new Date(row.fecha_registro).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditClick(row)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(row)} color="error">
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
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar integración</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Identificador"
                value={editFormData.identificador_escenario || ''}
                onChange={e => setEditFormData({ ...editFormData, identificador_escenario: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Aplicaciones</InputLabel>
                <Select
                  multiple
                  value={editFormData.aplicaciones_involucradas || []}
                  onChange={e => setEditFormData({ ...editFormData, aplicaciones_involucradas: e.target.value })}
                  input={<OutlinedInput label="Aplicaciones" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map(value => <Chip key={value} label={value} size="small" />)}
                    </Box>
                  )}
                >
                  {aplicacionesOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Componente emisor"
                value={editFormData.componente_emisor || ''}
                onChange={e => setEditFormData({ ...editFormData, componente_emisor: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Componente receptor"
                value={editFormData.componente_receptor || ''}
                onChange={e => setEditFormData({ ...editFormData, componente_receptor: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Namespace"
                value={editFormData.namespace_interfaz || ''}
                onChange={e => setEditFormData({ ...editFormData, namespace_interfaz: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Tipo interfaz"
                value={editFormData.tipo_interfaz || ''}
                onChange={e => setEditFormData({ ...editFormData, tipo_interfaz: e.target.value })}
              >
                {tiposInterfaz.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Protocolo"
                value={editFormData.protocolo_comunicacion || ''}
                onChange={e => setEditFormData({ ...editFormData, protocolo_comunicacion: e.target.value })}
              >
                {protocolosOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Criticidad"
                value={editFormData.criticidad || 'Media'}
                onChange={e => setEditFormData({ ...editFormData, criticidad: e.target.value })}
              >
                {criticidadOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Responsable"
                value={editFormData.responsable || ''}
                onChange={e => setEditFormData({ ...editFormData, responsable: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Tipo de recurso"
                value={editFormData.tipoRecurso || 'Integracion'}
                onChange={e => setEditFormData({ ...editFormData, tipoRecurso: e.target.value })}
              >
                {tiposRecursoOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Compañía"
                value={editFormData.compania || ''}
                onChange={e => setEditFormData({ ...editFormData, compania: e.target.value })}
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {companiasOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="País"
                value={editFormData.pais || ''}
                onChange={e => setEditFormData({ ...editFormData, pais: e.target.value })}
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {paisesOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Dominio"
                value={editFormData.dominio || ''}
                onChange={e => setEditFormData({ ...editFormData, dominio: e.target.value })}
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {dominiosOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Subdominio"
                value={editFormData.subdominio || ''}
                onChange={e => setEditFormData({ ...editFormData, subdominio: e.target.value })}
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {subdominiosOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Git Repository"
                value={editFormData.gitRepo || ''}
                onChange={e => setEditFormData({ ...editFormData, gitRepo: e.target.value })}
              />
            </Grid>

            {/* Campo Ejemplo de Payload - SOLO visible cuando el tipo es API */}
            {editFormData.tipoRecurso === 'API' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Ejemplo de Payload"
                  value={editFormData.ejemploPayload || ''}
                  onChange={e => setEditFormData({ ...editFormData, ejemploPayload: e.target.value })}
                  placeholder={`{
  "request": {
    "method": "GET",
    "endpoint": "/api/v1/ejemplo",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "response": {
    "status": 200,
    "body": {}
  }
}`}
                  helperText="Ejemplo de request/response para esta API (obligatorio para APIs)"
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={editFormData.descripcion_flujo || ''}
                onChange={e => setEditFormData({ ...editFormData, descripcion_flujo: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Estado"
                value={editFormData.estado || 'Activo'}
                onChange={e => setEditFormData({ ...editFormData, estado: e.target.value })}
              >
                {estadosOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar la integración "{selectedIntegracion?.identificador_escenario}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ListaIntegraciones;