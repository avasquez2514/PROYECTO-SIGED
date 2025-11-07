"use client";

import React, { useCallback, useEffect, useState } from "react";
import "../styles/notasAvances.css";
// Asegúrate de que tu componente Modal esté correctamente importado (por defecto o nombrado)
import Modal from "./Modal"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

/**
 * Interfaz que define la estructura de una nota de avance
 */
interface Nota {
  id: string;
  plantilla_id: string;
  texto: string;
}

/**
 * Props del componente NotasAvances
 */
interface NotasAvancesProps {
  torre: string;
}

/**
 * URL base de la API obtenida desde variables de entorno
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Clave para almacenar el orden de las notas en localStorage
 */
const STORAGE_KEY = "notasAvancesOrden";

// --- COMPONENTES DE ICONOS SVG (Se mantienen sin cambios) ---

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Edit2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const Trash2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);


const NotasAvances: React.FC<NotasAvancesProps> = ({ torre }) => {
  // --- ESTADOS DEL COMPONENTE ---
  const [notasAvance, setNotasAvance] = useState<Nota[]>([]);
  const [ordenNotas, setOrdenNotas] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [textoNota, setTextoNota] = useState("");
  const [modo, setModo] = useState<"agregar" | "modificar">("agregar");
  const [notaActual, setNotaActual] = useState<Nota | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const prefijo = `Gestión-MOC-Torre ${torre}:\n\n`;

  // --- DATOS DE USUARIO Y AUTENTICACIÓN ---
  const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "null") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const usuario_id = usuario?.id;

  // --- FUNCIONES PRINCIPALES ---

  /**
   * Carga las notas de avance desde la API
   */
const cargarNotas = useCallback(async () => {
    // Validamos solo el token, el ID del usuario se obtiene en el backend desde el token.
    if (!token) {
      console.log("❌ Token no encontrado. No se puede llamar a /api/notas/avances");
      return;
    }
        // Si llegamos aquí, el token existe. Lo imprimimos (cuidado de no dejar esto en producción)
    console.log("🔑 Token para cargar notas:", token.substring(0, 10) + '...'); 
    
    setCargando(true);

    try {
      // ✅ CORRECCIÓN CLAVE: Se elimina el usuario_id de la URL.
      // La nueva ruta segura es: /api/notas/avances
      const res = await fetch(`${API_URL}/api/notas/avances`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
          // Si la respuesta no es OK (ej. 401, 500), lanzamos un error legible
          throw new Error(`Error ${res.status}: Fallo al cargar notas`);
      }

      const data = await res.json();

      // Filtrar y mapear las notas válidas (solo aquellas con contenido en nota_avances)
      const filtradas: Nota[] = data
        .filter((n: any) => n.nota_avances?.trim())
        .map((n: any) => ({ 
          id: n.id, 
          plantilla_id: n.plantilla_id,
          texto: n.nota_avances 
        }));

      setNotasAvance(filtradas);

      // Lógica para cargar y persistir el orden...
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const ordenGuardada = JSON.parse(guardado) as string[];
        const nuevasIds = filtradas.map((n) => n.id).filter((id) => !ordenGuardada.includes(id));
        setOrdenNotas([...ordenGuardada, ...nuevasIds]);
      } else {
        setOrdenNotas(filtradas.map((n: Nota) => n.id));
      }

    } catch (error) {
      console.error("Error al cargar notas:", error);
      // Mostrar alerta para mejor diagnóstico
      alert("Error al cargar notas. Revisa la consola del navegador y el log del backend.");
    } finally {
      setCargando(false);
    }
  }, [token]);

  // Efecto para cargar notas al montar el componente
  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  // Efecto para persistir el orden de notas
  useEffect(() => {
    if (ordenNotas.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenNotas));
    }
  }, [ordenNotas]);

  /**
   * Copia una nota al portapapeles con el prefijo de torre
   */
  const copiarNota = (texto: string) => {
    navigator.clipboard.writeText(prefijo + texto)
      .catch((err) => console.error("Error al copiar: ", err));
  };

  /**
   * Elimina una nota con confirmación del usuario
   */
  const eliminarNota = async (id: string) => {
    if (!token) return;
    
    if (!window.confirm("¿Estás seguro de eliminar esta nota?")) return;

    try {
      const response = await fetch(`${API_URL}/api/notas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
      }
      
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
   */
  const abrirModalModificar = (nota: Nota) => {
    setTextoNota(nota.texto);
    setNotaActual(nota);
    setModo("modificar");
    setModalOpen(true);
  };


  /**
   * Guarda una nota nueva o modificada en la API
   */
  const guardarNota = async () => {
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
            // Se mantiene usuario_id aquí para compatibilidad si el controller lo requiere.
            // (Recomendación: el controller debe tomar el ID de req.usuario.id)
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
            // Se envían los campos vacíos si no se usan, para que no interfieran con la actualización
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
      alert("Error al guardar nota.");
    }
  };


  /**
   * Maneja el evento de drag & drop para reordenar notas
   */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const items = Array.from(ordenNotas);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);
    setOrdenNotas(items);
  };

  /**
   * Calcula las notas ordenadas según el estado de ordenNotas
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
            <div className="notas-icon">
              <FileTextIcon />
            </div>
            <div className="notas-title-text">
              <h1>Notas de Avances</h1>
              <p>Gestiona tus notas y comentarios de campo</p>
            </div>
          </div>
          
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

      {/* Modal para editar notas */}
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
      </Modal>
    </div>
  );
};

export default NotasAvances;
