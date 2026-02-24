"use client";

import React, { useEffect, useState } from "react";
import "../styles/alarma.css";

/**
 * Interfaz que define la estructura de una alarma individual
 * @interface AlarmaItem
 * @property {string} hora - Hora en formato HH:MM para la alarma
 * @property {string} nombre - Nombre descriptivo de la alarma
 * @property {string} [sonido] - URL opcional del sonido personalizado
 */
interface AlarmaItem {
  hora: string;
  nombre: string;
  sonido?: string;
}

/**
 * Interfaz para sonidos personalizados cargados por el usuario
 * @interface SonidoPersonalizado
 * @property {string} nombre - Nombre del archivo de audio
 * @property {string} url - URL del blob o ruta del sonido
 */
interface SonidoPersonalizado {
  nombre: string;
  url: string;
}

/**
 * Componente principal de gestión de alarmas
 * Permite crear, gestionar y visualizar alarmas con sonidos personalizados
 * @component
 * @returns {JSX.Element} Componente de alarma completo con interfaz de usuario
 */
const Alarma: React.FC = () => {
  // Estado para la hora de la nueva alarma
  const [nuevaHora, setNuevaHora] = useState<string>("");

  // Estado para el nombre de la nueva alarma
  const [nombreAlarma, setNombreAlarma] = useState<string>("");

  // Estado para la ruta del sonido predeterminado (constante)
  const [sonidoPredeterminado] = useState<string>("/Sonidos/default.mp3");

  // Estado para el sonido seleccionado actualmente
  const [sonidoSeleccionado, setSonidoSeleccionado] = useState<string>("/Sonidos/default.mp3");

  // Estado para controlar el audio que se está reproduciendo actualmente
  const [audioEnReproduccion, setAudioEnReproduccion] = useState<HTMLAudioElement | null>(null);

  // Estado para la alarma que está sonando en este momento
  const [currentAlarmaActiva, setCurrentAlarmaActiva] = useState<AlarmaItem | null>(null);

  /**
   * Estado para gestionar los sonidos personalizados cargados por el usuario
   * Se inicializa desde localStorage o con array vacío si no hay datos
   */
  const [sonidos, setSonidos] = useState<SonidoPersonalizado[]>(() => {
    try {
      // Intentar recuperar sonidos guardados del localStorage
      const guardados = localStorage.getItem("sonidos");
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      // En caso de error en el parseo, retornar array vacío
      return [];
    }
  });

  /**
   * Estado para gestionar la lista de alarmas programadas
   * Se inicializa desde localStorage o con array vacío si no hay datos
   */
  const [alarmas, setAlarmas] = useState<AlarmaItem[]>(() => {
    try {
      // Intentar recuperar alarmas guardadas del localStorage
      const guardadas = localStorage.getItem("alarmas");
      return guardadas ? JSON.parse(guardadas) : [];
    } catch (e) {
      // Log error y retornar array vacío
      console.error("❌ Error leyendo alarmas:", e);
      return [];
    }
  });

  // Estado para trackear qué alarmas ya fueron activadas (evita repeticiones)
  const [activadas, setActivadas] = useState<number[]>([]);

  /**
   * Efecto para persistir las alarmas en localStorage cuando cambian
   * Se ejecuta cada vez que el array de alarmas se modifica
   */
  useEffect(() => {
    localStorage.setItem("alarmas", JSON.stringify(alarmas));
  }, [alarmas]);

  /**
   * Función para detener la alarma que se está reproduciendo actualmente
   */
  const detenerAlarma = () => {
    if (audioEnReproduccion) {
      audioEnReproduccion.pause();
      audioEnReproduccion.currentTime = 0;
      setAudioEnReproduccion(null);
    }
    setCurrentAlarmaActiva(null);
  };

  /**
   * Activa una alarma programada
   * @param {AlarmaItem} alarma - Objeto alarma que se está activando
   */
  const activarAlarma = (alarma: AlarmaItem) => {
    setCurrentAlarmaActiva(alarma);

    // Determinar qué sonido usar (personalizado o predeterminado)
    const sonidoURL =
      alarma.sonido?.startsWith("blob:") || alarma.sonido?.startsWith("/Sonidos/")
        ? alarma.sonido
        : sonidoPredeterminado;

    // Crear y reproducir el audio de la alarma
    const audio = new Audio(sonidoURL);
    audio.loop = true;
    audio.play().catch((e) => console.error("Error reproduciendo sonido:", e));
    setAudioEnReproduccion(audio);
  };

  /**
   * Efecto principal que verifica cada segundo si alguna alarma debe activarse
   * Compara la hora actual con las horas programadas en las alarmas
   */
  useEffect(() => {
    const intervalo = setInterval(() => {
      const ahora = new Date();
      const horaActual = ahora.toTimeString().slice(0, 5);

      alarmas.forEach((alarma, index) => {
        if (alarma.hora === horaActual && !activadas.includes(index)) {
          activarAlarma(alarma);
          setActivadas((prev) => [...prev, index]);
        }
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [alarmas, activadas]);

  /**
   * Maneja la carga de archivos de audio personalizados
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del input file
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!["audio/mpeg", "audio/wav", "audio/ogg"].includes(file.type)) {
      alert("Por favor, sube un archivo MP3, WAV o OGG.");
      return;
    }

    // Crear URL temporal para el archivo
    const url = URL.createObjectURL(file);
    const nuevoSonido: SonidoPersonalizado = {
      nombre: file.name,
      url,
    };

    // Actualizar estado y localStorage
    const actualizados = [...sonidos, nuevoSonido];
    setSonidos(actualizados);
    localStorage.setItem("sonidos", JSON.stringify(actualizados));

    // Seleccionar automáticamente el nuevo sonido
    setSonidoSeleccionado(url);
  };

  /**
   * Agrega una nueva alarma a la lista
   * Valida los datos y resetea el formulario después de agregar
   */
  const agregarAlarma = () => {
    // Validar que se haya seleccionado una hora
    if (!nuevaHora) {
      alert("Por favor, selecciona una hora.");
      return;
    }

    const sonidoURL = sonidoSeleccionado;

    // Crear objeto de nueva alarma
    const nueva: AlarmaItem = {
      hora: nuevaHora,
      nombre: nombreAlarma.trim() || "Alarma sin nombre",
      sonido: sonidoURL,
    };

    // Agregar al estado y limpiar formulario
    setAlarmas((prev) => [...prev, nueva]);
    setNuevaHora("");
    setNombreAlarma("");
    setSonidoSeleccionado("/Sonidos/default.mp3");
  };

  /**
   * Elimina una alarma de la lista después de confirmación
   * @param {number} index - Índice de la alarma a eliminar
   */
  const eliminarAlarma = (index: number) => {
    if (confirm("¿Estás seguro de eliminar esta alarma?")) {
      setAlarmas((prev) => prev.filter((_, i) => i !== index));
      setActivadas((prev) => prev.filter((i) => i !== index));
    }
  };

  /**
   * Elimina un sonido personalizado de la lista
   * @param {number} index - Índice del sonido a eliminar
   */
  const eliminarSonidoPersonalizado = (index: number) => {
    const actualizados = sonidos.filter((_, i) => i !== index);
    setSonidos(actualizados);
    localStorage.setItem("sonidos", JSON.stringify(actualizados));

    // Si el sonido eliminado estaba seleccionado, volver al predeterminado
    if (sonidoSeleccionado === sonidos[index].url) {
      setSonidoSeleccionado("/Sonidos/default.mp3");
    }
  };

  return (
    <div className="alarm-wrapper">
      <div className="alarm-wrapper-inner">
        {/* Tarjeta principal del formulario */}
        <div className="alarm-card">

          {/* Encabezado con icono y texto descriptivo */}
          <div className="alarm-header">
            <span className="alarm-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <div className="alarm-header-text">
              <h1>GESTIÓN DE ALARMAS</h1>
              <p>CREA Y ADMINISTRA TUS ALARMAS PERSONALIZADAS</p>
            </div>
          </div>

          {/* Formulario de creación de alarmas */}
          <div className="alarm-form">

            {/* Sección: Hora y Nombre de la alarma */}
            <div className="form-section">
              <label className="section-label" htmlFor="alarm-time">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span>
                HORA DE LA ALARMA Y NOMBRE
              </label>
              <div className="input-vertical-group">
                <input
                  id="alarm-time"
                  type="time"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Ej: Reunión importante"
                  value={nombreAlarma}
                  onChange={(e) => setNombreAlarma(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Sección: Selección de sonido */}
            <div className="form-section">
              <label className="section-label" htmlFor="sound-select">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>volume_up</span>
                SONIDO DE ALARMA
              </label>
              {/* Dropdown para seleccionar sonido */}
              <select
                id="sound-select"
                value={sonidoSeleccionado}
                onChange={(e) => setSonidoSeleccionado(e.target.value)}
                className="sound-select"
              >
                <option value="/Sonidos/default.mp3">Sonido predeterminado</option>
                {/* Mapear sonidos personalizados como opciones */}
                {sonidos.map((s, index) => (
                  <option key={index} value={s.url}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección: Carga de archivos de audio personalizados */}
            <div className="form-section">
              <label className="section-label">AGREGAR SONIDO PERSONALIZADO:</label>
              <div className="drop-zone">
                {/* Input file oculto para carga de archivos */}
                <input
                  type="file"
                  id="file-upload"
                  className="file-input-hidden"
                  accept="audio/mpeg, audio/wav, audio/ogg"
                  onChange={handleFileChange}
                />
                {/* Área visual para drag & drop o click */}
                <label htmlFor="file-upload" className="drop-zone-label">
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Seleccionar archivo <span style={{ opacity: 0.6 }}>Sin archivos seleccionados</span>
                  </div>
                  <span className="material-symbols-outlined upload-icon" style={{ fontSize: '2.5rem', color: '#3b82f6', margin: '0.5rem 0' }}>cloud_upload</span>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', margin: '0.25rem 0' }}>
                    Click para subir o arrastra el archivo de audio
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>MP3, WAV, OGG</span>
                </label>
              </div>
            </div>

            {/* Lista de sonidos personalizados cargados */}
            {sonidos.length > 0 && (
              <div className="sounds-list-section">
                <h4 className="sounds-list-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>library_music</span>
                  Sonidos personalizados
                </h4>
                <ul className="sonidos-lista">
                  {sonidos.map((s, index) => (
                    <li key={index} className="sonido-item">
                      <span>{s.nombre}</span>
                      {/* Botón para eliminar sonido personalizado */}
                      <button onClick={() => eliminarSonidoPersonalizado(index)} className="btn-icon-only">
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botón principal para agregar nueva alarma */}
            <button onClick={agregarAlarma} className="add-alarm-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
              AGREGAR ALARMA
            </button>
          </div>
        </div>

        {/* Estado vacío o lista de alarmas existentes */}
        {alarmas.length === 0 ? (
          // Estado cuando no hay alarmas programadas
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h3>No hay alarmas programadas</h3>
            <p>Crea tu primera alarma usando el formulario de arriba</p>
          </div>
        ) : (
          // Lista de alarmas programadas
          <div className="alarm-list-container">
            <h2 className="list-title">
              <span className="material-symbols-outlined">notifications_active</span>
              ALARMAS PROGRAMADAS
            </h2>
            <ul className="alarma-lista">
              {alarmas.map((alarma, index) => (
                <li key={index} className="alarma-item">
                  <div className="alarma-item-content">
                    {/* Icono de alarma */}
                    <div className="alarma-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    {/* Información de la alarma */}
                    <div className="alarma-item-info">
                      <p className="alarma-hora">{alarma.hora}</p>
                      <p className="alarma-nombre">{alarma.nombre}</p>
                    </div>
                  </div>
                  {/* Botón para eliminar alarma individual */}
                  <button
                    onClick={() => eliminarAlarma(index)}
                    className="alarma-eliminar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Overlay de Alarma Activa */}
      {currentAlarmaActiva && (
        <div className="alarma-overlay" onClick={detenerAlarma}>
          <div className="overlay-content">
            <div className="overlay-icon">
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
            <h2 className="overlay-title">{currentAlarmaActiva.nombre}</h2>
            <p className="overlay-time">{currentAlarmaActiva.hora}</p>
            <p className="overlay-instruction">CLICK EN CUALQUIER LUGAR PARA DETENER</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alarma;