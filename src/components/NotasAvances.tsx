"use client";

import React, { useCallback, useEffect, useState } from "react";
import "../styles/notasAvances.css";
import Modal from "./Modal";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

/**
 * Interfaz que define la estructura de una nota de avance
 * @interface Nota
 * @property {string} id - Identificador único de la nota
 * @property {string} plantilla_id - ID de la plantilla asociada
 * @property {string} texto - Contenido textual de la nota
 */
interface Nota {
  id: string;
  plantilla_id: string;
  texto: string;
}

/**
 * Props del componente NotasAvances
 * @interface NotasAvancesProps
 * @property {string} torre - Identificador de la torre para el prefijo de las notas
 */
interface NotasAvancesProps {
  torre: string;
}

/**
 * URL base de la API obtenida desde variables de entorno
 * @constant {string}
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Clave para almacenar el orden de las notas en localStorage
 * @constant {string}
 */
const STORAGE_KEY = "notasAvancesOrden";

// --- COMPONENTES DE ICONOS SVG ---

/**
 * Icono de documento de texto
 * @component
 * @returns {JSX.Element} Icono SVG de documento
 */
const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

/**
 * Icono de suma/agregar
 * @component
 * @returns {JSX.Element} Icono SVG de suma
 */
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

/**
 * Icono de edición
 * @component
 * @returns {JSX.Element} Icono SVG de edición
 */
const Edit2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

/**
 * Icono de copiar
 * @component
 * @returns {JSX.Element} Icono SVG de copiar
 */
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

/**
 * Icono de eliminar
 * @component
 * @returns {JSX.Element} Icono SVG de eliminar
 */
const Trash2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

/**
 * Componente principal para gestionar notas de avances
 * Permite crear, editar, eliminar, copiar y reordenar notas mediante drag & drop
 * @component
 * @param {NotasAvancesProps} props - Props del componente
 * @returns {JSX.Element} Interfaz completa de gestión de notas
 */
