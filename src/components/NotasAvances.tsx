"use client";

import React, { useCallback, useEffect, useState } from "react";
import "../styles/notasAvances.css";
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

interface NotasAvancesProps {
  torre: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STORAGE_KEY = "notasAvancesOrden";

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
  const [notasAvance, setNotasAvance] = useState<Nota[]>([]);
  const [ordenNotas, setOrdenNotas] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [textoNota, setTextoNota] = useState("");
  const [modo, setModo] = useState<"agregar" | "modificar">("agregar");
  const [notaActual, setNotaActual] = useState<Nota | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const prefijo = `Gestión-MOC-Torre ${torre}:\n\n`;
  const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "null") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const usuario_id = usuario?.id;

  const cargarNotas = useCallback(async () => {
    if (!usuario_id || !token) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/notas/avances/${usuario_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const filtradas: Nota[] = data
        .filter((n: any) => n.nota_avances?.trim())
        .map((n: any) => ({
          id: n.id,
          plantilla_id: n.plantilla_id,
          texto: n.nota_avances
        }));
      setNotasAvance(filtradas);
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
    } finally {
      setCargando(false);
    }
  }, [usuario_id, token]);

  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  useEffect(() => {
    if (ordenNotas.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenNotas));
    }
  }, [ordenNotas]);

  const copiarNota = (texto: string) => {
    navigator.clipboard.writeText(prefijo + texto)
      .catch((err) => console.error("Error al copiar: ", err));
  };

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
      alert(`Error al eliminar nota: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const abrirModalAgregar = () => {
    setTextoNota("");
    setModo("agregar");
    setMostrarFormulario(true);
  };

  const abrirModalModificar = (nota: Nota) => {
    setTextoNota(nota.texto);
    setNotaActual(nota);
    setModo("modificar");
    setModalOpen(true);
  };

  const guardarNota = async () => {
    if (!textoNota.trim() || !token) return;
    try {
      if (modo === "agregar") {
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
        await fetch(`${API_URL}/api/notas/plantilla/${notaActual.plantilla_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            novedad: `Nota de Avance - ${new Date().toLocaleDateString()} - ${Date.now()}`,
            nota_avances: textoNota.trim(),
          }),
        });
        setModalOpen(false);
      }
      setTextoNota("");
      cargarNotas();
    } catch (error) {
      console.error("Error al guardar nota:", error);
    }
  };

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

  const notasOrdenadas = ordenNotas
    .map(id => notasAvance.find((n: Nota) => n.id === id))
    .filter(Boolean) as Nota[];

  return (
    <div className="notas-avances-view">
      <div className="notas-avances-container-p">
        {/* Header Principal */}
        <div className="notas-header-p">
          <div className="header-info-p">
            <div className="header-icon-box-p">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="header-text-p">
              <h1 className="title-p">Notas de Avances</h1>
              <p className="subtitle-p">Gestiona tus notas y comentarios de campo</p>
            </div>
          </div>
          <button className="add-btn-p" onClick={abrirModalAgregar}>
            <span className="material-symbols-outlined">add</span>
            Agregar Nota
          </button>
        </div>

        {/* Formulario Inline (Si se prefiere) */}
        {mostrarFormulario && (
          <div className="nota-form-p">
            <textarea
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Escribe el contenido de la nota aquí..."
              className="form-textarea-p"
            />
            <div className="form-actions-p">
              <button onClick={guardarNota} className="btn-save-p">GUARDAR</button>
              <button onClick={() => setMostrarFormulario(false)} className="btn-cancel-p">CANCELAR</button>
            </div>
          </div>
        )}

        {/* Estado de Carga */}
        {cargando && (
          <div className="loading-state-p">
            <div className="spinner-p"></div>
            <span>Cargando notas...</span>
          </div>
        )}

        {/* Grid de Notas */}
        {!cargando && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="notas-grid-p">
              {(provided) => (
                <div
                  className="notas-grid-p"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {notasOrdenadas.map((nota, index) => (
                    <Draggable key={nota.id} draggableId={nota.id} index={index}>
                      {(provided) => (
                        <div
                          className="nota-card-p"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="card-top-p">
                            {/* Opcional: Etiqueta si existe */}
                            {nota.texto.toLowerCase().includes("reporte técnico") && (
                              <span className="card-tag-p">REPORTE TÉCNICO</span>
                            )}
                          </div>

                          <p className="card-content-p">{nota.texto}</p>

                          <div className="card-actions-p">
                            <button onClick={() => copiarNota(nota.texto)} className="btn-copy-p" title="Copiar">
                              <span className="material-symbols-outlined">content_paste</span>
                              <span>Copiar</span>
                            </button>
                            <button onClick={() => abrirModalModificar(nota)} className="btn-edit-p" title="Editar">
                              <span className="material-symbols-outlined">edit</span>
                              <span>Editar</span>
                            </button>
                            <button onClick={() => eliminarNota(nota.id)} className="btn-delete-p" title="Eliminar">
                              <span className="material-symbols-outlined">delete</span>
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
        )}

        {/* Footer con Contador Pill */}
        {!cargando && notasAvance.length > 0 && (
          <div className="notas-footer-p">
            <div className="pill-counter-p">
              Total de notas: <span className="count-p">{notasOrdenadas.length}</span>
            </div>
          </div>
        )}

        {/* Estado Vacío */}
        {!cargando && notasAvance.length === 0 && (
          <div className="empty-state-p">
            <span className="material-symbols-outlined">inventory_2</span>
            <p>No se encontraron notas registradas</p>
          </div>
        )}
      </div>

      {/* Marca de Agua/Decoración */}
      <div className="bg-decoration-p">
        <span className="material-symbols-outlined">hub</span>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={guardarNota} showSaveButton={true} title={modo === "agregar" ? "Agregar Nota" : "Modificar Nota"}>
        <h2>{modo === "agregar" ? "Agregar Nota" : "Modificar Nota"}</h2>
        <textarea rows={4} value={textoNota} onChange={(e) => setTextoNota(e.target.value)} style={{ width: "100%", marginBottom: "10px" }} />
      </Modal>
    </div>
  );
};

export default NotasAvances;