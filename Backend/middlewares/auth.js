/**
 * ==============================================================================
 * Componente de Backend: authMiddleware (verificarToken)
 * ==============================================================================
 * Middleware de Express para validar y decodificar JSON Web Tokens (JWT).
 */

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.KEY;

/**
 * Middleware para verificar la validez de un JWT proporcionado en el encabezado Authorization.
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensaje: "Token no proporcionado" });
    }

    const parts = authHeader.split(" ");
    
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({ mensaje: "Formato de token inválido (Esperado: Bearer <token>)" });
    }
    
    const token = parts[1];

    if (!JWT_SECRET) {
        console.error("❌ JWT_SECRET no está configurado. Verificar archivo .env");
        return res.status(500).json({ mensaje: "Error de configuración del servidor" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 🔑 CLAVE: Adjuntamos el payload decodificado a req.usuario
        // El ID del usuario estará disponible en req.usuario.id en los controllers.
        req.usuario = decoded;
        
        next();
    } catch (error) {
        console.error("❌ Error al verificar token:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: "Token expirado" });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ mensaje: "Token inválido (Firma o formato incorrecto)" });
        } else {
            return res.status(403).json({ mensaje: "Token inválido" });
        }
    }
};

module.exports = verificarToken;
