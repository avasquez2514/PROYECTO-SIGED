"use client";

import React, { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";
import "../styles/envioCorreos.css";

/**
 * Tipos de envío de correo soportados por el componente
 * @typedef {"envioInicio" | "envioCierre" | "envioApertura" | "envioPermisos"} TipoEnvio
 */

/**
 * Props del componente EnvioCorreos
 * @interface EnvioCorreosProps
 * @property {TipoEnvio} tipo - Tipo de envío que determina el comportamiento y contenido
 */
interface EnvioCorreosProps {
  tipo: "envioInicio" | "envioCierre" | "envioApertura" | "envioPermisos";
}

/**
 * Props del componente de Firma
 * @interface FirmaProps
 * @property {string} [nombrePersonalizado] - Nombre personalizado para la firma
 * @property {boolean} incluirFirma - Indica si se debe mostrar la firma
 * @property {() => void} onToggleFirma - Función para alternar la visibilidad de la firma
 * @property {(nombre: string) => void} onNombreChange - Función para actualizar el nombre personalizado
 */
interface FirmaProps {
  nombrePersonalizado?: string;
  incluirFirma: boolean;
  onToggleFirma: () => void;
  onNombreChange: (nombre: string) => void;
}

/**
 * Interfaz para archivos adjuntos
 * @interface ArchivoAdjunto
 * @property {string} id - Identificador único del archivo
 * @property {string} nombre - Nombre original del archivo
 * @property {File} archivo - Objeto File del archivo
 */
interface ArchivoAdjunto {
  id: string;
  nombre: string;
  archivo: File;
}

// ReactQuill no es compatible con React 19, usando textarea simple

/**
 * Componente de Firma para correos electrónicos
 * Muestra información de contacto y logo de la empresa
 * @component
 * @param {FirmaProps} props - Props del componente
 * @returns {JSX.Element | null} Componente de firma o null si no está activo
 */
const Firma: React.FC<FirmaProps> = ({
  nombrePersonalizado,
  incluirFirma,
  onToggleFirma,
  onNombreChange
}) => {
  // Si no se incluye firma, no renderizar nada
  if (!incluirFirma) return null;

  return (
    <div className="firma-container">
      <div className="firma-content">
        {/* Nombre del remitente */}
        <div className="firma-nombre">{nombrePersonalizado || "Anderson Vasquez Gonzalez"}</div>
        {/* Cargo y departamento */}
        <div className="firma-cargo1">Despacho Reparaciones B2B</div>
        <div className="firma-cargo2">Gerencia Soporte a Clientes</div>
        <div className="firma-cargo3">Vicepresidencia de Negocios Empresas y Gobierno</div>
        {/* Línea decorativa */}
        <div className="firma-linea"></div>
        {/* Logo de la empresa */}
        <div className="firma-logo">
          <img src="/logotigo.png" alt="Tigo" className="logo-imagen" />
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal para envío de correos electrónicos
 * Permite crear, editar y enviar correos con diferentes plantillas según el tipo
 * @component
 * @param {EnvioCorreosProps} props - Props del componente
 * @returns {JSX.Element} Interfaz completa de envío de correos
 */
const EnvioCorreos: React.FC<EnvioCorreosProps> = ({ tipo }) => {
  // --- ESTADOS DEL FORMULARIO ---

  /**
   * Estado para destinatarios principales del correo
   * @state {string}
   */
  const [para, setPara] = useState("");

  /**
   * Estado para destinatarios en copia
   * @state {string}
   */
  const [cc, setCc] = useState("");

  /**
   * Estado para el asunto del correo
   * @state {string}
   */
  const [asunto, setAsunto] = useState("");

  /**
   * Estado para el cuerpo del mensaje
   * @state {string}
   */
  const [mensaje, setMensaje] = useState("");

  /**
   * Estado para el título del componente según el tipo
   * @state {string}
   */
  const [titulo, setTitulo] = useState("");

  /**
   * Estado para la lista de archivos adjuntos
   * @state {ArchivoAdjunto[]}
   */
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>([]);

  /**
   * Estado para controlar la visualización de la vista previa
   * @state {boolean}
   */
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);

  /**
   * Estado para incluir o no la firma en el correo
   * @state {boolean}
   */
  const [incluirFirma, setIncluirFirma] = useState(false);

  /**
   * Estado para el nombre personalizado en la firma
   * @state {string}
   */
  const [nombrePersonalizado, setNombrePersonalizado] = useState("Anderson Vasquez Gonzalez");

  // --- ESTADOS PARA FECHAS FORMATEADAS ---

  /**
   * Estado para fecha actual en formato DD-MM-YYYY
   * @state {string}
   */
  const [fechaHoyGuiones, setFechaHoyGuiones] = useState("");

  /**
   * Estado para fecha actual en formato YYYY_MM_DD
   * @state {string}
   */
  const [fechaHoyGuionesBajo, setFechaHoyGuionesBajo] = useState("");

  /**
   * Estado para fecha de mañana en formato DD-MM-YYYY
   * @state {string}
   */
  const [fechaMananaGuiones, setFechaMananaGuiones] = useState("");

  /**
   * Estado para fecha de mañana en formato YYYY_MM_DD
   * @state {string}
   */
  const [fechaMananaGuionesBajo, setFechaMananaGuionesBajo] = useState("");

  // --- EFECTOS DE INICIALIZACIÓN ---

  /**
   * Efecto para cargar datos guardados desde localStorage
   * Se ejecuta una vez al montar el componente
   */
  useEffect(() => {
    // Obtener datos guardados para el tipo específico
    const dataGuardada = localStorage.getItem(`correos_${tipo}`);
    if (dataGuardada) {
      try {
        // Parsear y aplicar datos guardados
        const { para, cc, asunto, mensaje, incluirFirma, nombrePersonalizado } = JSON.parse(dataGuardada);
        setPara(para || "");
        setCc(cc || "");
        setAsunto(asunto || "");
        setMensaje(mensaje || "");
        setIncluirFirma(incluirFirma || false);
        setNombrePersonalizado(nombrePersonalizado || "Anderson Vasquez Gonzalez");
      } catch (e) {
        console.error("❌ Error cargando datos de localStorage:", e);
      }
    }
  }, []); // Solo ejecutar una vez al montar el componente

  /**
   * Efecto para calcular y formatear fechas de hoy y mañana
   * Se ejecuta una vez al montar el componente
   */
  useEffect(() => {
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    /**
     * Formatea una fecha en formato DD-MM-YYYY
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    const formatGuiones = (date: Date) => {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    };

    /**
     * Formatea una fecha en formato YYYY_MM_DD
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    const formatGuionesBajo = (date: Date) => {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${y}_${m}_${d}`;
    };

    // Establecer fechas formateadas
    setFechaHoyGuiones(formatGuiones(hoy));
    setFechaHoyGuionesBajo(formatGuionesBajo(hoy));
    setFechaMananaGuiones(formatGuiones(manana));
    setFechaMananaGuionesBajo(formatGuionesBajo(manana));
  }, []);

  /**
   * Efecto para establecer el título según el tipo de envío
   * Se ejecuta cuando cambia el tipo
   */
  useEffect(() => {
    switch (tipo) {
      case "envioInicio":
        setTitulo("📤 Envío de Correos - Inicio");
        break;
      case "envioCierre":
        setTitulo("📤 Envío de Correos - Cierre");
        break;
      case "envioApertura":
        setTitulo("📤 Envío de Correos - Apertura");
        break;
      case "envioPermisos":
        setTitulo("📤 Envío de Correos - Permisos");
        break;
    }
  }, [tipo]);

  /**
   * Efecto para establecer contenido predeterminado según el tipo
   * Se ejecuta cuando cambian el tipo o las fechas
   */
  useEffect(() => {
    // Esperar a que las fechas estén disponibles
    if (!fechaHoyGuiones || !fechaHoyGuionesBajo || !fechaMananaGuiones || !fechaMananaGuionesBajo) return;

    // Aplicar contenido predeterminado según el tipo
    switch (tipo) {
      case "envioApertura":
        setAsunto(`Asignación Nacional ${fechaMananaGuiones} Logística de Campo B2B - EIA`);
        setMensaje(`Buen día,<br><br>

Se anexa tabla con la apertura de despacho reparación con la Asignación Nacional ${fechaMananaGuiones}

En las zonas donde falte completar la ratio de órdenes a los técnicos y tecnólogos en el transcurso de la mañana se les estarán asignando las demás órdenes.<br><br>`);
        break;

      case "envioCierre":
        setAsunto(`[Mesa de Despacho] – Informe diario de actualización día de hoy_ ${fechaHoyGuionesBajo}_EIA`);
        setMensaje(`Cordial saludo,<br><br>

Nos permitimos anexar la programación del día de hoy ${fechaHoyGuionesBajo} debidamente actualizado (estados). De igual manera ya se encuentra disponible en la ruta compartida.

Cualquier inquietud, quedamos atentos.<br><br>`);
        break;

      case "envioInicio":
        setAsunto(`[Mesa de Despacho] – Informe diario de programación_${fechaMananaGuionesBajo}_ EIA`);
        setMensaje(`Cordial saludo,<br><br>

Nos permitimos anexar la programación para el día de mañana ${fechaMananaGuionesBajo}. De igual manera ya se encuentra disponible en la ruta compartida.

Cualquier inquietud, quedamos atentos.<br><br>`);
        break;

      case "envioPermisos":
        setAsunto("SOLICITUD PERMISOS DE INGRESO");
        setMensaje(`Cordial saludo,<br><br>

Solicitamos por favor gestionar permisos de ingreso para el siguiente personal, con el fin de poder realizar la reparación.<br><br>
`);
        break;
    }
  }, [tipo, fechaHoyGuiones, fechaHoyGuionesBajo, fechaMananaGuiones, fechaMananaGuionesBajo]);

  // --- FUNCIONES DE UTILIDAD ---

  /**
   * Copia texto al portapapeles
   * @param {string} texto - Texto a copiar
   */
  const copiarTexto = (texto: string) => navigator.clipboard.writeText(texto);

  /**
   * Copia todo el contenido del formulario al portapapeles
   */
  const copiarTodo = () => {
    const textoCompleto = `Para:\n${para}\n\nCC:\n${cc}\n\nAsunto:\n${asunto}\n\n${mensaje}`;
    navigator.clipboard.writeText(textoCompleto);
  };

  /**
   * Guarda el estado actual del formulario en localStorage
   */
  const guardarTodo = () => {
    const data = { para, cc, asunto, mensaje, incluirFirma, nombrePersonalizado };
    localStorage.setItem(`correos_${tipo}`, JSON.stringify(data));
    alert("Información guardada");
  };

  /**
   * Limpia todos los campos del formulario
   */
  const limpiarFormulario = () => {
    // Usar setTimeout para evitar problemas de re-renderizado
    setTimeout(() => {
      setPara('');
      setCc('');
      setAsunto('');
      setMensaje('');
      setArchivos([]);

      // Forzar el foco en el textarea después de limpiar
      setTimeout(() => {
        const textarea = document.querySelector('.mensaje-con-tablas') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.disabled = false;
        }
      }, 200);

      alert("Formulario limpiado");
    }, 100);
  };

  // --- VALIDACIÓN DE EMAILS ---

  /**
   * Valida un email individual
   * @param {string} email - Email a validar
   * @returns {boolean} True si el email es válido
   */
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  /**
   * Valida una lista de emails separados por comas, puntos y coma o espacios
   * @param {string} listaEmails - Lista de emails a validar
   * @returns {boolean} True si todos los emails son válidos
   */
  const validarListaEmails = (listaEmails: string): boolean => {
    if (!listaEmails.trim()) return true; // Campo vacío es válido
    const emails = listaEmails.split(/[,;\s]+/).filter(email => email.trim());
    return emails.every(email => validarEmail(email.trim()));
  };

  /**
   * Obtiene la clase CSS para indicar validación de email
   * @param {string} campo - Campo de email a validar
   * @returns {string} Clase CSS para indicar estado de validación
   */
  const obtenerClaseValidacion = (campo: string): string => {
    if (!campo.trim()) return "";
    return validarListaEmails(campo) ? "email-valido" : "email-invalido";
  };

  // --- MANEJO DE ARCHIVOS ADJUNTOS ---

  /**
   * Maneja la selección de archivos para adjuntar
   * @param {React.ChangeEvent<HTMLInputElement>} event - Evento de cambio del input file
   */
  const manejarSeleccionArchivos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivosSeleccionados = Array.from(event.target.files || []);
    const nuevosArchivos: ArchivoAdjunto[] = archivosSeleccionados.map(archivo => ({
      id: Math.random().toString(36).substr(2, 9),
      nombre: archivo.name,
      archivo: archivo
    }));
    setArchivos(prev => [...prev, ...nuevosArchivos]);
  };

  /**
   * Elimina un archivo adjunto de la lista
   * @param {string} id - ID del archivo a eliminar
   */
  const eliminarArchivo = (id: string) => {
    setArchivos(prev => prev.filter(archivo => archivo.id !== id));
  };

  // --- MANEJO DE TABLAS PEGADAS ---

  /**
   * Maneja el pegado de tablas desde Excel u otras fuentes
   * @param {React.ClipboardEvent} event - Evento de pegado
   */
  const manejarPegadoTablas = (event: React.ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');

    if (pastedData.includes('<table') || pastedData.includes('\t')) {
      // Es una tabla HTML o datos tabulares
      event.preventDefault();
      const tablaFormateada = formatearTabla(pastedData);
      const nuevoMensaje = mensaje + (mensaje ? '\n\n' : '') + tablaFormateada;
      setMensaje(nuevoMensaje);
    }
  };

  /**
   * Formatea datos de tabla pegados a HTML estilizado
   * @param {string} data - Datos de tabla en HTML o texto plano
   * @returns {string} Tabla formateada en HTML
   */
  const formatearTabla = (data: string): string => {
    // Si es HTML, extraer el contenido de la tabla
    if (data.includes('<table')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      const table = doc.querySelector('table');

      if (table) {
        let tablaHTML = '<div style="margin: 15px 0; display: inline-block;">';

        // Buscar título antes de la tabla
        const titulo = table.previousSibling?.textContent?.trim() ||
          table.parentElement?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() ||
          '';

        if (titulo && titulo.toUpperCase() === titulo && titulo.length > 3) {
          tablaHTML += `<h3 style="color: #1a73e8; font-weight: bold; text-align: center; margin-bottom: 10px; font-size: 16px; margin-top: 0;">${titulo}</h3>`;
        }

        tablaHTML += '<table style="border-collapse: collapse; width: auto; max-width: 400px; font-family: Arial, sans-serif; margin: 0 auto;">';

        const filas = table.querySelectorAll('tr');
        filas.forEach((fila) => {
          const celdas = fila.querySelectorAll('td, th');
          const esFilaTotal = Array.from(celdas).some(celda =>
            celda.textContent?.toLowerCase().includes('total')
          );

          tablaHTML += '<tr>';
          celdas.forEach((celda, celdaIndex) => {
            const texto = celda.textContent?.trim() || '';
            const esTitulo = celda.tagName === 'TH';

            let estilo = 'padding: 6px 10px; border: 1px solid #000; font-size: 13px; ';

            if (esTitulo) {
              estilo += 'background-color: #1a73e8; color: white; font-weight: bold; text-align: center;';
            } else if (esFilaTotal) {
              estilo += 'background-color: #ffffff; font-weight: bold;';
            } else {
              estilo += 'background-color: #e8f0fe;';
            }

            // Alineación de texto
            if (celdaIndex === celdas.length - 1 && texto.includes('$')) {
              estilo += ' text-align: right;';
            } else {
              estilo += ' text-align: left;';
            }

            tablaHTML += `<td style="${estilo}">${texto}</td>`;
          });
          tablaHTML += '</tr>';
        });

        tablaHTML += '</table></div>';
        return tablaHTML;
      }
    }

    // Si es texto plano con tabs o espacios, convertir a HTML
    if (data.includes('\t') || data.includes('  ')) {
      const lineas = data.split('\n');
      let tablaHTML = '<div style="margin: 15px 0; display: inline-block;">';
      let titulo = '';
      const filasDatos: string[][] = [];

      lineas.forEach((linea, index) => {
        if (linea.trim()) {
          const partes = linea.split('\t').map(p => p.trim());
          const primeraParte = partes[0] || '';

          // Detectar título
          if (primeraParte === primeraParte.toUpperCase() &&
            primeraParte.length > 3 &&
            !primeraParte.includes('$') &&
            !primeraParte.toLowerCase().includes('total') &&
            index === 0) {
            titulo = primeraParte;
          } else {
            filasDatos.push(partes);
          }
        }
      });

      // Agregar título si existe
      if (titulo) {
        tablaHTML += `<h3 style="color: #1a73e8; font-weight: bold; text-align: center; margin-bottom: 10px; font-size: 16px; margin-top: 0;">${titulo}</h3>`;
      }

      tablaHTML += '<table style="border-collapse: collapse; width: auto; max-width: 400px; font-family: Arial, sans-serif; margin: 0 auto;">';

      filasDatos.forEach((fila) => {
        const esFilaTotal = fila.some(celda => celda.toLowerCase().includes('total'));

        tablaHTML += '<tr>';
        fila.forEach((celda, celdaIndex) => {
          let estilo = 'padding: 6px 10px; border: 1px solid #000; font-size: 13px; ';

          if (esFilaTotal) {
            estilo += 'background-color: #ffffff; font-weight: bold;';
          } else {
            estilo += 'background-color: #e8f0fe;';
          }

          // Alineación de texto
          if (celdaIndex === fila.length - 1 && celda.includes('$')) {
            estilo += ' text-align: right;';
          } else {
            estilo += ' text-align: left;';
          }

          tablaHTML += `<td style="${estilo}">${celda}</td>`;
        });
        tablaHTML += '</tr>';
      });

      tablaHTML += '</table></div>';
      return tablaHTML;
    }

    // Si no es tabla, devolver como está
    return data;
  };

  // --- FUNCIONES DE AUTENTICACIÓN Y ENVÍO ---

  /**
   * Obtiene el token de autenticación desde localStorage
   * @returns {string | null} Token JWT o null si no existe
   */
  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  /**
   * Envía el correo electrónico a través de la API
   * @async
   * @returns {Promise<void>}
   */
  const enviarCorreo = async () => {
    // Validación de destinatarios
    if (!para.trim()) {
      alert("Por favor ingrese al menos un destinatario en el campo 'Para'");
      return;
    }

    if (!validarListaEmails(para)) {
      alert("Por favor ingrese direcciones de correo válidas en el campo 'Para'");
      return;
    }

    if (cc.trim() && !validarListaEmails(cc)) {
      alert("Por favor ingrese direcciones de correo válidas en el campo 'CC'");
      return;
    }

    if (!asunto.trim()) {
      alert("Por favor ingrese un asunto");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("No se encontró token de autenticación. Por favor, inicia sesión nuevamente.");
      return;
    }

    try {
      // Mostrar indicador de carga
      const botonEnviar = document.querySelector('.btn-enviar') as HTMLButtonElement;
      if (botonEnviar) {
        botonEnviar.textContent = '📤 Enviando...';
        botonEnviar.disabled = true;
      }

      // Preparar el mensaje completo con firma si está habilitada
      let mensajeCompleto = mensaje.trim();

      // Agregar firma si está habilitada
      if (incluirFirma) {
        const firmaHTML = `
<div style="margin-top: 15px; font-family: Arial, sans-serif; max-width: 420px; line-height: 0.8;">
  <div style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">${nombrePersonalizado}</div>
  <div style="font-size: 14px; font-weight: bold; color: #06b6d4; margin-bottom: 3px;">Despacho Reparaciones B2B</div>
  <div style="font-size: 13px; font-weight: normal; color: #1e3a8a; margin-bottom: 3px;">Gerencia Soporte a Clientes</div>
  <div style="font-size: 13px; font-weight: normal; color: #1e3a8a; margin-bottom: 8px;">Vicepresidencia de Negocios Empresas y Gobierno</div>
  <div style="width: 72%; height: 1px; background-color: #06b6d4; margin: 8px 0;"></div>
  <div style="font-size:16px; font-weight:bold; color:#002d72; margin-top:-2px">TIGO</div>
</div>`;

        // Si el mensaje contiene HTML, agregar la firma como HTML
        if (mensaje.includes('<') && mensaje.includes('>')) {
          mensajeCompleto += firmaHTML;
        } else {
          // Si es texto plano, convertir saltos de línea y agregar firma en texto plano
          mensajeCompleto = mensajeCompleto.replace(/\n/g, '<br>');
          mensajeCompleto += `<br><br><div style="margin-top: 15px; font-family: Arial, sans-serif; max-width: 420px; line-height: 0.8;">
<div style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">${nombrePersonalizado}</div>
<div style="font-size: 14px; font-weight: bold; color: #06b6d4; margin-bottom: 3px;">Despacho Reparaciones B2B</div>
<div style="font-size: 13px; font-weight: normal; color: #1e3a8a; margin-bottom: 3px;">Gerencia Soporte a Clientes</div>
<div style="font-size: 13px; font-weight: normal; color: #1e3a8a; margin-bottom: 8px;">Vicepresidencia de Negocios Empresas y Gobierno</div>
<div style="width: 72%; height: 1px; background-color: #06b6d4; margin: 8px 0;"></div>
<div style="font-size:16px; font-weight:bold; color:#002d72; margin-top:-2px">TIGO</div></div>`;
        }
      } else {
        // Si no hay firma y el mensaje no contiene HTML, convertir saltos de línea a HTML
        if (!mensajeCompleto.includes('<') || !mensajeCompleto.includes('>')) {
          mensajeCompleto = mensajeCompleto.replace(/\n/g, '<br>');
        }
      }

      // Debug: Mostrar el mensaje que se va a enviar
      console.log('📧 Mensaje completo a enviar:', mensajeCompleto);
      console.log('📧 ¿Contiene HTML?', mensajeCompleto.includes('<') && mensajeCompleto.includes('>'));

      // Preparar FormData para enviar archivos
      const formData = new FormData();
      formData.append('para', para.trim());
      if (cc.trim()) formData.append('cc', cc.trim());
      formData.append('asunto', asunto.trim());
      formData.append('mensaje', mensajeCompleto);

      // Agregar archivos adjuntos
      archivos.forEach((archivoAdjunto, index) => {
        formData.append(`archivo_${index}`, archivoAdjunto.archivo);
      });

      // Agregar información de archivos
      formData.append('archivos_info', JSON.stringify(
        archivos.map(archivo => ({
          nombre: archivo.nombre,
          tipo: archivo.archivo.type,
          tamaño: archivo.archivo.size
        }))
      ));

      // Enviar petición al backend
      const response = await fetch('/api/correos/enviar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incluir Content-Type para FormData
        },
        body: formData
      });

      const resultado = await response.json();

      if (resultado.success) {
        alert(`✅ Correo enviado exitosamente!\n\nID del mensaje: ${resultado.messageId}`);

        // Limpiar formulario después del envío exitoso (opcional)
        // Comentado para evitar bloqueo del textarea
        // setPara('');
        // setCc('');
        // setAsunto('');
        // setMensaje('');
        // setArchivos([]);
      } else {
        alert(`❌ Error al enviar el correo:\n${resultado.message}`);
      }

    } catch (error) {
      console.error('Error enviando correo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error de conexión:\n${errorMessage}`);
    } finally {
      // Restaurar botón
      const botonEnviar = document.querySelector('.btn-enviar') as HTMLButtonElement;
      if (botonEnviar) {
        botonEnviar.textContent = '📤 Enviar Correo';
        botonEnviar.disabled = false;
      }
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="envio-container">
      {/* Header del componente */}
      <div className="envio-header">
        <span className="envio-header-icon">📧</span>
        <div>
          <h2 className="envio-titulo">{titulo}</h2>
          <p className="envio-subtitulo">Gestión de comunicaciones oficiales y apertura de casos</p>
        </div>
        <button className="btn-preferencias">
          ⚙️ Preferencias
        </button>
      </div>

      {/* Contenido principal del formulario */}
      <div className="envio-content">
        <div className="envio-form">
          {/* Campo Para - Destinatarios principales */}
          <div className="envio-input-group">
            <div className="envio-field-header">
              <label className="envio-label">
                <span className="envio-label-icon">👥</span> Para:
              </label>
              <button className="btn-mini" onClick={() => copiarTexto(para)}>
                📋 Copiar
              </button>
            </div>
            <textarea
              className={`envio-textarea ${obtenerClaseValidacion(para)}`}
              value={para}
              onChange={(e) => setPara(e.target.value)}
              placeholder="Escribe las direcciones de los destinatarios..."
            />
          </div>

          {/* Campo CC - Destinatarios en copia */}
          <div className="envio-input-group">
            <div className="envio-field-header">
              <label className="envio-label">
                <span className="envio-label-icon">📨</span> CC:
              </label>
              <button className="btn-mini" onClick={() => copiarTexto(cc)}>
                📋 Copiar
              </button>
            </div>
            <textarea
              className={`envio-textarea ${obtenerClaseValidacion(cc)}`}
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Escribe las direcciones en copia..."
            />
          </div>

          {/* Campo Asunto */}
          <div className="envio-input-group">
            <div className="envio-field-header">
              <label className="envio-label">
                <span className="envio-label-icon">📝</span> Asunto:
              </label>
              <button className="btn-mini" onClick={() => copiarTexto(asunto)}>
                📋 Copiar
              </button>
            </div>
            <input
              className="envio-input"
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Asunto del correo..."
            />
          </div>

          {/* Campo Mensaje con editor de texto enriquecido */}
          <div className="mensaje-container">
            <div className="envio-field-header">
              <label className="envio-label">
                <span className="envio-label-icon">✍️</span> Mensaje:
              </label>
              <button className="btn-mini" onClick={() => copiarTexto(mensaje)}>
                📋 Copiar
              </button>
            </div>
            <div className="editor-wrapper">
              {!mostrarVistaPrevia ? (
                <RichTextEditor
                  content={mensaje}
                  onChange={setMensaje}
                  placeholder="Buen día, se anexa tabla con la apertura de despacho..."
                />
              ) : (
                <div
                  className="vista-previa-html"
                  dangerouslySetInnerHTML={{ __html: mensaje }}
                />
              )}
            </div>
          </div>

          {/* Sección de Firma */}
          <div className="firma-section">
            <div className="firma-controls">
              <label className="firma-checkbox-label">
                <input
                  type="checkbox"
                  checked={incluirFirma}
                  onChange={(e) => setIncluirFirma(e.target.checked)}
                  className="firma-checkbox"
                />
                ✍️ Incluir Firma
              </label>
              {incluirFirma && (
                <div className="nombre-personalizado">
                  <label className="envio-label">Nombre personalizado:</label>
                  <input
                    type="text"
                    value={nombrePersonalizado}
                    onChange={(e) => setNombrePersonalizado(e.target.value)}
                    className="envio-input"
                    placeholder="Ingrese el nombre para la firma..."
                  />
                </div>
              )}
            </div>
            {incluirFirma && (
              <Firma
                nombrePersonalizado={nombrePersonalizado}
                incluirFirma={incluirFirma}
                onToggleFirma={() => setIncluirFirma(!incluirFirma)}
                onNombreChange={setNombrePersonalizado}
              />
            )}
          </div>

          {/* Sección de Archivos Adjuntos */}
          <div className="archivos-section">
            <label className="envio-label">
              <span className="envio-label-icon">📎</span> Archivos Adjuntos:
            </label>
            <input
              type="file"
              id="archivos-input"
              multiple
              onChange={manejarSeleccionArchivos}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <button
              className="btn-mini"
              onClick={() => document.getElementById('archivos-input')?.click()}
            >
              📎 Agregar Archivos
            </button>

            {/* Lista de archivos adjuntos seleccionados */}
            {archivos.length > 0 && (
              <div className="lista-archivos">
                {archivos.map(archivo => (
                  <div key={archivo.id} className="archivo-item">
                    <span className="archivo-nombre">{archivo.nombre}</span>
                    <button
                      className="btn-eliminar-archivo"
                      onClick={() => eliminarArchivo(archivo.id)}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vista Previa del Correo */}
          {mostrarVistaPrevia && (
            <div className="vista-previa">
              <h3 className="vista-previa-titulo">📧 Vista Previa del Correo</h3>
              <div className="vista-previa-contenido">
                <div className="vista-previa-campo">
                  <strong>Para:</strong>
                  <div className={`vista-previa-campo-contenido ${obtenerClaseValidacion(para)}`}>
                    {para || "Sin destinatarios"}
                  </div>
                </div>
                <div className="vista-previa-campo">
                  <strong>CC:</strong>
                  <div className={`vista-previa-campo-contenido ${obtenerClaseValidacion(cc)}`}>
                    {cc || "Sin copias"}
                  </div>
                </div>
                <div className="vista-previa-campo">
                  <strong>Asunto:</strong>
                  <div className="vista-previa-campo-contenido">
                    {asunto || "Sin asunto"}
                  </div>
                </div>
                {archivos.length > 0 && (
                  <div className="vista-previa-campo">
                    <strong>Archivos adjuntos:</strong>
                    <ul className="lista-adjuntos">
                      {archivos.map(archivo => (
                        <li key={archivo.id}>{archivo.nombre}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="vista-previa-campo">
                  <strong>Mensaje:</strong>
                  <div className="vista-previa-mensaje">
                    {mensaje ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: mensaje }}
                        className="mensaje-renderizado"
                      />
                    ) : (
                      "Sin mensaje"
                    )}
                    {incluirFirma && (
                      <Firma
                        nombrePersonalizado={nombrePersonalizado}
                        incluirFirma={incluirFirma}
                        onToggleFirma={() => setIncluirFirma(!incluirFirma)}
                        onNombreChange={setNombrePersonalizado}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción — dentro del formulario, justo después de archivos */}
          <div className="envio-botones">
            <button className="btn btn-copiar" onClick={copiarTodo}>
              📋 Copiar Todo
            </button>
            <button className="btn btn-guardar" onClick={guardarTodo}>
              💾 Guardar
            </button>
            <button className="btn btn-limpiar" onClick={limpiarFormulario}>
              🗑️ Limpiar
            </button>
            <button
              className="btn btn-vista-previa"
              onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
            >
              👁️ Vista Previa
            </button>
            <button className="btn btn-enviar" onClick={enviarCorreo}>
              ▷ ENVIAR CORREO
            </button>
          </div>

        </div>{/* fin envio-form */}
      </div>{/* fin envio-content */}

      {/* Footer de estado del sistema */}
      <div className="envio-footer">
        <span className="envio-footer-copy">
          © 2024 DISPATCH PRO DASHBOARD • PREMIUM MANAGEMENT INTERFACE
        </span>
        <div className="envio-footer-status">
          <span className="envio-footer-online">
            <span className="envio-footer-dot"></span>
            SISTEMA OPERATIVO
          </span>
          <span className="envio-footer-sync">⏱ SYNC: 2 MIN AGO</span>
        </div>
      </div>
    </div>
  );
};

export default EnvioCorreos;