import React, { useState } from 'react';
import { Tabs, Tab, Box, Container, Button, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Alert, AlertTitle, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import { RegistroIntegracion } from './RegistroIntegracion';
import { ListaIntegraciones } from './ListaIntegraciones';
import { TableroResumen } from './TableroResumen';
import { ArbolOrganizacional } from './ArbolOrganizacional';
import { GestionIdentidades } from './GestionIdentidades';
import { Configuraciones } from './Configuraciones';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const API_URL = 'http://localhost:7009/api/integraciones';

export const IntegracionesPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ mensaje: string; insertadas?: number; errores?: any[] } | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const handleRegistroExitoso = () => {
    setRefreshKey(prev => prev + 1);
    setTabValue(1);
  };

  // DESCARGAR PLANTILLA CSV
  const descargarPlantilla = () => {
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

    const csvContent = headers.join(';');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `plantilla_integraciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // LEER CSV y obtener preview
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImportFile(file);
    setImportPreview([]);
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const rawHeaders = lines[0].split(';');
      
      const headerMap: { [key: string]: string } = {
        'Identificador Escenario': 'identificador_escenario',
        'Aplicaciones involucradas': 'aplicaciones_involucradas',
        'Componente emisor': 'componente_emisor',
        'Componente Receptor': 'componente_receptor',
        'Namespace de la interfaz': 'namespace_interfaz',
        'Tipo de interfaz': 'tipo_interfaz',
        'Protocolo de comunicación': 'protocolo_comunicacion',
        'Criticidad': 'criticidad',
        'Responsable': 'responsable',
        'Descripcion del flujo': 'descripcion_flujo',
        'URL Documentacion': 'documentacion_soporte',
        'Estado': 'estado',
        'Tipo de recurso': 'tipo_recurso',
        'Compañía': 'compania',
        'Pais': 'pais',
        'Dominio': 'dominio',
        'Subdominio': 'subdominio',
        'Git Repository': 'git_repo'
      };
      
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(';');
        const obj: any = {};
        rawHeaders.forEach((h, i) => {
          const mappedKey = headerMap[h.trim()] || h.trim();
          obj[mappedKey] = values[i];
        });
        return obj;
      }).filter(row => Object.keys(row).length > 1);
      setImportPreview(preview);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // IMPORTAR CSV
  const handleImport = async () => {
    if (!importFile) {
      alert('Selecciona un archivo CSV');
      return;
    }
    
    setImportLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const rawHeaders = lines[0].split(';').map(h => h.trim());
      
      const headerMap: { [key: string]: string } = {
        'Identificador Escenario': 'identificador_escenario',
        'Aplicaciones involucradas': 'aplicaciones_involucradas',
        'Componente emisor': 'componente_emisor',
        'Componente Receptor': 'componente_receptor',
        'Namespace de la interfaz': 'namespace_interfaz',
        'Tipo de interfaz': 'tipo_interfaz',
        'Protocolo de comunicación': 'protocolo_comunicacion',
        'Criticidad': 'criticidad',
        'Responsable': 'responsable',
        'Descripcion del flujo': 'descripcion_flujo',
        'URL Documentacion': 'documentacion_soporte',
        'Estado': 'estado',
        'Tipo de recurso': 'tipo_recurso',
        'Compañía': 'compania',
        'Pais': 'pais',
        'Dominio': 'dominio',
        'Subdominio': 'subdominio',
        'Git Repository': 'git_repo'
      };
      
      const insertadas = [];
      const errores = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = lines[i].split(';').map(v => v.trim().replace(/['"]/g, ''));
          const row: any = {};
          rawHeaders.forEach((h, idx) => {
            const mappedKey = headerMap[h] || h;
            row[mappedKey] = values[idx];
          });
          
          const integracion = {
            identificadorEscenario: row.identificador_escenario,
            aplicacionesInvolucradas: row.aplicaciones_involucradas?.split(',').map((s: string) => s.trim()) || [],
            componenteEmisor: row.componente_emisor,
            componenteReceptor: row.componente_receptor,
            namespaceInterfaz: row.namespace_interfaz,
            tipoInterfaz: row.tipo_interfaz,
            protocoloComunicacion: row.protocolo_comunicacion,
            criticidad: row.criticidad || 'Media',
            responsable: row.responsable,
            documentacionSoporte: row.documentacion_soporte || '',
            descripcionFlujo: row.descripcion_flujo || '',
            estado: row.estado || 'Activo',
            tipoRecurso: row.tipo_recurso || 'Integracion',
            compania: row.compania || '',
            pais: row.pais || '',
            dominio: row.dominio || '',
            subdominio: row.subdominio || '',
            gitRepo: row.git_repo || '',
            ejemploPayload: row.ejemplo_payload || ''
          };
          
          if (!integracion.identificadorEscenario) {
            throw new Error('Falta identificador');
          }
          
          const response = await fetch(`${API_URL}/integraciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(integracion),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el servidor');
          }
          
          insertadas.push(integracion.identificadorEscenario);
        } catch (err: any) {
          errores.push({ fila: lines[i].substring(0, 50), error: err.message });
        }
      }
      
      setImportResult({
        mensaje: `Importación completada. ${insertadas.length} insertadas, ${errores.length} errores`,
        insertadas: insertadas.length,
        errores: errores
      });
      
      if (insertadas.length > 0) {
        setRefreshKey(prev => prev + 1);
      }
      setImportLoading(false);
    };
    
    reader.readAsText(importFile, 'UTF-8');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}>
          <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
            <Tab label="Registrar integración" />
            <Tab label="Inventario" />
            <Tab label="Resumen" />
            <Tab label="Árbol Organizacional" />
            <Tab label="Identidades" />
            <Tab label="Configuraciones" />
          </Tabs>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={descargarPlantilla}
            size="medium"
          >
            Descargar Plantilla CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Importar CSV
          </Button>
        </Box>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <RegistroIntegracion onRegistroExitoso={handleRegistroExitoso} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ListaIntegraciones key={refreshKey} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableroResumen />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ArbolOrganizacional />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <GestionIdentidades />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Configuraciones />
      </TabPanel>

      {/* Diálogo de Importación CSV */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importar integraciones desde CSV</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Instrucciones</AlertTitle>
            1. Primero descarga la plantilla usando el botón "Descargar Plantilla CSV"<br />
            2. Completa los datos en el archivo (puedes usar Excel o cualquier editor de texto)<br />
            3. Guarda como CSV y selecciona el archivo aquí
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Columnas del archivo CSV:</strong><br />
            Identificador Escenario, Aplicaciones involucradas, Componente emisor, 
            Componente Receptor, Namespace de la interfaz, Tipo de interfaz, Protocolo de comunicación, 
            Criticidad, Responsable, Descripcion del flujo, URL Documentacion, Estado, 
            Tipo de recurso, Compañía, Pais, Dominio, Subdominio, Git Repository
          </Typography>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ marginBottom: 16 }}
          />
          
          {importPreview.length > 0 && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <AlertTitle>Vista previa (primeras 5 filas)</AlertTitle>
              <pre style={{ fontSize: 10, overflow: 'auto', maxHeight: 150 }}>
                {JSON.stringify(importPreview, null, 2)}
              </pre>
            </Alert>
          )}
          
          {importLoading && <LinearProgress sx={{ my: 2 }} />}
          
          {importResult && (
            <Alert severity={importResult.insertadas && importResult.insertadas > 0 ? 'success' : 'error'} sx={{ mt: 2 }}>
              <AlertTitle>Resultado</AlertTitle>
              {importResult.mensaje}
              {importResult.errores && importResult.errores.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Errores:</Typography>
                  <ul style={{ margin: 0, paddingLeft: '20px', maxHeight: 200, overflow: 'auto' }}>
                    {importResult.errores.slice(0, 10).map((err: any, idx: number) => (
                      <li key={idx}>{err.fila}: {err.error}</li>
                    ))}
                  </ul>
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialogOpen(false);
            setImportFile(null);
            setImportResult(null);
            setImportPreview([]);
          }}>
            Cancelar
          </Button>
          <Button onClick={handleImport} variant="contained" disabled={importLoading || !importFile}>
            Importar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};