import { Router } from 'express';
import knex from 'knex';

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

export function createIntegracionesRouter(): Router {
  const router = Router();

  // ============================================
  // GET todas las integraciones (con filtros opcionales)
  // ============================================
  router.get('/integraciones', async (req, res) => {
    try {
      let query = db('integraciones');

      // Filtros opcionales
      if (req.query.estado) {
        query = query.where('estado', req.query.estado);
      }
      if (req.query.criticidad) {
        query = query.where('criticidad', req.query.criticidad);
      }
      if (req.query.search) {
        query = query.where(
          'identificador_escenario',
          'ilike',
          `%${req.query.search}%`,
        );
      }

      const integraciones = await query
        .select('*')
        .orderBy('fecha_registro', 'desc');
      res.json(integraciones);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener integraciones' });
    }
  });

  // ============================================
  // GET una integración por ID
  // ============================================
  router.get('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const integracion = await db('integraciones').where('id', id).first();

      if (!integracion) {
        return res.status(404).json({ error: 'Integración no encontrada' });
      }

      res.json(integracion);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener integración' });
    }
  });

  // ============================================
  // FUNCIÓN DE VALIDACIÓN CENTRALIZADA
  // ============================================
  const validarIntegracion = (
    data: any,
  ): { valido: boolean; errores: string[] } => {
    const errores: string[] = [];

    // 1. Validar identificador_escenario
    if (!data.identificadorEscenario && !data.identificador_escenario) {
      errores.push('El identificador del escenario es obligatorio');
    } else {
      const identificador =
        data.identificadorEscenario || data.identificador_escenario;
      if (identificador.length < 3) {
        errores.push('El identificador debe tener al menos 3 caracteres');
      }
      if (identificador.length > 100) {
        errores.push('El identificador no puede exceder 100 caracteres');
      }
      if (!/^[A-Za-z0-9_-]+$/.test(identificador)) {
        errores.push(
          'El identificador solo puede contener letras, números, guiones y guiones bajos',
        );
      }
    }

    // 2. Validar aplicaciones_involucradas
    const aplicaciones =
      data.aplicacionesInvolucradas || data.aplicaciones_involucradas;
    if (!aplicaciones || aplicaciones.length === 0) {
      errores.push('Debe seleccionar al menos una aplicación involucrada');
    }
    if (aplicaciones && aplicaciones.length > 10) {
      errores.push('No puede seleccionar más de 10 aplicaciones');
    }

    // 3. Validar componente_emisor
    const emisor = data.componenteEmisor || data.componente_emisor;
    if (!emisor || emisor.trim() === '') {
      errores.push('El componente emisor es obligatorio');
    } else if (emisor.length > 100) {
      errores.push('El componente emisor no puede exceder 100 caracteres');
    }

    // 4. Validar componente_receptor
    const receptor = data.componenteReceptor || data.componente_receptor;
    if (!receptor || receptor.trim() === '') {
      errores.push('El componente receptor es obligatorio');
    } else if (receptor.length > 100) {
      errores.push('El componente receptor no puede exceder 100 caracteres');
    }

    // 5. Validar namespace_interfaz
    const namespace = data.namespaceInterfaz || data.namespace_interfaz;
    if (!namespace || namespace.trim() === '') {
      errores.push('El namespace de la interfaz es obligatorio');
    } else if (namespace.length > 200) {
      errores.push('El namespace no puede exceder 200 caracteres');
    } else if (!/^\/[a-zA-Z0-9/_-]*$/.test(namespace)) {
      errores.push(
        'El namespace debe comenzar con / y solo contener letras, números, /, - y _',
      );
    }

    // 6. Validar tipo_interfaz
    const tiposValidos = ['Sincrónica', 'Asincrónica', 'Batch'];
    const tipo = data.tipoInterfaz || data.tipo_interfaz;
    if (!tipo) {
      errores.push('El tipo de interfaz es obligatorio');
    } else if (!tiposValidos.includes(tipo)) {
      errores.push(
        `El tipo de interfaz debe ser uno de: ${tiposValidos.join(', ')}`,
      );
    }

    // 7. Validar protocolo_comunicacion
    const protocolosValidos = [
      'REST',
      'SOAP',
      'GraphQL',
      'Kafka',
      'RabbitMQ',
      'gRPC',
      'SFTP',
    ];
    const protocolo = data.protocoloComunicacion || data.protocolo_comunicacion;
    if (!protocolo) {
      errores.push('El protocolo de comunicación es obligatorio');
    } else if (!protocolosValidos.includes(protocolo)) {
      errores.push(
        `El protocolo debe ser uno de: ${protocolosValidos.join(', ')}`,
      );
    }

    // 8. Validar criticidad
    const criticidadesValidas = ['Alta', 'Media', 'Baja'];
    const criticidad = data.criticidad || 'Media';
    if (!criticidadesValidas.includes(criticidad)) {
      errores.push(
        `La criticidad debe ser uno de: ${criticidadesValidas.join(', ')}`,
      );
    }

    // 9. Validar responsable
    const responsable = data.responsable;
    if (!responsable || responsable.trim() === '') {
      errores.push('El responsable es obligatorio');
    } else if (responsable.length > 100) {
      errores.push('El responsable no puede exceder 100 caracteres');
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(responsable)) {
      errores.push('El responsable solo puede contener letras y espacios');
    }

    // 10. Validar estado
    const estadosValidos = [
      'Activo',
      'En desarrollo',
      'Deprecado',
      'Descontinuado',
    ];
    const estado = data.estado || 'Activo';
    if (!estadosValidos.includes(estado)) {
      errores.push(`El estado debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    // 11. Validar documentación (opcional pero formato URL)
    const doc = data.documentacionSoporte || data.documentacion_soporte;
    if (doc && doc.trim() !== '') {
      const urlRegex =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (
        !urlRegex.test(doc) &&
        !doc.includes('wiki') &&
        !doc.includes('confluence')
      ) {
        errores.push('La URL de documentación no tiene un formato válido');
      }
    }

    return { valido: errores.length === 0, errores };
  };

  // ============================================
  // POST crear integración
  // ============================================
  router.post('/integraciones', async (req, res) => {
    try {
      const data = req.body;

      // VALIDAR
      const { valido, errores } = validarIntegracion(data);
      if (!valido) {
        return res.status(400).json({
          error: 'Errores de validación',
          detalles: errores,
        });
      }

      // Verificar si ya existe un identificador duplicado
      const existe = await db('integraciones')
        .where('identificador_escenario', data.identificadorEscenario)
        .first();

      if (existe) {
        return res.status(409).json({
          error: 'Ya existe una integración con ese identificador',
          detalles: [
            `El identificador '${data.identificadorEscenario}' ya está en uso`,
          ],
        });
      }

      // Convertir camelCase a snake_case
      const insertData = {
        identificador_escenario: data.identificadorEscenario,
        aplicaciones_involucradas: data.aplicacionesInvolucradas,
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
        fecha_actualizacion: new Date(),
      };

      const result = await db('integraciones')
        .insert(insertData)
        .returning('*');

      res.status(201).json({
        mensaje: 'Integración creada exitosamente',
        data: result[0],
      });
    } catch (error: any) {
      console.error('Error al crear:', error);

      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Ya existe una integración con ese identificador',
          detalles: [error.detail],
        });
      }

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

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Verificar si existe
      const existe = await db('integraciones').where('id', id).first();
      if (!existe) {
        return res.status(404).json({ error: 'Integración no encontrada' });
      }

      // VALIDAR (sin validar obligatoriedad para PUT parcial)
      if (data.identificadorEscenario) {
        if (data.identificadorEscenario.length < 3) {
          return res
            .status(400)
            .json({
              error: 'El identificador debe tener al menos 3 caracteres',
            });
        }
        if (data.identificadorEscenario.length > 100) {
          return res
            .status(400)
            .json({
              error: 'El identificador no puede exceder 100 caracteres',
            });
        }

        // Verificar duplicado (excluyendo el actual)
        const duplicado = await db('integraciones')
          .where('identificador_escenario', data.identificadorEscenario)
          .whereNot('id', id)
          .first();

        if (duplicado) {
          return res
            .status(409)
            .json({
              error: 'Ya existe otra integración con ese identificador',
            });
        }
      }

      // Construir objeto de actualización
      const updateData: any = { fecha_actualizacion: new Date() };

      if (data.identificadorEscenario !== undefined)
        updateData.identificador_escenario = data.identificadorEscenario;
      if (data.aplicacionesInvolucradas !== undefined)
        updateData.aplicaciones_involucradas = data.aplicacionesInvolucradas;
      if (data.componenteEmisor !== undefined)
        updateData.componente_emisor = data.componenteEmisor;
      if (data.componenteReceptor !== undefined)
        updateData.componente_receptor = data.componenteReceptor;
      if (data.namespaceInterfaz !== undefined)
        updateData.namespace_interfaz = data.namespaceInterfaz;
      if (data.tipoInterfaz !== undefined)
        updateData.tipo_interfaz = data.tipoInterfaz;
      if (data.protocoloComunicacion !== undefined)
        updateData.protocolo_comunicacion = data.protocoloComunicacion;
      if (data.criticidad !== undefined)
        updateData.criticidad = data.criticidad;
      if (data.responsable !== undefined)
        updateData.responsable = data.responsable;
      if (data.documentacionSoporte !== undefined)
        updateData.documentacion_soporte = data.documentacionSoporte;
      if (data.descripcionFlujo !== undefined)
        updateData.descripcion_flujo = data.descripcionFlujo;
      if (data.estado !== undefined) updateData.estado = data.estado;

      await db('integraciones').where('id', id).update(updateData);

      const integracionActualizada = await db('integraciones')
        .where('id', id)
        .first();

      res.json({
        mensaje: 'Integración actualizada exitosamente',
        data: integracionActualizada,
      });
    } catch (error: any) {
      console.error('Error al actualizar:', error);

      if (error.code === '23505') {
        return res
          .status(409)
          .json({ error: 'Ya existe otra integración con ese identificador' });
      }

      res.status(500).json({ error: 'Error al actualizar integración' });
    }
  });

  // ============================================
  // DELETE eliminar integración
  // ============================================
  router.delete('/integraciones/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const existe = await db('integraciones').where('id', id).first();
      if (!existe) {
        return res.status(404).json({ error: 'Integración no encontrada' });
      }

      await db('integraciones').where('id', id).delete();

      res.status(200).json({
        mensaje: 'Integración eliminada exitosamente',
        id: parseInt(id),
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      res.status(500).json({ error: 'Error al eliminar integración' });
    }
  });

  // ============================================
  // GET estadísticas / resumen
  // ============================================
  router.get('/integraciones/stats/resumen', async (_req, res) => {
    try {
      const total = await db('integraciones').count('id as count').first();
      const activas = await db('integraciones')
        .where('estado', 'Activo')
        .count('id as count')
        .first();
      const altaCriticidad = await db('integraciones')
        .where('criticidad', 'Alta')
        .count('id as count')
        .first();
      const responsables = await db('integraciones').distinct('responsable');

      const protocolosUsados = await db('integraciones')
        .select('protocolo_comunicacion')
        .distinct();

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

  return router;
}
