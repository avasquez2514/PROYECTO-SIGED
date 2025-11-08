"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import "../styles/plantillas.css";

/**
 * Interfaz que define la estructura de una plantilla de notas
 */
interface Plantilla {
  id: string;
  plantilla_id: string;
  notaPublica: string;
  notaInterna: string;
}

interface PlantillaSelectorProps {
  torre: string;
  onSelect: (texto: string) => void;
}

/**
 * Componente selector de plantillas para gestión de notas públicas e internas
 */
const PlantillaSelector: React.FC<PlantillaSelectorProps> = ({ torre, onSelect }) => {
  // --- ESTADOS DEL COMPONENTE ---
  const [plantillas, setPlantillas] = useState<Record<string, Plantilla>>({});
  const [notaSeleccionada, setNotaSeleccionada] = useState("");
  const [tipoNota, setTipoNota] = useState<"publica" | "interna">("interna");
  const [textoNota, setTextoNota] = useState("");
  const [textoModificado, setTextoModificado] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoModal, setModoModal] = useState<"agregar" | "modificar">("agregar");
  const [formData, setFormData] = useState({
    novedad: "",
    nota_publica: "",
    nota_interna: "",
  });

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
      return;
    }

    try {
      // ✅ CORRECCIÓN: No enviar usuario_id en la URL, usar solo token
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
        setPlantillas({});
        return;
      }

      // Filtrar y organizar las plantillas válidas
      const agrupadas: Record<string, Plantilla> = {};
      data.forEach((row: any) => {
        // Excluir plantillas adicionales y notas de avances
        const esPlantillaAdicional = row.plantilla?.trim();
        const esNotaAvances = row.nota_avances?.trim() && 
                             !row.nota_publica?.trim() && 
                             !row.nota_interna?.trim() && 
                             !row.plantilla?.trim();
        
        // Incluir solo notas públicas/internas regulares
        if (!esPlantillaAdicional && !esNotaAvances) {
          const novedad = row.novedad || "Sin título";
          agrupadas[novedad] = {
            id: row.id,
            plantilla_id: row.plantilla_id,
            notaPublica: row.nota_publica || "",
            notaInterna: row.nota_interna || "",
          };
        }
      });

      console.log("✅ Plantillas cargadas:", Object.keys(agrupadas).length);
      setPlantillas(agrupadas);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setPlantillas({});
    }
  };

  /**
   * Efecto para cargar plantillas al montar el componente
   */
  useEffect(() => {
    cargarPlantillas();
  }, []);

  /**
   * Efecto para actualizar el texto de la nota cuando cambia la selección o tipo
   */
  useEffect(() => {
    if (notaSeleccionada && plantillas[notaSeleccionada] && !textoModificado) {
      const encabezado = `Gestión-MOC-Torre ${torre}:`;
      const nota = tipoNota === "publica"
        ? plantillas[notaSeleccionada].notaPublica
        : `${encabezado}\n\n${plantillas[notaSeleccionada].notaInterna}`;
      setTextoNota(nota);
      onSelect(nota);
    }
  }, [notaSeleccionada, tipoNota, plantillas, torre, textoModificado, onSelect]);

  // --- MANEJADORES DE EVENTOS ---

  const handleNotaChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setNotaSeleccionada(e.target.value);
    setTextoModificado(false);
  };

  const handleTipoNotaChange = (tipo: "publica" | "interna") => {
    setTipoNota(tipo);
    setTextoModificado(false);
  };

  const handleTextoChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTextoNota(e.target.value);
    setTextoModificado(true);
    onSelect(e.target.value); // ✅ CORRECCIÓN: Notificar cambios en tiempo real
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoNota);
    alert("Texto copiado al portapapeles");
  };

  const limpiarTexto = () => {
    setTextoNota("");
    setTextoModificado(true);
    onSelect("");
  };

  // --- FUNCIONES DE GESTIÓN DE PLANTILLAS ---

  const abrirModalAgregar = () => {
    setModoModal("agregar");
    setFormData({ novedad: "", nota_publica: "", nota_interna: "" });
    setMostrarModal(true);
  };

  const abrirModalModificar = () => {
    if (!notaSeleccionada) {
      alert("Selecciona una nota primero");
      return;
    }
    const actual = plantillas[notaSeleccionada];
    setModoModal("modificar");
    setFormData({
      novedad: notaSeleccionada,
      nota_publica: actual.notaPublica,
      nota_interna: actual.notaInterna,
    });
    setMostrarModal(true);
  };

  /**
   * Maneja el envío del formulario del modal (CORREGIDO)
   */
  const handleSubmitModal = async () => {
    const token = localStorage.getItem("token");
    
    // ✅ CORRECCIÓN: Solo validar token
    if (!token) {
      alert("No se encontró token de autenticación");
      return;
    }

    try {
      let response;
      
      if (modoModal === "agregar") {
        // ✅ CORRECCIÓN: No enviar usuario_id en el body
        const nombreUnico = `${formData.novedad.trim()} - ${Date.now()}`;
        
        response = await fetch(`${API}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            novedad: nombreUnico,
            nota_publica: formData.nota_publica.trim(),
            nota_interna: formData.nota_interna.trim(),
            // ✅ NOTA: El backend toma usuario_id del token
          }),
        });
      } else {
        // Modo modificar
        const actual = plantillas[notaSeleccionada];
        
        response = await fetch(`${API}/plantilla/${actual.plantilla_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            novedad: formData.novedad.trim(),
            nota_publica: formData.nota_publica.trim(),
            nota_interna: formData.nota_interna.trim(),
            nota_avances: "",
            plantilla: ""
          }),
        });
        setNotaSeleccionada(formData.novedad.trim());
      }

      if (response && !response.ok) {
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

      setMostrarModal(false);
      cargarPlantillas();
      alert(`✅ Plantilla ${modoModal === "agregar" ? "agregada" : "actualizada"} exitosamente`);
    } catch (error) {
      console.error("Error al guardar/editar:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar plantilla: ${errorMessage}`);
    }
  };

  /**
   * Elimina la plantilla seleccionada (CORREGIDA)
   */
  const eliminarPlantilla = async () => {
    if (!notaSeleccionada) {
      alert("Selecciona una nota primero");
      return;
    }
    
    const id = plantillas[notaSeleccionada].id;
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!window.confirm(`¿Eliminar plantilla "${notaSeleccionada}"?`)) return;

    try {
      const response = await fetch(`${API}/${id}`, {
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

      setNotaSeleccionada("");
      setTextoNota("");
      onSelect("");
      cargarPlantillas();
      alert("✅ Plantilla eliminada exitosamente");
    } catch (error) {
      console.error("❌ Error al eliminar plantilla:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar plantilla: ${errorMessage}`);
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="plantilla-container">
      <div className="plantilla-card">
        {/* Header con icono, título y subtítulo */}
        <div className="plantilla-header">
          <span className="plantilla-header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <div className="plantilla-header-text">
            <h2 className="plantilla-title">Selecciona Nota</h2>
            <p className="plantilla-subtitle">Gestiona y personaliza tus notas</p>
          </div>
        </div>

        {/* Label Categoría */}
        <div className="plantilla-categoria-label">
          <span className="categoria-bullet">•</span> Categoría
        </div>

        {/* Dropdown para seleccionar nota */}
        <select value={notaSeleccionada} onChange={handleNotaChange} className="plantilla-select">
          <option value="">-- Selecciona una nota --</option>
          {Object.keys(plantillas).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>

        {/* Botones de Acción Superior (Agregar, Modificar, Eliminar) */}
        <div className="plantilla-buttons-top">
          <button className="plantilla-button agregar" onClick={abrirModalAgregar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar
          </button>
          <button className="plantilla-button modificar" onClick={abrirModalModificar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modificar
          </button>
          <button className="plantilla-button eliminar" onClick={eliminarPlantilla}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Eliminar
          </button>
        </div>

        {/* Textarea para edición de notas - SIEMPRE VISIBLE */}
        <textarea
          rows={6}
          value={textoNota}
          onChange={handleTextoChange}
          className="plantilla-textarea"
          placeholder="Escribe tu nota aquí..."
        />

        {/* Botones para seleccionar tipo de nota */}
        <div className="plantilla-buttons">
          <button
            className={`plantilla-button interna ${tipoNota === "interna" ? "active" : ""}`}
            onClick={() => handleTipoNotaChange("interna")}
          >
            Nota Interna
          </button>
          <button
            className={`plantilla-button publica ${tipoNota === "publica" ? "active" : ""}`}
            onClick={() => handleTipoNotaChange("publica")}
          >
            Nota Pública
          </button>
        </div>

        {/* Botones de utilidad (Copiar y Limpiar) */}
        <div className="plantilla-buttons">
          <button className="plantilla-button copy" onClick={copiarTexto}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copiar
          </button>
          <button className="plantilla-button clear" onClick={limpiarTexto}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
            </svg>
            Limpiar
          </button>
        </div>

        {/* Footer: Indicador del tipo de nota seleccionado */}
        <p className="plantilla-tipo-seleccionado">
          Tipo seleccionado: <span className="plantilla-tipo-valor">{tipoNota === "publica" ? "Nota Pública" : "Nota Interna"}</span>
        </p>
      </div>

      {/* Modal para agregar/modificar plantillas */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modoModal === "agregar" ? "Agregar Plantilla" : "Modificar Plantilla"}</h2>
              <button className="modal-close-btn" onClick={() => setMostrarModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <label>Novedad:</label>
              <input
                value={formData.novedad}
                onChange={(e) => setFormData({ ...formData, novedad: e.target.value })}
                placeholder="Nombre de la plantilla..."
              />

              <label>Nota Pública:</label>
              <textarea
                rows={3}
                value={formData.nota_publica}
                onChange={(e) => setFormData({ ...formData, nota_publica: e.target.value })}
                placeholder="Contenido de la nota pública..."
              />

              <label>Nota Interna:</label>
              <textarea
                rows={3}
                value={formData.nota_interna}
                onChange={(e) => setFormData({ ...formData, nota_interna: e.target.value })}
                placeholder="Contenido de la nota interna..."
              />
            </div>

            <div className="modal-buttons">
              <button onClick={handleSubmitModal} className="modal-save-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {modoModal === "agregar" ? "Guardar" : "Actualizar"}
              </button>

              {modoModal === "modificar" && (
                <button onClick={eliminarPlantilla} className="modal-delete-button">
                  <FaTrash style={{ marginRight: "8px" }} /> Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantillaSelector;
