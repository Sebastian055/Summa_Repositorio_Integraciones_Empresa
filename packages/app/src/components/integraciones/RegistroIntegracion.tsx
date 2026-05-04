import React, { useState } from 'react';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
} from '@mui/material';

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

interface FormData {
  identificadorEscenario: string;
  aplicacionesInvolucradas: string[];
  componenteEmisor: string;
  componenteReceptor: string;
  namespaceInterfaz: string;
  tipoInterfaz: string;
  protocoloComunicacion: string;
  criticidad: string;
  responsable: string;
  documentacionSoporte: string;
  descripcionFlujo: string;
  estado: string;
}

interface RegistroIntegracionProps {
  onRegistroExitoso?: () => void;
}

export const RegistroIntegracion = ({
  onRegistroExitoso,
}: RegistroIntegracionProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresDetallados, setErroresDetallados] = useState<string[]>([]);
  const [exito, setExito] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    identificadorEscenario: '',
    aplicacionesInvolucradas: [],
    componenteEmisor: '',
    componenteReceptor: '',
    namespaceInterfaz: '',
    tipoInterfaz: '',
    protocoloComunicacion: '',
    criticidad: 'Media',
    responsable: '',
    documentacionSoporte: '',
    descripcionFlujo: '',
    estado: 'Activo',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.identificadorEscenario.trim()) {
      newErrors.identificadorEscenario =
        'El identificador del escenario es obligatorio';
    } else if (formData.identificadorEscenario.length < 3) {
      newErrors.identificadorEscenario =
        'El identificador debe tener al menos 3 caracteres';
    } else if (formData.identificadorEscenario.length > 100) {
      newErrors.identificadorEscenario =
        'El identificador no puede exceder 100 caracteres';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.identificadorEscenario)) {
      newErrors.identificadorEscenario =
        'El identificador solo puede contener letras, números, guiones y guiones bajos';
    }

    if (formData.aplicacionesInvolucradas.length === 0) {
      newErrors.aplicacionesInvolucradas =
        'Debe seleccionar al menos una aplicación involucrada';
    }
    if (!formData.componenteEmisor.trim()) {
      newErrors.componenteEmisor = 'El componente emisor es obligatorio';
    }
    if (!formData.componenteReceptor.trim()) {
      newErrors.componenteReceptor = 'El componente receptor es obligatorio';
    }
    if (!formData.namespaceInterfaz.trim()) {
      newErrors.namespaceInterfaz =
        'El namespace de la interfaz es obligatorio';
    } else if (!formData.namespaceInterfaz.startsWith('/')) {
      newErrors.namespaceInterfaz = 'El namespace debe comenzar con /';
    }
    if (!formData.tipoInterfaz) {
      newErrors.tipoInterfaz = 'Debe seleccionar el tipo de interfaz';
    }
    if (!formData.protocoloComunicacion) {
      newErrors.protocoloComunicacion =
        'Debe seleccionar el protocolo de comunicación';
    }
    if (!formData.responsable.trim()) {
      newErrors.responsable = 'El responsable es obligatorio';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.responsable)) {
      newErrors.responsable =
        'El responsable solo puede contener letras y espacios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErroresDetallados([]);
    setExito(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:7008/api/integraciones/integraciones',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      );

      const errorData = await response.json();

      if (!response.ok) {
        // Manejar error 400 (validaciones del backend)
        if (response.status === 400) {
          if (errorData.detalles && Array.isArray(errorData.detalles)) {
            setErroresDetallados(errorData.detalles);
            throw new Error(errorData.error || 'Errores de validación');
          }
          throw new Error(errorData.error || 'Datos inválidos');
        }

        // Manejar error 409 (conflicto - llave duplicada)
        if (response.status === 409) {
          if (errorData.detalles && Array.isArray(errorData.detalles)) {
            setErroresDetallados(errorData.detalles);
          }
          throw new Error(
            errorData.error ||
              'Ya existe una integración con este identificador',
          );
        }

        // Otros errores
        throw new Error(errorData.error || 'Error al registrar');
      }

      // Éxito
      console.log('Integración registrada:', errorData);
      setExito(true);

      // Resetear formulario
      setFormData({
        identificadorEscenario: '',
        aplicacionesInvolucradas: [],
        componenteEmisor: '',
        componenteReceptor: '',
        namespaceInterfaz: '',
        tipoInterfaz: '',
        protocoloComunicacion: '',
        criticidad: 'Media',
        responsable: '',
        documentacionSoporte: '',
        descripcionFlujo: '',
        estado: 'Activo',
      });
      setErrors({});

      if (onRegistroExitoso) onRegistroExitoso();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Limpiar errores generales cuando el usuario empieza a escribir
    if (error) setError(null);
    if (erroresDetallados.length) setErroresDetallados([]);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Registro de nueva integración
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Error general */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {/* Errores detallados del backend */}
          {erroresDetallados.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Errores de validación</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {erroresDetallados.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Éxito */}
          {exito && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>¡Registro exitoso!</AlertTitle>
              La integración ha sido registrada correctamente.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Identificador del escenario"
                required
                value={formData.identificadorEscenario}
                onChange={e =>
                  handleChange('identificadorEscenario', e.target.value)
                }
                error={!!errors.identificadorEscenario}
                helperText={
                  errors.identificadorEscenario || 'Ej: INT-SAP-SALESFORCE-001'
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.aplicacionesInvolucradas}>
                <InputLabel>Aplicaciones involucradas *</InputLabel>
                <Select
                  multiple
                  value={formData.aplicacionesInvolucradas}
                  onChange={e =>
                    handleChange('aplicacionesInvolucradas', e.target.value)
                  }
                  input={<OutlinedInput label="Aplicaciones involucradas *" />}
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
                {errors.aplicacionesInvolucradas && (
                  <Typography variant="caption" color="error">
                    {errors.aplicacionesInvolucradas}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Componente emisor"
                required
                value={formData.componenteEmisor}
                onChange={e => handleChange('componenteEmisor', e.target.value)}
                error={!!errors.componenteEmisor}
                helperText={errors.componenteEmisor}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Componente receptor"
                required
                value={formData.componenteReceptor}
                onChange={e =>
                  handleChange('componenteReceptor', e.target.value)
                }
                error={!!errors.componenteReceptor}
                helperText={errors.componenteReceptor}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Namespace de la interfaz"
                required
                value={formData.namespaceInterfaz}
                onChange={e =>
                  handleChange('namespaceInterfaz', e.target.value)
                }
                error={!!errors.namespaceInterfaz}
                helperText={errors.namespaceInterfaz || 'Ej: /api/v1/ejemplo'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Tipo de interfaz"
                required
                value={formData.tipoInterfaz}
                onChange={e => handleChange('tipoInterfaz', e.target.value)}
                error={!!errors.tipoInterfaz}
                helperText={errors.tipoInterfaz}
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
                label="Protocolo de comunicación"
                required
                value={formData.protocoloComunicacion}
                onChange={e =>
                  handleChange('protocoloComunicacion', e.target.value)
                }
                error={!!errors.protocoloComunicacion}
                helperText={errors.protocoloComunicacion}
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
                value={formData.criticidad}
                onChange={e => handleChange('criticidad', e.target.value)}
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
                required
                value={formData.responsable}
                onChange={e => handleChange('responsable', e.target.value)}
                error={!!errors.responsable}
                helperText={errors.responsable || 'Solo letras y espacios'}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción del flujo"
                multiline
                rows={3}
                value={formData.descripcionFlujo}
                onChange={e => handleChange('descripcionFlujo', e.target.value)}
                placeholder="Describa el propósito y el flujo de la integración..."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="URL documentación"
                value={formData.documentacionSoporte}
                onChange={e =>
                  handleChange('documentacionSoporte', e.target.value)
                }
                placeholder="https://wiki.summa.com/..."
                helperText="Opcional. Enlace a documentación técnica"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Estado"
                value={formData.estado}
                onChange={e => handleChange('estado', e.target.value)}
              >
                {estadosOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box
            sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => {
                setFormData({
                  identificadorEscenario: '',
                  aplicacionesInvolucradas: [],
                  componenteEmisor: '',
                  componenteReceptor: '',
                  namespaceInterfaz: '',
                  tipoInterfaz: '',
                  protocoloComunicacion: '',
                  criticidad: 'Media',
                  responsable: '',
                  documentacionSoporte: '',
                  descripcionFlujo: '',
                  estado: 'Activo',
                });
                setErrors({});
                setError(null);
                setErroresDetallados([]);
              }}
            >
              Limpiar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar integración'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegistroIntegracion;
