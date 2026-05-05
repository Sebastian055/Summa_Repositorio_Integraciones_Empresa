import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Alert,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Business,
  AccountTree,
  Folder,
  Search,
  Add,
  Edit,
  Delete,
  Refresh,
} from '@mui/icons-material';

interface JerarquiaNode {
  id: number;
  nombre: string;
  tipo: 'empresa' | 'dominio' | 'subdominio';
  padre_id: number | null;
  nivel: number;
  children?: JerarquiaNode[];
}

interface JerarquiaItem {
  id: number;
  nombre: string;
  tipo: string;
  nivel: number;
}

export const ArbolOrganizacional = () => {
  const [jerarquia, setJerarquia] = useState<JerarquiaNode[]>([]);
  const [opcionesPadres, setOpcionesPadres] = useState<JerarquiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNodes, setFilteredNodes] = useState<Set<number>>(new Set());
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<JerarquiaNode | null>(null);
  const [formData, setFormData] = useState({ nombre: '', tipo: 'subdominio', padre_id: null as number | null });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchJerarquia = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:7009/api/integraciones/jerarquia');
      const data = await response.json();
      setJerarquia(data);
      
      const allIds = new Set<number>();
      const collectIds = (nodes: JerarquiaNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(data);
      setOpenNodes(allIds);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar la jerarquía');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpcionesPadres = async () => {
    try {
      const response = await fetch('http://localhost:7009/api/integraciones/opciones/jerarquia');
      const data = await response.json();
      setOpcionesPadres(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchJerarquia();
    fetchOpcionesPadres();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNodes(new Set());
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchingIds = new Set<number>();

    const searchTree = (nodes: JerarquiaNode[]) => {
      nodes.forEach(node => {
        if (node.nombre.toLowerCase().includes(searchLower)) {
          matchingIds.add(node.id);
          let currentId = node.padre_id;
          while (currentId) {
            matchingIds.add(currentId);
            const parent = findNodeById(jerarquia, currentId);
            currentId = parent?.padre_id || null;
          }
        }
        if (node.children) {
          searchTree(node.children);
        }
      });
    };

    const findNodeById = (nodes: JerarquiaNode[], id: number): JerarquiaNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    searchTree(jerarquia);
    setFilteredNodes(matchingIds);
    
    const newOpenNodes = new Set(openNodes);
    matchingIds.forEach(id => newOpenNodes.add(id));
    setOpenNodes(newOpenNodes);
  }, [searchTerm, jerarquia]);

  const handleToggle = (nodeId: number) => {
    const newOpenNodes = new Set(openNodes);
    if (newOpenNodes.has(nodeId)) {
      newOpenNodes.delete(nodeId);
    } else {
      newOpenNodes.add(nodeId);
    }
    setOpenNodes(newOpenNodes);
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case 'empresa': return <Business sx={{ color: '#1976d2' }} />;
      case 'dominio': return <AccountTree sx={{ color: '#2e7d32' }} />;
      default: return <Folder sx={{ color: '#ed6c02' }} />;
    }
  };

  const getColorByTipo = (tipo: string) => {
    switch (tipo) {
      case 'empresa': return '#1976d2';
      case 'dominio': return '#2e7d32';
      default: return '#ed6c02';
    }
  };

  const shouldShowNode = (node: JerarquiaNode): boolean => {
    if (!searchTerm.trim()) return true;
    if (filteredNodes.has(node.id)) return true;
    return false;
  };

  const handleCreate = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('http://localhost:7009/api/integraciones/jerarquia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          tipo: formData.tipo,
          padre_id: formData.padre_id
        }),
      });
      
      if (response.ok) {
        setSuccess('Elemento creado exitosamente');
        setTimeout(() => {
          setDialogOpen(false);
          setFormData({ nombre: '', tipo: 'subdominio', padre_id: null });
          fetchJerarquia();
          fetchOpcionesPadres();
          setSuccess(null);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError('Error al crear el nodo');
    }
  };

  const handleUpdate = async () => {
    if (!selectedNode) return;
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`http://localhost:7009/api/integraciones/jerarquia/${selectedNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: formData.nombre }),
      });
      
      if (response.ok) {
        setSuccess('Elemento actualizado exitosamente');
        setTimeout(() => {
          setEditDialogOpen(false);
          setSelectedNode(null);
          fetchJerarquia();
          fetchOpcionesPadres();
          setSuccess(null);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError('Error al actualizar el nodo');
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`http://localhost:7009/api/integraciones/jerarquia/${selectedNode.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess('Elemento eliminado exitosamente');
        setTimeout(() => {
          setDeleteDialogOpen(false);
          setSelectedNode(null);
          fetchJerarquia();
          fetchOpcionesPadres();
          setSuccess(null);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError('Error al eliminar el nodo');
    }
  };

  const openCreateDialog = (padre_id: number | null = null, tipo: string = 'subdominio') => {
    setError(null);
    setSuccess(null);
    setFormData({ nombre: '', tipo, padre_id });
    setDialogOpen(true);
  };

  const openEditDialog = (node: JerarquiaNode) => {
    setError(null);
    setSuccess(null);
    setSelectedNode(node);
    setFormData({ nombre: node.nombre, tipo: node.tipo, padre_id: node.padre_id });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (node: JerarquiaNode) => {
    setSelectedNode(node);
    setDeleteDialogOpen(true);
  };

  const getPadreNombre = (padreId: number | null) => {
    if (!padreId) return 'Ninguno (Nodo raíz)';
    const padre = opcionesPadres.find(p => p.id === padreId);
    return padre ? `${padre.nombre} (${padre.tipo})` : 'Desconocido';
  };

  const renderTree = (nodes: JerarquiaNode[], level: number = 0) => {
    return nodes.map((node) => {
      if (!shouldShowNode(node)) return null;
      
      const hasChildren = node.children && node.children.length > 0;
      const isOpen = openNodes.has(node.id);
      const isMatch = searchTerm && node.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      return (
        <Box key={node.id} sx={{ ml: level * 3 }}>
          <ListItem 
            disablePadding 
            sx={{ 
              '&:hover .action-buttons': { opacity: 1 },
              borderLeft: level > 0 ? '2px solid #e0e0e0' : 'none',
              ml: level > 0 ? 2 : 0,
            }}
          >
            <ListItemButton onClick={() => hasChildren && handleToggle(node.id)}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                {!hasChildren && <Box sx={{ width: 24 }} />}
                {getIconByTipo(node.tipo)}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontWeight: node.nivel === 0 ? 'bold' : 'normal', color: getColorByTipo(node.tipo) }}
                    >
                      {node.nombre}
                    </Typography>
                    <Chip label={node.tipo} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                    {isMatch && <Chip label="Coincidencia" size="small" color="primary" sx={{ fontSize: '0.6rem', height: 18 }} />}
                  </Box>
                }
              />
            </ListItemButton>
            <Box className="action-buttons" sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.5, pr: 1 }}>
              <IconButton size="small" onClick={() => openCreateDialog(node.id, 'subdominio')} title="Agregar subelemento">
                <Add fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => openEditDialog(node)} title="Editar" color="primary">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => openDeleteDialog(node)} title="Eliminar" color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
          {hasChildren && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              {renderTree(node.children!, level + 1)}
            </Collapse>
          )}
        </Box>
      );
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography sx={{ mt: 2 }}>Cargando estructura organizacional...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              Estructura Organizacional
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => { fetchJerarquia(); fetchOpcionesPadres(); }} title="Actualizar">
                <Refresh fontSize="small" />
              </IconButton>
              <Button variant="contained" size="small" startIcon={<Add />} onClick={() => openCreateDialog(null, 'empresa')}>
                Nueva Empresa
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Empresas → Dominios → Subdominios
          </Typography>
          
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar en el árbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              },
            }}
          />
          
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          
          <List sx={{ width: '100%', maxHeight: 500, overflow: 'auto' }}>
            {renderTree(jerarquia)}
          </List>
        </CardContent>
      </Card>

      {/* Diálogo para crear nodo */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar nuevo elemento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            sx={{ mt: 2 }}
            autoFocus
          />
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={formData.tipo}
              label="Tipo"
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            >
              <MenuItem value="empresa">Empresa</MenuItem>
              <MenuItem value="dominio">Dominio</MenuItem>
              <MenuItem value="subdominio">Subdominio</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Padre (opcional)</InputLabel>
            <Select
              value={formData.padre_id === null ? '' : formData.padre_id.toString()}
              label="Padre (opcional)"
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, padre_id: value === '' ? null : Number(value) });
              }}
            >
              <MenuItem value="">Ninguno (Nodo raíz)</MenuItem>
              {opcionesPadres.map((item) => (
                <MenuItem key={item.id} value={item.id.toString()}>
                  {item.nombre} ({item.tipo}) - Nivel {item.nivel}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {formData.tipo === 'empresa' && 'Las empresas son nodos raíz.'}
            {formData.tipo === 'dominio' && 'Los dominios deben pertenecer a una empresa.'}
            {formData.tipo === 'subdominio' && 'Los subdominios deben pertenecer a un dominio.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar nodo */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar elemento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            sx={{ mt: 2 }}
            autoFocus
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Tipo: {selectedNode?.tipo} | Padre: {getPadreNombre(selectedNode?.padre_id || null)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar nodo */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar <strong>{selectedNode?.nombre}</strong>?
          </Typography>
          {selectedNode?.children && selectedNode.children.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este elemento tiene {selectedNode.children.length} hijo(s). No se puede eliminar hasta que elimines sus hijos primero.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={selectedNode?.children && selectedNode.children.length > 0}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ArbolOrganizacional;