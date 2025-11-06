/**
 * ==============================================================================
 * Componente de Backend: notasController (Corregido)
 * ==============================================================================
 * Se modifican las funciones de consulta para usar req.usuario.id (del token) 
 * en lugar de req.params.usuario_id.
 */

// Importa la conexión a la base de datos PostgreSQL
const pool = require("../db");

// Importa uuidv4 para generar identificadores únicos
const { v4: uuidv4 } = require("uuid");

/**
 * ==============================================================================
 * FUNCIÓN 1: obtenerNotas
 * ==============================================================================
 * Descripción: Obtener todas las notas/plantillas asignadas a un usuario.
 * Ruta Lógica: GET /api/notas (ID tomado del token)
 */
async function obtenerNotas(req, res) {
    // 💡 CORRECCIÓN: Obtener usuario_id desde el token (establecido por verificarToken)
    const usuario_id = req.usuario.id; 

    try {
        const result = await pool.query(
            `
            SELECT 
              ndr.id,
              ndr.plantilla_id,
              pb.novedad,
              pb.nota_publica,
              pb.nota_interna,
              pb.nota_avances,
              pb.plantilla,
              ndr.creado_en
            FROM notas_despacho_rel ndr
            INNER JOIN plantillas_base pb ON ndr.plantilla_id = pb.id
            WHERE ndr.usuario_id = $1
            ORDER BY ndr.creado_en DESC
            `,
            [usuario_id] // Usar el ID del token aquí
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener las notas:", error);
        res.status(500).json({ mensaje: "Error al obtener las notas", error });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 2: obtenerNotasAvances
 * ==============================================================================
 * Descripción: Obtener solo las notas de avances (con contenido) de un usuario.
 * Ruta Lógica: GET /api/notas/avances (ID tomado del token)
 */
async function obtenerNotasAvances(req, res) {
    // 💡 CORRECCIÓN: Obtener usuario_id desde el token
    const usuario_id = req.usuario.id; 

    try {
        const result = await pool.query(
            `
            SELECT 
              ndr.id,
              ndr.plantilla_id,
              pb.novedad,
              pb.nota_avances,
              ndr.creado_en
            FROM notas_despacho_rel ndr
            INNER JOIN plantillas_base pb ON ndr.plantilla_id = pb.id
            WHERE ndr.usuario_id = $1
            AND pb.nota_avances IS NOT NULL
            AND TRIM(pb.nota_avances) != ''
            ORDER BY ndr.creado_en DESC
            `,
            [usuario_id] // Usar el ID del token aquí
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener notas de avances:", error);
        res.status(500).json({ mensaje: "Error al obtener notas de avances", error });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 3: agregarNota (Crear Plantilla Personalizada)
 * ==============================================================================
 * Descripción: Crea una nueva plantilla base personalizada y la asigna al usuario.
 * Ruta Lógica: POST /api/notas
 */
async function agregarNota(req, res) {
    // 💡 CORRECCIÓN: Obtener usuario_id desde el token
    const usuario_id = req.usuario.id; 
    
    // El frontend aún envía usuario_id, pero se prefiere el del token para seguridad
    // const { usuario_id, novedad, nota_publica, nota_interna, nota_avances, plantilla } = req.body;
    const { novedad, nota_publica, nota_interna, nota_avances, plantilla } = req.body;


    if (!usuario_id || !novedad) {
        return res.status(400).json({ 
            mensaje: "Se requieren usuario_id (del token) y novedad como mínimo" 
        });
    }

    // Validación de nombres prohibidos para evitar conflictos de lógica interna
    const nombresIncorrectos = ['AVANCE', 'avance', 'Avance'];
    if (nombresIncorrectos.includes(novedad)) {
        return res.status(400).json({ 
            mensaje: "El nombre 'AVANCE' no es válido para una plantilla base. Use un nombre descriptivo.",
            sugerencias: ["Reporte de Avances", "Seguimiento de Proyecto", "Actualización de Estado"]
        });
    }

    try {
        // Verificar que el usuario existe (aunque esto ya se hizo en el middleware, se mantiene para robustez)
        const usuarioExiste = await pool.query("SELECT id FROM usuarios WHERE id = $1", [usuario_id]);
        if (usuarioExiste.rows.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        // 1. Crear una nueva plantilla base personalizada
        const plantillaId = uuidv4();
        await pool.query(
            `INSERT INTO plantillas_base (id, novedad, nota_publica, nota_interna, nota_avances, plantilla) VALUES ($1, $2, $3, $4, $5, $6)`,
            [plantillaId, novedad, nota_publica || '', nota_interna || '', nota_avances || '', plantilla || '']
        );

        // 2. Crear la relación usuario-plantilla
        const relacionId = uuidv4();
        await pool.query(
            `INSERT INTO notas_despacho_rel (id, usuario_id, plantilla_id, creado_en) VALUES ($1, $2, $3, NOW())`,
            [relacionId, usuario_id, plantillaId]
        );

        res.status(201).json({ 
            mensaje: "Nota personalizada creada exitosamente",
            id: relacionId,
            plantilla_id: plantillaId
        });
    } catch (error) {
        console.error("❌ Error al agregar nota personalizada:", error);
        res.status(500).json({ mensaje: "Error al agregar nota personalizada", error: error.message });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 4: asignarNota (Asignar Plantilla Existente)
 * ==============================================================================
 * Descripción: Asigna una plantilla base existente al usuario.
 * Ruta Lógica: POST /api/notas/asignar
 */
async function asignarNota(req, res) {
    // 💡 CORRECCIÓN: Obtener usuario_id desde el token
    const usuario_id = req.usuario.id; 
    const { plantilla_id } = req.body; // Solo se necesita plantilla_id del body

    if (!usuario_id || !plantilla_id) {
        return res.status(400).json({ mensaje: "Se requieren usuario_id (del token) y plantilla_id" });
    }

    try {
        // Validaciones: Usuario existe, Plantilla base existe, Relación no existe (409 Conflict)
        const [usuarioExiste, plantillaExiste, relacionExiste] = await Promise.all([
            pool.query("SELECT id FROM usuarios WHERE id = $1", [usuario_id]),
            pool.query("SELECT id FROM plantillas_base WHERE id = $1", [plantilla_id]),
            pool.query("SELECT id FROM notas_despacho_rel WHERE usuario_id = $1 AND plantilla_id = $2", [usuario_id, plantilla_id])
        ]);

        if (usuarioExiste.rows.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });
        if (plantillaExiste.rows.length === 0) return res.status(404).json({ mensaje: "Plantilla base no encontrada" });
        if (relacionExiste.rows.length > 0) return res.status(409).json({ mensaje: "La nota ya está agregada para este usuario" });

        const id = uuidv4();

        // Inserción de la relación
        await pool.query(
            `INSERT INTO notas_despacho_rel (id, usuario_id, plantilla_id, creado_en) VALUES ($1, $2, $3, NOW())`,
            [id, usuario_id, plantilla_id]
        );

        res.status(201).json({ mensaje: "Nota asignada exitosamente", id: id });
    } catch (error) {
        console.error("❌ Error al asignar nota:", error);
        res.status(500).json({ mensaje: "Error al asignar nota", error: error.message });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 5: modificarPlantilla
 * ==============================================================================
 * Descripción: Modifica el contenido de una plantilla base existente.
 * Ruta Lógica: PUT /api/notas/plantilla/:id
 * (No necesita el ID del usuario, solo el ID de la plantilla)
 */
async function modificarPlantilla(req, res) {
    const { id } = req.params;
    const { novedad, nota_publica, nota_interna, nota_avances, plantilla } = req.body;

    try {
        const result = await pool.query(
            `
            UPDATE plantillas_base
            SET novedad = $1, nota_publica = $2, nota_interna = $3, nota_avances = $4, plantilla = $5
            WHERE id = $6
            `,
            [novedad, nota_publica, nota_interna, nota_avances, plantilla, id]
        );

        if (result.rowCount === 0) {
             return res.status(404).json({ mensaje: "Plantilla no encontrada o no se modificó nada" });
        }

        res.json({ 
            mensaje: "Plantilla actualizada correctamente",
            filas_afectadas: result.rowCount,
            plantilla_id: id
        });
    } catch (error) {
        console.error("❌ Error al modificar plantilla:", error);
        res.status(500).json({ mensaje: "Error al modificar plantilla", error });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 6: eliminarNota (Eliminación con Autolimpieza)
 * ==============================================================================
 * Descripción: Elimina la relación y, si es personalizada, elimina la plantilla base.
 * Ruta Lógica: DELETE /api/notas/:id (id = id de notas_despacho_rel)
 * (No necesita el ID del usuario en la consulta, pero es segura)
 */
async function eliminarNota(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ mensaje: "Se requiere el ID de la nota" });
    }

    try {
        // Obtener info de la relación y el conteo de usuarios
        const relacionInfo = await pool.query(
            `
            SELECT 
              ndr.id as relacion_id, ndr.plantilla_id, pb.novedad,
              pb.nota_publica, pb.nota_interna, pb.nota_avances, pb.plantilla,
              COUNT(ndr2.id) as total_usuarios_con_esta_plantilla
            FROM notas_despacho_rel ndr
            INNER JOIN plantillas_base pb ON ndr.plantilla_id = pb.id
            LEFT JOIN notas_despacho_rel ndr2 ON pb.id = ndr2.plantilla_id
            WHERE ndr.id = $1
            GROUP BY ndr.id, ndr.plantilla_id, pb.novedad, pb.nota_publica, pb.nota_interna, pb.nota_avances, pb.plantilla
            `, 
            [id]
        );
        
        if (relacionInfo.rows.length === 0) {
            return res.status(404).json({ mensaje: "Nota no encontrada" });
        }

        const info = relacionInfo.rows[0];
        
        // Determinar si la plantilla es personalizada
        const esNotaAvancesPura = (
            info.nota_avances?.trim() && 
            !info.nota_publica?.trim() && 
            !info.nota_interna?.trim() && 
            !info.plantilla?.trim()
        );
        const esPlantillaPersonalizada = info.total_usuarios_con_esta_plantilla <= 1 || esNotaAvancesPura;

        // 1. Eliminar la relación usuario-plantilla
        const resultRelacion = await pool.query("DELETE FROM notas_despacho_rel WHERE id = $1", [id]);

        if (resultRelacion.rowCount === 0) {
            return res.status(404).json({ mensaje: "No se pudo eliminar la relación de la nota" });
        }

        // 2. Autolimpieza: Si es personalizada (solo usada por este usuario o es una "nota avance pura"), eliminar plantilla base
        if (esPlantillaPersonalizada) {
            await pool.query("DELETE FROM plantillas_base WHERE id = $1", [info.plantilla_id]);
            console.log(`✅ Plantilla personalizada "${info.novedad}" eliminada completamente`);
        }

        res.json({ 
            mensaje: "Nota eliminada correctamente",
            plantilla_eliminada: esPlantillaPersonalizada,
            plantilla_nombre: info.novedad
        });
    } catch (error) {
        console.error("❌ Error al eliminar nota:", error);
        res.status(500).json({ mensaje: "Error al eliminar nota", error: error.message });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 7: limpiarNotaAvances
 * ==============================================================================
 * Descripción: Limpia el campo `nota_avances` de una plantilla base.
 * Ruta Lógica: PATCH /api/notas/limpiar-avances/:id (id = id de plantillas_base)
 */
async function limpiarNotaAvances(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query("UPDATE plantillas_base SET nota_avances = NULL WHERE id = $1", [id]);
        if (result.rowCount === 0) {
             return res.status(404).json({ mensaje: "Plantilla no encontrada" });
        }
        res.json({ mensaje: "Nota de avances eliminada correctamente" });
    } catch (error) {
        console.error("❌ Error al limpiar nota de avances:", error);
        res.status(500).json({ mensaje: "Error al limpiar nota de avances", error });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 8: eliminarPlantillaAdicional (Eliminación Forzada)
 * ==============================================================================
 * Descripción: Elimina una plantilla base y todas sus relaciones.
 * Ruta Lógica: DELETE /api/notas/plantilla/:id (id = id de plantillas_base)
 */
async function eliminarPlantillaAdicional(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ mensaje: "Se requiere el ID de la plantilla" });
    }

    try {
        // 1. Verificar y obtener nombre de la plantilla
        const plantillaExiste = await pool.query("SELECT id, novedad FROM plantillas_base WHERE id = $1", [id]);
        if (plantillaExiste.rows.length === 0) {
            return res.status(404).json({ mensaje: "Plantilla no encontrada" });
        }
        const plantilla = plantillaExiste.rows[0];

        // 2. Eliminar todas las relaciones usuario-plantilla
        const resultRelaciones = await pool.query("DELETE FROM notas_despacho_rel WHERE plantilla_id = $1", [id]);

        // 3. Eliminar la plantilla base
        const resultPlantilla = await pool.query("DELETE FROM plantillas_base WHERE id = $1", [id]);

        res.json({ 
            mensaje: "Plantilla eliminada completamente",
            plantilla_nombre: plantilla.novedad,
            relaciones_eliminadas: resultRelaciones.rowCount
        });
    } catch (error) {
        console.error("❌ Error al eliminar plantilla:", error);
        res.status(500).json({ mensaje: "Error al eliminar plantilla", error: error.message });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 9: obtenerPlantillasDisponibles
 * ==============================================================================
 * Descripción: Obtener el catálogo completo de plantillas base (excluyendo nombres prohibidos).
 * Ruta Lógica: GET /api/notas/plantillas-disponibles
 */
async function obtenerPlantillasDisponibles(req, res) {
    // 💡 NOTA: Esta función no requiere el ID del usuario
    try {
        const result = await pool.query(
            `
            SELECT id, novedad, nota_publica, nota_interna, nota_avances, plantilla
            FROM plantillas_base
            WHERE UPPER(novedad) NOT IN ('AVANCE')
            ORDER BY novedad ASC
            `
        );
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener plantillas disponibles:", error);
        res.status(500).json({ mensaje: "Error al obtener plantillas disponibles", error: error.message });
    }
}

/**
 * ==============================================================================
 * FUNCIÓN 10: limpiarPlantillasIncorrectas (Mantenimiento)
 * ==============================================================================
 * Descripción: Elimina plantillas base con nombres prohibidos.
 * Ruta Lógica: DELETE /api/notas/limpiar-plantillas-incorrectas
 */
async function limpiarPlantillasIncorrectas(req, res) {
    // 💡 NOTA: Esta función no requiere el ID del usuario
    try {
        // 1. Buscar plantillas con nombres incorrectos y su conteo de relaciones
        const plantillasIncorrectas = await pool.query(
            `
            SELECT pb.id, pb.novedad, COUNT(ndr.id) as total_usuarios
            FROM plantillas_base pb
            LEFT JOIN notas_despacho_rel ndr ON pb.id = ndr.plantilla_id
            WHERE UPPER(pb.novedad) IN ('AVANCE')
            GROUP BY pb.id, pb.novedad
            `
        );

        if (plantillasIncorrectas.rows.length === 0) {
            return res.json({ mensaje: "No hay plantillas con nombres incorrectos", plantillas_eliminadas: 0 });
        }

        let plantillasEliminadas = 0;

        // 2. Eliminar relaciones y luego la plantilla base para cada una
        for (const plantilla of plantillasIncorrectas.rows) {
            await pool.query("DELETE FROM notas_despacho_rel WHERE plantilla_id = $1", [plantilla.id]);
            await pool.query("DELETE FROM plantillas_base WHERE id = $1", [plantilla.id]);
            plantillasEliminadas++;
            console.log(`✅ Plantilla incorrecta "${plantilla.novedad}" eliminada`);
        }

        res.json({ 
            mensaje: `Se eliminaron ${plantillasEliminadas} plantillas con nombres incorrectos`,
            plantillas_eliminadas: plantillasEliminadas,
            detalles: plantillasIncorrectas.rows.map(p => ({ nombre: p.novedad, usuarios_afectados: p.total_usuarios }))
        });
    } catch (error) {
        console.error("❌ Error al limpiar plantillas incorrectas:", error);
        res.status(500).json({ mensaje: "Error al limpiar plantillas incorrectas", error: error.message });
    }
}

// Exportar funciones explícitamente
module.exports = {
    obtenerNotas,
    obtenerNotasAvances,
    agregarNota,
    asignarNota,
    modificarPlantilla,
    eliminarNota,
    limpiarNotaAvances,
    eliminarPlantillaAdicional,
    obtenerPlantillasDisponibles,
    limpiarPlantillasIncorrectas,
};
