// @ts-nocheck
import { Router } from 'express';
import knex from 'knex';
import multer from 'multer';
import Papa from 'papaparse';

const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1011396055',
    database: 'summa_integraciones',
  },
});

const upload = multer({ storage: multer.memoryStorage() });

export function createIntegracionesRouter() {
  const router = Router();

  // ============================================
  // GET todas las integraciones
  // ============================================
  router.get('/integraciones', async (req, res) => {
    try {
      let query = db('integraciones');
      if (req.query.estado) query = query.where('estado', req.query.estado);
      if (req.query.criticidad) query = query.where('criticidad', req.query.criticidad);
      if (req.query.tipo_recurso) query = query.where('tipo_recurso', req.query.tipo_recurso);
      if (req.query.compania) query = query.where('compania', req.query.compania);
      if (req.query.pais) query = query.where('pais', req.query.pais);
      if (req.query.dominio) query = query.where('dominio', req.query.dominio);
      if (req.query.search) {
        const search = req.query.search;
        query = query.where(function() {
          this.where('identificador_escenario', 'ilike', `%${search}%`)
              .orWhere('responsable', 'ilike', `%${search}%`)
              .orWhere('compania', 'ilike', `%${search}%`);
        });
      }
      const integraciones = await query.select('*').orderBy('fecha_registro', 'desc');
      res.json(integraciones);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener integraciones' });
    }
  });

  // ============================================
  // GET integración por ID
  // ============================================
  router.get('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const integracion = await db('integraciones').where('id', id).first();
      if (!integracion) return res.status(404).json({ error: 'Integración no encontrada' });
      res.json(integracion);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener integración' });
    }
  });

  // ============================================
  // GET jerarquía organizacional
  // ============================================
  router.get('/jerarquia', async (_req, res) => {
    try {
      const items = await db('jerarquia').select('*').orderBy('nivel', 'asc');
      const buildTree = (items: any[], parentId: number | null = null): any[] => {
        return items
          .filter(item => item.padre_id === parentId)
          .map(item => ({ ...item, children: buildTree(items, item.id) }));
      };
      res.json(buildTree(items, null));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener jerarquía' });
    }
  });

  // ============================================
  // GET identidades
  // ============================================
  router.get('/identidades', async (req, res) => {
    try {
      let query = db('identidades');
      if (req.query.activo !== undefined) query = query.where('activo', req.query.activo === 'true');
      if (req.query.tipo) query = query.where('tipo', req.query.tipo);
      const identidades = await query.orderBy('nombre');
      res.json(identidades);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener identidades' });
    }
  });

  // ============================================
  // POST crear identidad
  // ============================================
  router.post('/identidades', async (req, res) => {
    try {
      const { nombre, tipo, email, descripcion, activo } = req.body;
      if (!nombre || !tipo) return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
      const [id] = await db('identidades').insert({
        nombre, tipo, email, descripcion,
        activo: activo !== undefined ? activo : true,
        fecha_actualizacion: new Date()
      }).returning('id');
      const nuevaIdentidad = await db('identidades').where('id', id[0]).first();
      res.status(201).json({ mensaje: 'Identidad creada exitosamente', data: nuevaIdentidad });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al crear identidad' });
    }
  });

  // ============================================
  // PUT actualizar identidad
  // ============================================
  router.put('/identidades/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, tipo, email, descripcion, activo } = req.body;
      const existe = await db('identidades').where('id', id).first();
      if (!existe) return res.status(404).json({ error: 'Identidad no encontrada' });
      await db('identidades').where('id', id).update({
        nombre, tipo, email, descripcion, activo, fecha_actualizacion: new Date()
      });
      const identidadActualizada = await db('identidades').where('id', id).first();
      res.json({ mensaje: 'Identidad actualizada exitosamente', data: identidadActualizada });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al actualizar identidad' });
    }
  });

  // ============================================
  // DELETE eliminar identidad
  // ============================================
  router.delete('/identidades/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existe = await db('identidades').where('id', id).first();
      if (!existe) return res.status(404).json({ error: 'Identidad no encontrada' });
      await db('identidades').where('id', id).delete();
      res.json({ mensaje: 'Identidad eliminada exitosamente' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al eliminar identidad' });
    }
  });

  // ============================================
  // IMPORTAR CSV
  // ============================================
  router.post('/integraciones/importar', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
      const csvContent = req.file.buffer.toString('utf-8');
      const results = await new Promise((resolve, reject) => {
        Papa.parse(csvContent, { header: true, skipEmptyLines: true, complete: (result) => resolve(result.data), error: (error) => reject(error) });
      });
      const insertadas = [];
      const errores = [];
      for (const row of results) {
        try {
          if (!row['Identificador Escenario']) throw new Error('Falta identificador');
          const aplicaciones = row['Aplicaciones involucradas']?.split(',').map(a => a.trim()) || [];
          const existe = await db('integraciones').where('identificador_escenario', row['Identificador Escenario']).first();
          if (existe) { errores.push({ fila: row['Identificador Escenario'], error: 'Identificador duplicado' }); continue; }
          await db('integraciones').insert({
            identificador_escenario: row['Identificador Escenario'],
            aplicaciones_involucradas: aplicaciones,
            componente_emisor: row['Componente emisor'] || '',
            componente_receptor: row['Componente Receptor'] || '',
            namespace_interfaz: row['Namespace de la interfaz'] || '',
            tipo_interfaz: row['Tipo de interfaz'] || '',
            protocolo_comunicacion: row['Protocolo de comunicación'] || '',
            criticidad: row['Criticidad'] || 'Media',
            responsable: row['Responsable'] || '',
            documentacion_soporte: row['URL Documentacion'] || '',
            descripcion_flujo: row['Descripcion del flujo'] || '',
            estado: row['Estado'] || 'Activo',
            tipo_recurso: row['Tipo de recurso'] || 'Integracion',
            compania: row['Compañía'] || '',
            pais: row['Pais'] || '',
            dominio: row['Dominio'] || '',
            subdominio: row['Subdominio'] || '',
            git_repo: row['Git Repository'] || '',
            fecha_actualizacion: new Date()
          });
          insertadas.push(row['Identificador Escenario']);
        } catch (err) { errores.push({ fila: row['Identificador Escenario'] || 'desconocido', error: err.message }); }
      }
      res.json({ mensaje: `Importación completada. ${insertadas.length} insertadas, ${errores.length} errores`, insertadas: insertadas.length, errores });
    } catch (error) {
      console.error('Error en importación:', error);
      res.status(500).json({ error: 'Error al importar archivo' });
    }
  });

  // ============================================
  // POST crear integración
  // ============================================
  router.post('/integraciones', async (req, res) => {
    try {
      const data = req.body;
      if (!data.identificadorEscenario) return res.status(400).json({ error: 'El identificador es obligatorio' });
      const existe = await db('integraciones').where('identificador_escenario', data.identificadorEscenario).first();
      if (existe) return res.status(409).json({ error: 'Ya existe una integración con ese identificador' });
      const result = await db('integraciones').insert({
        identificador_escenario: data.identificadorEscenario,
        aplicaciones_involucradas: data.aplicacionesInvolucradas || [],
        componente_emisor: data.componenteEmisor,
        componente_receptor: data.componenteReceptor,
        namespace_interfaz: data.namespaceInterfaz,
        tipo_interfaz: data.tipoInterfaz,
        protocolo_comunicacion: data.protocoloComunicacion,
        criticidad: data.criticidad || 'Media',
        responsable: data.responsable,
        documentacion_soporte: data.documentacionSoporte || '',
        descripcion_flujo: data.descripcionFlujo || '',
        estado: data.estado || 'Activo',
        tipo_recurso: data.tipoRecurso || 'Integracion',
        compania: data.compania || '',
        pais: data.pais || '',
        dominio: data.dominio || '',
        subdominio: data.subdominio || '',
        git_repo: data.gitRepo || '',
        ejemplo_payload: data.ejemploPayload || '',
        identidad_id: data.identidadId || null,
        fecha_actualizacion: new Date()
      }).returning('*');
      res.status(201).json({ mensaje: 'Integración creada exitosamente', data: result[0] });
    } catch (error) {
      console.error('Error al crear:', error);
      res.status(500).json({ error: 'Error interno al crear integración' });
    }
  });

  // ============================================
  // PUT actualizar integración
  // ============================================
  router.put('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const existe = await db('integraciones').where('id', id).first();
      if (!existe) return res.status(404).json({ error: 'Integración no encontrada' });
      const updateData: any = { fecha_actualizacion: new Date() };
      const campos = ['identificador_escenario', 'aplicaciones_involucradas', 'componente_emisor', 'componente_receptor', 'namespace_interfaz', 'tipo_interfaz', 'protocolo_comunicacion', 'criticidad', 'responsable', 'documentacion_soporte', 'descripcion_flujo', 'estado', 'tipo_recurso', 'compania', 'pais', 'dominio', 'subdominio', 'git_repo', 'ejemplo_payload', 'identidad_id'];
      for (const campo of campos) { if (data[campo] !== undefined) updateData[campo] = data[campo]; }
      await db('integraciones').where('id', id).update(updateData);
      const integracionActualizada = await db('integraciones').where('id', id).first();
      res.json({ mensaje: 'Integración actualizada exitosamente', data: integracionActualizada });
    } catch (error) {
      console.error('Error al actualizar:', error);
      res.status(500).json({ error: 'Error al actualizar integración' });
    }
  });

  // ============================================
  // DELETE eliminar integración
  // ============================================
  router.delete('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existe = await db('integraciones').where('id', id).first();
      if (!existe) return res.status(404).json({ error: 'Integración no encontrada' });
      await db('integraciones').where('id', id).delete();
      res.status(200).json({ mensaje: 'Integración eliminada exitosamente', id: parseInt(id) });
    } catch (error) {
      console.error('Error al eliminar:', error);
      res.status(500).json({ error: 'Error al eliminar integración' });
    }
  });

    // ============================================
  // GET estadísticas
  // ============================================
  router.get('/integraciones/stats/resumen', async (_req, res) => {
    try {
      const total = await db('integraciones').count('id as count').first();
      const activas = await db('integraciones').where('estado', 'Activo').count('id as count').first();
      const altaCriticidad = await db('integraciones').where('criticidad', 'Alta').count('id as count').first();
      const responsables = await db('integraciones').distinct('responsable');
      const protocolosUsados = await db('integraciones').select('protocolo_comunicacion').distinct();
      res.json({
        totalIntegraciones: Number(total?.count) || 0,
        activas: Number(activas?.count) || 0,
        altaCriticidad: Number(altaCriticidad?.count) || 0,
        responsablesUnicos: responsables.length,
        protocolosUsados: protocolosUsados.map(p => p.protocolo_comunicacion),
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  });

  // ============================================
  // GET opciones para jerarquía (lista plana)  ← NUEVO ENDPOINT
  // ============================================
  router.get('/opciones/jerarquia', async (_req, res) => {
    try {
      const items = await db('jerarquia').select('id', 'nombre', 'tipo', 'nivel').orderBy('nivel', 'asc');
      res.json(items);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener opciones de jerarquía' });
    }
  });

  return router;
};