const NotasAvances: React.FC<NotasAvancesProps> = ({ torre }) => {
  // --- ESTADOS DEL COMPONENTE ---
  
  /**
   * Estado que almacena la lista de notas de avance
   * @state {Nota[]}
   */
  const [notasAvance, setNotasAvance] = useState<Nota[]>([]);
  
  /**
   * Estado que almacena el orden de las notas para persistencia
   * @state {string[]}
   */
  const [ordenNotas, setOrdenNotas] = useState<string[]>([]);
  
  /**
   * Estado que controla la visibilidad del modal de edición
   * @state {boolean}
   */
  const [modalOpen, setModalOpen] = useState(false);
  
  /**
   * Estado para el texto de la nota en edición/creación
   * @state {string}
   */
  const [textoNota, setTextoNota] = useState("");
  
  /**
   * Estado que indica el modo de operación (agregar o modificar)
   * @state {"agregar" | "modificar"}
   */
  const [modo, setModo] = useState<"agregar" | "modificar">("agregar");
  
  /**
   * Estado que almacena la nota actualmente en edición
   * @state {Nota | null}
   */
  const [notaActual, setNotaActual] = useState<Nota | null>(null);
  
  /**
   * Estado que indica si se está cargando datos
   * @state {boolean}
   */
  const [cargando, setCargando] = useState(false);
  
  /**
   * Estado que controla la visibilidad del formulario de nueva nota
   * @state {boolean}
   */
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  /**
   * Prefijo que se agrega al copiar notas (incluye número de torre)
   * @constant {string}
   */
  const prefijo = `Gestión-MOC-Torre ${torre}:\n\n`;

  // --- DATOS DE USUARIO Y AUTENTICACIÓN ---
  
  /**
   * Obtiene los datos del usuario desde localStorage
   * Solo se ejecuta en el cliente (evita errores de SSR)
   */
  const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "null") : null;
  
  /**
   * Obtiene el token JWT desde localStorage
   */
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  /**
   * ID del usuario actual
   */
  const usuario_id = usuario?.id;

  // --- FUNCIONES PRINCIPALES ---

  /**
   * Carga las notas de avance desde la API
   * @async
   * @function
   * @returns {Promise<void>}
   */
  const cargarNotas = useCallback(async () => {
    // Validar que exista autenticación
    if (!usuario_id || !token) return;

    setCargando(true);

    try {
      // Realizar petición GET a la API
      const res = await fetch(`${API_URL}/api/notas/avances/${usuario_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      // Filtrar y mapear las notas válidas
      const filtradas: Nota[] = data
        .filter((n: any) => n.nota_avances?.trim())
        .map((n: any) => ({ 
          id: n.id, 
          plantilla_id: n.plantilla_id,
          texto: n.nota_avances 
        }));

      setNotasAvance(filtradas);

      // Cargar orden guardado o establecer orden por defecto
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const ordenGuardada = JSON.parse(guardado) as string[];
        // Agregar nuevas notas al final del orden existente
        const nuevasIds = filtradas.map((n) => n.id).filter((id) => !ordenGuardada.includes(id));
        setOrdenNotas([...ordenGuardada, ...nuevasIds]);
      } else {
        // Establecer orden inicial basado en la respuesta de la API
        setOrdenNotas(filtradas.map((n: Nota) => n.id));
      }

    } catch (error) {
      console.error("Error al cargar notas:", error);
    } finally {
      setCargando(false);
    }
  }, [usuario_id, token]);

  /**
   * Efecto para cargar notas al montar el componente
   * Se ejecuta cuando cambia la función cargarNotas
   */
  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  /**
   * Efecto para persistir el orden de notas en localStorage
   * Se ejecuta cuando cambia el orden de notas
   */
  useEffect(() => {
    if (ordenNotas.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenNotas));
    }
  }, [ordenNotas]);

  /**
   * Copia una nota al portapapeles con el prefijo de torre
   * @param {string} texto - Texto de la nota a copiar
   */
  const copiarNota = (texto: string) => {
    navigator.clipboard.writeText(prefijo + texto)
      .catch((err) => console.error("Error al copiar: ", err));
  };

  /**
   * Elimina una nota con confirmación del usuario
   * @async
   * @param {string} id - ID de la nota a eliminar
   * @returns {Promise<void>}
   */
  const eliminarNota = async (id: string) => {
    if (!token) return;
    
    // Confirmación de eliminación
    if (!window.confirm("¿Estás seguro de eliminar esta nota?")) return;

    try {
      const response = await fetch(`${API_URL}/api/notas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Nota eliminada:", result.mensaje);
      
      // Recargar la lista de notas
      cargarNotas();
    } catch (error) {
      console.error("❌ Error al eliminar nota:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar nota: ${errorMessage}`);
    }
  };

  /**
   * Abre el formulario para agregar una nueva nota
   */
  const abrirModalAgregar = () => {
    setTextoNota("");
    setModo("agregar");
    setMostrarFormulario(true);
  };

  /**
   * Abre el modal para modificar una nota existente
   * @param {Nota} nota - Nota a modificar
   */
  const abrirModalModificar = (nota: Nota) => {
    setTextoNota(nota.texto);
    setNotaActual(nota);
    setModo("modificar");
    setModalOpen(true);
  };

  /**
   * Guarda una nota nueva o modificada en la API
   * @async
   * @returns {Promise<void>}
   */
  const guardarNota = async () => {
    // Validar que haya texto y autenticación
    if (!textoNota.trim() || !token) return;

    try {
      if (modo === "agregar") {
        // Crear nueva nota
        await fetch(`${API_URL}/api/notas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            novedad: `Nota de Avance - ${new Date().toLocaleDateString()} - ${Date.now()}`,
            nota_avances: textoNota.trim(),
            usuario_id,
          }),
        });
        setMostrarFormulario(false);
      } else if (modo === "modificar" && notaActual) {
        // Actualizar nota existente
        await fetch(`${API_URL}/api/notas/plantilla/${notaActual.plantilla_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            novedad: `Nota de Avance - ${new Date().toLocaleDateString()} - ${Date.now()}`,
            nota_publica: "",
            nota_interna: "",
            nota_avances: textoNota.trim(),
            plantilla: ""
          }),
        });
        setModalOpen(false);
      }

      // Limpiar estado y recargar notas
      setTextoNota("");
      cargarNotas();
    } catch (error) {
      console.error("Error al guardar nota:", error);
    }
  };

  /**
   * Maneja el evento de drag & drop para reordenar notas
   * @param {DropResult} result - Resultado del drag & drop
   */
  const onDragEnd = (result: DropResult) => {
    // Validar que haya un destino válido
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    // No hacer nada si la posición no cambió
    if (sourceIndex === destinationIndex) return;
    
    // Reordenar el array
    const items = Array.from(ordenNotas);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);
    setOrdenNotas(items);
  };

  /**
   * Calcula las notas ordenadas según el estado de ordenNotas
   * @type {Nota[]}
   */
  const notasOrdenadas = ordenNotas
    .map(id => notasAvance.find((n: Nota) => n.id === id))
    .filter(Boolean) as Nota[];

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="notas-avances-container">
      <div className="notas-content">
        {/* Header del componente */}
        <div className="notas-header">
          <div className="notas-title-section">
            {/* Icono principal */}
            <div className="notas-icon">
              <FileTextIcon />
            </div>
            {/* Título y descripción */}
            <div className="notas-title-text">
              <h1>Notas de Avances</h1>
              <p>Gestiona tus notas y comentarios de campo</p>
            </div>
          </div>
          
          {/* Botón para agregar nueva nota */}
          <button className="agregar-button" onClick={abrirModalAgregar}>
            <PlusIcon />
            Agregar Nota
          </button>
        </div>

        {/* Formulario inline para nueva nota */}
        {mostrarFormulario && (
          <div className="nota-formulario">
            <textarea
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              rows={4}
            />
            <div className="nota-formulario-botones">
              <button onClick={guardarNota} className="btn-guardar">
                Guardar Nota
              </button>
              <button
                onClick={() => {
                  setMostrarFormulario(false);
                  setTextoNota('');
                }}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Indicador de carga */}
        {cargando && <p className="loading-text">⏳ Cargando notas...</p>}

        {/* Lista de notas con drag & drop */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="notas-list">
            {(provided) => (
              <div
                className="notas-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {notasOrdenadas.map((nota, index) => (
                  <Draggable key={nota.id} draggableId={nota.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        className={`nota-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {/* Texto de la nota */}
                        <p className="nota-texto">{nota.texto}</p>
                        
                        {/* Botones de acción para cada nota */}
                        <div className="nota-botones">
                          {/* Botón copiar */}
                          <button onClick={() => copiarNota(nota.texto)} className="copy" title="Copiar">
                            <CopyIcon />
                            <span>Copiar</span>
                          </button>

                          {/* Botón editar */}
                          <button onClick={() => abrirModalModificar(nota)} className="edit" title="Editar">
                            <Edit2Icon />
                            <span>Editar</span>
                          </button>                                              
                          
                          {/* Botón eliminar */}
                          <button onClick={() => eliminarNota(nota.id)} className="delete" title="Eliminar">
                            <Trash2Icon />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Estado vacío cuando no hay notas */}
        {!cargando && notasOrdenadas.length === 0 && (
          <div className="empty-state">
            <FileTextIcon />
            <p>No hay notas disponibles</p>
            <p>Haz clic en "Agregar Nota" para crear una nueva</p>
          </div>
        )}

        {/* Footer con contador de notas */}
        <div className="notas-footer">
          <p>
            Total de notas: <span>{notasOrdenadas.length}</span>
          </p>
        </div>
      </div>

      {/* Modal para editar notas (A partir de aquí, el código está corregido) */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={modo === "agregar" ? "Agregar Nota" : "Modificar Nota"}
        showSaveButton={true}
        onSave={guardarNota}
      >
        <textarea
          rows={4}
          value={textoNota}
          onChange={(e) => setTextoNota(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        {/* El botón de guardar se eliminó aquí y se maneja con la prop onSave del Modal */}
      </Modal>
    </div>
  );
};

export default NotasAvances;
