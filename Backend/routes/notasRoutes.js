// Importa Express y crea una instancia del enrutador
const express = require('express');
const router = express.Router();

// Importa el controlador que contiene la lógica de las notas
const notasController = require('../controllers/notasController');

// Importa el middleware de autenticación
const verificarToken = require('../middlewares/auth');


// ==============================
//  OBTENER NOTAS (CORREGIDAS PARA SEGURIDAD)
// ==============================

/**
 * Ruta: GET /api/notas/
 * Descripción: Obtiene todas las notas del usuario (ID tomado del token)
 * 🚨 Importante: La lógica en el Controller debe usar req.usuario.id
 */
router.get('/', verificarToken, notasController.obtenerNotas);

/**
 * Ruta: GET /api/notas/avances
 * Descripción: Obtiene solo las notas de avances del usuario (ID tomado del token)
 * 🚨 ELIMINADO: La URL ya no incluye :usuario_id
 */
router.get('/avances', verificarToken, notasController.obtenerNotasAvances);

/**
 * Ruta: GET /api/notas/plantillas-disponibles
 * Descripción: Obtiene todas las plantillas base disponibles
 */
router.get('/plantillas-disponibles', verificarToken, notasController.obtenerPlantillasDisponibles);


// ==============================
// ✍️ CREAR Y MODIFICAR NOTAS
// ==============================

/**
 * Ruta: POST /api/notas
 * Descripción: Crea una nueva nota personalizada
 * El Controller debe obtener el usuario_id de req.usuario.id
 */
router.post('/', verificarToken, notasController.agregarNota);

/**
 * Ruta: POST /api/notas/asignar
 * Descripción: Asigna una plantilla base existente al usuario
 */
router.post('/asignar', verificarToken, notasController.asignarNota);

/**
 * Ruta: PUT /api/notas/plantilla/:id
 * Descripción: Modifica una plantilla base existente por su ID
 */
router.put('/plantilla/:id', verificarToken, notasController.modificarPlantilla);


// ==============================
// 🧹 ELIMINAR O LIMPIAR NOTAS
// ==============================

/**
 * Ruta: DELETE /api/notas/:id
 * Descripción: Elimina completamente una nota
 */
router.delete('/:id', verificarToken, notasController.eliminarNota);

/**
 * Ruta: PATCH /api/notas/limpiar-avances/:id
 * Descripción: Limpia solo el campo nota_avances
 */
router.patch('/limpiar-avances/:id', verificarToken, notasController.limpiarNotaAvances);

/**
 * Ruta: DELETE /api/notas/plantilla/:id
 * Descripción: Elimina completamente una plantilla base
 */
router.delete('/plantilla/:id', verificarToken, notasController.eliminarPlantillaAdicional);

/**
 * Ruta: DELETE /api/notas/limpiar-plantillas-incorrectas
 * Descripción: Elimina plantillas con nombres incorrectos
 */
router.delete('/limpiar-plantillas-incorrectas', verificarToken, notasController.limpiarPlantillasIncorrectas);


// Exporta el enrutador para ser usado en server.js
module.exports = router;
