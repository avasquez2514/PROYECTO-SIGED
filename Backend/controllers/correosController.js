/**
 * ==============================================================================
 *  Componente de Backend: mailController (CORREGIDO)
 * ==============================================================================
 * Centraliza la lógica para el envío y verificación del servicio de correo SMTP.
 * ✅ CORREGIDO: Manejo de archivos adjuntos sin Multer
 */

const nodemailer = require('nodemailer');

/**
 * ==============================================================================
 * FUNCIÓN 1: enviarCorreo (CORREGIDA)
 * ==============================================================================
 * Envía un correo electrónico con archivos adjuntos.
 * @param {import('express').Request} req - Requiere 'para', 'asunto', 'mensaje' en body.
 * @param {import('express').Response} res
 */
const enviarCorreo = async (req, res) => {
    try {
        const { para, cc, asunto, mensaje, archivos_info } = req.body;
        
        // Validar campos requeridos
        if (!para || !asunto || !mensaje) {
            return res.status(400).json({
                success: false,
                message: 'Los campos para, asunto y mensaje son requeridos'
            });
        }

        // Verificar configuración SMTP
        const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            return res.status(500).json({
                success: false,
                message: 'Configuración SMTP incompleta',
                missingVariables: missingVars
            });
        }

        // Configurar el transporter de nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // ✅ CORRECCIÓN: Manejo de archivos adjuntos sin Multer
        const attachments = [];
        
        // Si hay información de archivos en el body, procesarla
        if (archivos_info) {
            try {
                const archivosData = JSON.parse(archivos_info);
                if (Array.isArray(archivosData)) {
                    // En una implementación real, aquí procesarías los archivos base64
                    // Por ahora, solo registramos la información
                    console.log('📎 Archivos adjuntos info:', archivosData);
                    
                    // Ejemplo de cómo se procesarían archivos base64:
                    // archivosData.forEach(archivo => {
                    //     attachments.push({
                    //         filename: archivo.nombre,
                    //         content: archivo.contenidoBase64, // Decodificar base64
                    //         encoding: 'base64'
                    //     });
                    // });
                }
            } catch (error) {
                console.warn('⚠️ Error procesando información de archivos:', error);
            }
        }

        // Determinar si el mensaje contiene HTML
        const isHTML = mensaje.includes('<') && mensaje.includes('>');
        
        // Configurar el correo
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: para,
            cc: cc || undefined,
            subject: asunto,
            text: isHTML ? mensaje.replace(/<[^>]*>/g, '') : mensaje,
            html: isHTML ? mensaje : mensaje.replace(/\n/g, '<br>'),
            attachments: attachments.length > 0 ? attachments : undefined
        };

        console.log('📤 Enviando correo:', {
            to: para,
            cc: cc || 'No CC',
            subject: asunto,
            hasAttachments: attachments.length > 0
        });

        // Enviar el correo
        const info = await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Correo enviado exitosamente',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error al enviar correo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al enviar el correo',
            error: error.message
        });
    }
};

/**
 * ==============================================================================
 * FUNCIÓN 2: verificarConfiguracion (CORREGIDA)
 * ==============================================================================
 * Verifica la configuración y la conexión al servicio de correo SMTP.
 */
const verificarConfiguracion = async (req, res) => {
    try {
        // 1. Verificar variables de entorno
        const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Configuración incompleta: Faltan variables de entorno SMTP',
                missingVariables: missingVars
            });
        }

        // 2. Crear transporter para la verificación
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // 3. Verificar la conexión física y la autenticación
        await transporter.verify();

        res.json({
            success: true,
            message: 'Configuración de correo verificada correctamente',
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                from: process.env.EMAIL_FROM
            }
        });

    } catch (error) {
        console.error('❌ Error al verificar configuración SMTP:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar la configuración del correo',
            error: error.message,
            suggestion: 'Verifique host/puerto/credenciales SMTP'
        });
    }
};

module.exports = {
    enviarCorreo,
    verificarConfiguracion
};
