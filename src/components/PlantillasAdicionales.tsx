"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import "../styles/plantillasAdicionales.css";
import Modal from "./Modal";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

/**
 * Interfaz que define la estructura de una plantilla adicional
 */
interface Plantilla {
  id: string;
  relacionId?: string;
  nombre: string;
  texto: string;
}

interface PlantillasAdicionalesProps {
  torre: string;
}

const STORAGE_KEY = "plantillasAdicionalesOrden";

// --- COMPONENTES DE ICONOS SVG ---
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

/**
 * Componente principal para gestionar plantillas de texto adicionales
 */
const PlantillasAdicionales: React.FC<PlantillasAdicionalesProps> = ({ torre }) => {
  // --- ESTADOS DEL COMPONENTE ---
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [ordenPlantillas, setOrdenPlantillas] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState<"agregar" | "editar">("agregar");
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formData, setFormData] = useState<{
    id: string | null;
    relacionId: string | null;
    nombre: string;
    texto: string;
  }>({ id: null, relacionId: null, nombre: "", texto: "" });

  // ✅ CORRECCIÓN: Usar ruta relativa para producción
  const API = `/api/notas`;

  /**
   * Carga las plantillas desde la API (CORREGIDA)
   */
  const cargarPlantillas = async () => {
    const token = localStorage.getItem("token");
    
    // ✅ CORRECCIÓN: Solo validar token, no usuario_id
    if (!token) {
      console.log("❌ Token no encontrado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // ✅ CORRECCIÓN: No enviar usuario_id en la URL, usar token
      const res = await fetch(API, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      // Manejar errores de autenticación
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          window.location.href = "/login";
          return;
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // Validar que la respuesta sea un array
      if (!Array.isArray(data)) {
        console.error("Error: La respuesta de la API no es un array:", data);
        setPlantillas([]);
        setOrdenPlantillas([]);
        return;
      }

      // ✅ CORRECCIÓN: Filtrar plantillas adicionales (solo con campo 'plantilla')
      const filtradas: Plantilla[] = data
        .filter(
          (nota: any) =>
            nota.plantilla?.trim() && // Debe tener contenido en plantilla
            !nota.nota_publica?.trim() && // No debe tener nota pública
            !nota.nota_interna?.trim() && // No debe tener nota interna
            !nota.nota_avances?.trim() // No debe tener nota de avances
        )
        .map((nota: any) => ({
          id: nota.plantilla_id,
          relacionId: nota.id,
          nombre: nota.novedad || "Sin título",
          texto: nota.plantilla,
        }));

      console.log("✅ Plantillas cargadas:", filtradas.length);
      setPlantillas(filtradas);

      // Cargar orden guardado o establecer orden por defecto
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const ordenGuardada = JSON.parse(guardado) as string[];
        const nuevasPlantillas = filtradas
          .map((p) => p.id)
          .filter((id) => !ordenGuardada.includes(id));
        setOrdenPlantillas([...ordenGuardada, ...nuevasPlantillas]);
      } else {
        setOrdenPlantillas(filtradas.map((p: Plantilla) => p.id));
      }
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setPlantillas([]);
      setOrdenPlantillas([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar plantillas al montar el componente
   */
  useEffect(() => {
    cargarPlantillas();
  }, []);

  /**
   * Efecto para persistir el orden de plantillas
   */
  useEffect(() => {
    if (ordenPlantillas.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenPlantillas));
    }
  }, [ordenPlantillas]);

  // --- FUNCIONES DE GESTIÓN DE PLANTILLAS ---

  /**
   * Copia el texto de una plantilla al portapapeles
   */
  const copiarPlantilla = (texto: string) => {
    navigator.clipboard.writeText(texto)
      .catch((err) => console.error("Error al copiar: ", err));
  };

  /**
   * Elimina una plantilla con confirmación (CORREGIDA)
   */
  const eliminarPlantilla = async (plantillaId: string | null) => {
    if (!plantillaId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!window.confirm("¿Estás seguro de eliminar esta plantilla?")) return;

    try {
      // ✅ CORRECCIÓN: Usar la ruta correcta para eliminar plantilla
      const response = await fetch(`${API}/plantilla/${plantillaId}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Plantilla eliminada:", result.mensaje);
      
      await cargarPlantillas();
    } catch (error) {
      console.error("❌ Error al eliminar plantilla:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar plantilla: ${errorMessage}`);
    }
  };

  /**
   * Abre el formulario para agregar una nueva plantilla
   */
  const abrirFormularioAgregar = () => {
    setFormData({ id: null, relacionId: null, nombre: "", texto: "" });
    setMostrarFormulario(true);
  };

  /**
   * Abre el modal para editar una plantilla existente
   */
  const abrirModalEditar = (plantilla: Plantilla) => {
    setModo("editar");
    setFormData({
      id: plantilla.id,
      relacionId: plantilla.relacionId || null,
      nombre: plantilla.nombre,
      texto: plantilla.texto,
    });
    setModalOpen(true);
  };

  /**
   * Maneja los cambios en los campos del formulario
   */
  const manejarCambio = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Agrega una nueva plantilla a través de la API (CORREGIDA)
   */
  const agregarPlantilla = async () => {
    const token = localStorage.getItem("token");
    
    // ✅ CORRECCIÓN: Solo validar token, no usuario_id
    if (!token) {
      alert("No se encontró token de autenticación");
      return;
    }

    if (!formData.nombre.trim() || !formData.texto.trim()) {
      alert("Completa todos los campos");
      return;
    }

    try {
      // ✅ CORRECCIÓN: No enviar usuario_id en el body
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          novedad: formData.nombre,
          plantilla: formData.texto,
          // ✅ NOTA: El backend ahora toma usuario_id del token
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
      }

      setMostrarFormulario(false);
      setFormData({ id: null, relacionId: null, nombre: "", texto: "" });
      await cargarPlantillas();
      alert("✅ Plantilla agregada exitosamente");
    } catch (error) {
      console.error("Error al agregar plantilla:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al agregar plantilla: ${errorMessage}`);
    }
  };

  /**
   * Guarda los cambios de una plantilla editada (CORREGIDA)
   */
  const guardarPlantillaModal = async () => {
    const token = localStorage.getItem("token");

    if (!token || !formData.id) return;
    if (!formData.nombre.trim() || !formData.texto.trim()) return;

    try {
      const response = await fetch(`${API}/plantilla/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          novedad: formData.nombre,
          plantilla: formData.texto,
          // ✅ Mantener compatibilidad con otros campos si es necesario
          nota_publica: "",
          nota_interna: "", 
          nota_avances: ""
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
      }

      setModalOpen(false);
      await cargarPlantillas();
      alert("✅ Plantilla actualizada exitosamente");
    } catch (error) {
      console.error("Error al guardar plantilla:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar plantilla: ${errorMessage}`);
    }
  };

  /**
   * Maneja el evento de drag & drop para reordenar plantillas
   */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(ordenPlantillas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setOrdenPlantillas(items);
  };

  /**
   * Calcula las plantillas ordenadas
   */
  const plantillasOrdenadas = ordenPlantillas
    .map(id => plantillas.find((p: Plantilla) => p.id === id))
    .filter(Boolean) as Plantilla[];

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="plantilla-containerr">
      <div className="plantilla-content">
        {/* Header del componente */}
        <div className="plantilla-header">
          <div className="plantilla-title-section">
            <div className="plantilla-icon">
              <FileTextIcon />
            </div>
            <div className="plantilla-title-text">
              <h1>Plantillas Adicionales</h1>
              <p>Gestiona tus plantillas de texto personalizadas</p>
            </div>
          </div>
          
          <button className="agregar-button" onClick={abrirFormularioAgregar}>
            <PlusIcon />
            Agregar Plantilla
          </button>
        </div>

        {/* Formulario inline para nueva plantilla */}
        {mostrarFormulario && (
          <div className="plantilla-formulario">
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={manejarCambio}
              placeholder="Título de la plantilla..."
            />
            <textarea
              name="texto"
              value={formData.texto}
              onChange={manejarCambio}
              placeholder="Contenido de la plantilla..."
              rows={5}
            />
            <div className="plantilla-formulario-botones">
              <button onClick={agregarPlantilla} className="btn-guardar">
                Guardar Plantilla
              </button>
              <button
                onClick={() => {
                  setMostrarFormulario(false);
                  setFormData({ id: null, relacionId: null, nombre: "", texto: "" });
                }}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Indicador de carga */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
            ⏳ Cargando plantillas...
          </p>
        ) : (
          <>
            {/* Lista de plantillas con drag & drop */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="plantillas-list">
                {(provided) => (
                  <div
                    className="plantilla-list"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {plantillasOrdenadas.map((plantilla, index) => (
                      <Draggable key={plantilla.id} draggableId={plantilla.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            className={`plantilla-item ${snapshot.isDragging ? 'dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className="plantilla-contenido">
                              <h3 className="plantilla-nombre">{plantilla.nombre}</h3>
                              <p className="plantilla-texto">{plantilla.texto}</p>
                            </div>
                            <div className="plantilla-buttons">
                              <button
                                className="plantilla-button copy"
                                onClick={() => copiarPlantilla(plantilla.texto)}
                                title="Copiar"
                              >
                                📋 Copiar
                              </button>
                              <button
                                className="plantilla-button edit"
                                onClick={() => abrirModalEditar(plantilla)}
                                title="Modificar"
                              >
                                ✏️ Modificar
                              </button>
                              <button
                                className="plantilla-button clear"
                                onClick={() => eliminarPlantilla(plantilla.id)}
                                title="Eliminar"
                              >
                                🗑️ Eliminar
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

            {/* Estado vacío cuando no hay plantillas */}
            {plantillasOrdenadas.length === 0 && !loading && (
              <div className="empty-state">
                <FileTextIcon />
                <p>No hay plantillas disponibles</p>
                <p>Haz clic en "Agregar Plantilla" para crear una nueva</p>
              </div>
            )}

            {/* Footer con contador de plantillas */}
            <div className="plantilla-footer">
              <p>
                Total de plantillas: <span>{plantillasOrdenadas.length}</span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal para editar plantillas */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={"Modificar Plantilla"}
        showSaveButton={true}
        onSave={guardarPlantillaModal}
      >
        <label>Título</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={manejarCambio}
        />

        <label>Contenido</label>
        <textarea
          rows={5}
          name="texto"
          value={formData.texto}
          onChange={manejarCambio}
        />

        <div className="modal-buttons">
          <button
            onClick={() => {
              eliminarPlantilla(formData.id);
              setModalOpen(false);
            }}
            className="modal-delete-button"
          >
            <FaTrash style={{ marginRight: "6px" }} />
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PlantillasAdicionales;
