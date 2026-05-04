import { createRouter } from '@backstage/backend-common';
import { Router } from 'express';
import { DatabaseManager } from '@backstage/backend-common';
import { Knex } from 'knex';

export interface Integracion {
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
  fecha_registro: Date;
  fecha_actualizacion: Date;
}

export async function createIntegracionesRouter(
  databaseManager: DatabaseManager,
): Promise<Router> {
  const router = Router();
  
  const knex = await databaseManager.getClient();
  
  // Obtener todas las integraciones
  router.get('/integraciones', async (_req, res) => {
    try {
      const integraciones = await knex('integraciones')
        .select('*')
        .orderBy('fecha_registro', 'desc');
      res.json(integraciones);
    } catch (error) {
      console.error('Error al obtener integraciones:', error);
      res.status(500).json({ error: 'Error al obtener integraciones' });
    }
  });
  
  // Obtener una integración por ID
  router.get('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const integracion = await knex('integraciones')
        .where('id', id)
        .first();
      
      if (!integracion) {
        return res.status(404).json({ error: 'Integración no encontrada' });
      }
      
      res.json(integracion);
    } catch (error) {
      console.error('Error al obtener integración:', error);
      res.status(500).json({ error: 'Error al obtener integración' });
    }
  });
  
  // Crear nueva integración
  router.post('/integraciones', async (req, res) => {
    try {
      const data = req.body;
      
      // Validar campos requeridos
      const requiredFields = [
        'identificador_escenario', 'aplicaciones_involucradas',
        'componente_emisor', 'componente_receptor', 'namespace_interfaz',
        'tipo_interfaz', 'protocolo_comunicacion', 'responsable'
      ];
      
      for (const field of requiredFields) {
        if (!data[field]) {
          return res.status(400).json({ error: `El campo ${field} es requerido` });
        }
      }
      
      const [newId] = await knex('integraciones').insert({
        identificador_escenario: data.identificador_escenario,
        aplicaciones_involucradas: data.aplicaciones_involucradas,
        componente_emisor: data.componente_emisor,
        componente_receptor: data.componente_receptor,
        namespace_interfaz: data.namespace_interfaz,
        tipo_interfaz: data.tipo_interfaz,
        protocolo_comunicacion: data.protocolo_comunicacion,
        criticidad: data.criticidad || 'Media',
        responsable: data.responsable,
        documentacion_soporte: data.documentacion_soporte || '',
        descripcion_flujo: data.descripcion_flujo || '',
        estado: data.estado || 'Activo',
        fecha_actualizacion: new Date()
      });
      
      const newIntegracion = await knex('integraciones')
        .where('id', newId)
        .first();
      
      res.status(201).json(newIntegracion);
    } catch (error) {
      console.error('Error al crear integración:', error);
      res.status(500).json({ error: 'Error al crear integración' });
    }
  });
  
  // Actualizar integración
  router.put('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const updated = await knex('integraciones')
        .where('id', id)
        .update({
          ...data,
          fecha_actualizacion: new Date()
        });
      
      if (updated === 0) {
        return res.status(404).json({ error: 'Integración no encontrada' });
      }
      
      const updatedIntegracion = await knex('integraciones')
        .where('id', id)
        .first();
      
      res.json(updatedIntegracion);
    } catch (error) {
      console.error('Error al actualizar integración:', error);
      res.status(500).json({ error: 'Error al actualizar integración' });
    }
  });
  
  // Eliminar integración
  router.delete('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await knex('integraciones')
        .where('id', id)
        .delete();
      
      if (deleted === 0) {
        return res.status(404).json({ error: 'Integración no encontrada' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar integración:', error);
      res.status(500).json({ error: 'Error al eliminar integración' });
    }
  });
  
  // Obtener estadísticas/resumen
  router.get('/integraciones/stats/resumen', async (_req, res) => {
    try {
      const total = await knex('integraciones').count('id as count').first();
      const activas = await knex('integraciones')
        .where('estado', 'Activo')
        .count('id as count')
        .first();
      const altaCriticidad = await knex('integraciones')
        .where('criticidad', 'Alta')
        .count('id as count')
        .first();
      const responsables = await knex('integraciones')
        .distinct('responsable')
        .count('responsable');
      
      res.json({
        totalIntegraciones: Number(total?.count) || 0,
        activas: Number(activas?.count) || 0,
        altaCriticidad: Number(altaCriticidad?.count) || 0,
        responsablesUnicos: responsables.length
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  });
  
  return router;
}