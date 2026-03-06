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

/**
 * Props del componente PlantillaSelector
 */
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
  
  // CAMBIO REALIZADO: Ahora el valor inicial es "publica"
  const [tipoNota, setTipoNota] = useState<"publica" | "interna">("publica");

  const [textoNota, setTextoNota] = useState("");
  const [textoModificado, setTextoModificado] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoModal, setModoModal] = useState<"agregar" | "modificar">("agregar");
  const [formData, setFormData] = useState({
    novedad: "",
    nota_publica: "",
    nota_interna: "",
  });

  const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notas`;

  const cargarPlantillas = async () => {
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

    if (!token || !usuario?.id) return;

    try {
      const res = await fetch(`${API}/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

      if (!Array.isArray(data)) {
        setPlantillas({});
        return;
      }

      const agrupadas: Record<string, Plantilla> = {};
      data.forEach((row: any) => {
        const esPlantillaAdicional = row.plantilla?.trim();
        const esNotaAvances = row.nota_avances?.trim() &&
          !row.nota_publica?.trim() &&
          !row.nota_interna?.trim() &&
          !row.plantilla?.trim();

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

      setPlantillas(agrupadas);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setPlantillas({});
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, []);

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
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoNota);
  };

  const limpiarTexto = () => {
    setTextoNota("");
    setTextoModificado(true);
    onSelect("");
  };

  // --- FUNCIONES DE GESTIÓN ---

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

  const handleSubmitModal = async () => {
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

    if (!token || !usuario?.id) return;

    try {
      let response;

      if (modoModal === "agregar") {
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
            usuario_id: usuario.id,
          }),
        });
      } else {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error ${response.status}`);
      }

      setMostrarModal(false);
      cargarPlantillas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar plantilla: ${errorMessage}`);
    }
  };

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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error ${response.status}`);
      }

      setNotaSeleccionada("");
      setTextoNota("");
      onSelect("");
      cargarPlantillas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar plantilla: ${errorMessage}`);
    }
  };

  return (
    <div className="plantilla-view-wrapper">
      <div className="plantilla-container-premium">
        <div className="plantilla-card-premium">
          <div className="plantilla-header-premium">
            <div className="header-icon-box-p">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="header-text-p">
              <h2 className="title-p">Plantillas de Notas</h2>
              <p className="subtitle-p">Gestión de comunicaciones y notas de despacho</p>
            </div>
          </div>

          <div className="category-section-p">
            <label className="label-p">• SELECCIONAR CATEGORÍA</label>
            <div className="select-wrapper-p">
              <select value={notaSeleccionada} onChange={handleNotaChange} className="select-p">
                <option value="">ELIJA UNA OPCIÓN</option>
                {Object.keys(plantillas).map((key) => (
                  <option key={key} value={key}>
                    {key.toUpperCase()}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined select-icon-p">waves</span>
            </div>
          </div>

          <div className="actions-grid-p">
            <button className="action-btn-p" onClick={abrirModalAgregar}>
              <span className="material-symbols-outlined">add</span>
              AGREGAR
            </button>
            <button className="action-btn-p" onClick={abrirModalModificar}>
              <span className="material-symbols-outlined">edit_note</span>
              MODIFICAR
            </button>
            <button className="action-btn-p" onClick={eliminarPlantilla}>
              <span className="material-symbols-outlined">delete_sweep</span>
              ELIMINAR
            </button>
          </div>

          <div className="textarea-section-p">
            <textarea
              value={textoNota}
              onChange={handleTextoChange}
              className="textarea-p"
              placeholder="Contenido de la plantilla..."
            />
          </div>

          <div className="type-toggle-p">
            <button
              className={`type-toggle-btn ${tipoNota === "publica" ? "active" : ""}`}
              onClick={() => handleTipoNotaChange("publica")}
            >
              <span className="material-symbols-outlined">public</span>
              NOTA PÚBLICA
            </button>

            <button
              className={`type-toggle-btn ${tipoNota === "interna" ? "active" : ""}`}
              onClick={() => handleTipoNotaChange("interna")}
            >
              <span className="material-symbols-outlined">lock</span>
              NOTA INTERNA
            </button>
          </div>

          <div className="utility-grid-p">
            <button className="util-btn-p copy" onClick={copiarTexto}>
              <span className="material-symbols-outlined">content_copy</span>
              COPIAR TEXTO
            </button>
            <button className="util-btn-p clear" onClick={limpiarTexto}>
              <span className="material-symbols-outlined">backspace</span>
              LIMPIAR
            </button>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-white">
                {modoModal === "agregar" ? "NUEVA PLANTILLA" : "EDITAR PLANTILLA"}
              </h2>
              <button className="close-btn material-symbols-outlined" onClick={() => setMostrarModal(false)}>close</button>
            </div>

            <div className="modal-body space-y-4 p-6">
              <div className="field">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre de la Novedad</label>
                <input
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-white outline-none focus:border-primary transition-colors"
                  value={formData.novedad}
                  onChange={(e) => setFormData({ ...formData, novedad: e.target.value })}
                  placeholder="Ej: Caída de Sistema"
                />
              </div>

              <div className="field">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contenido Nota Pública</label>
                <textarea
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-white outline-none focus:border-primary transition-colors"
                  rows={4}
                  value={formData.nota_publica}
                  onChange={(e) => setFormData({ ...formData, nota_publica: e.target.value })}
                  placeholder="Lo que verá el usuario final..."
                />
              </div>

              <div className="field">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contenido Nota Interna</label>
                <textarea
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-white outline-none focus:border-primary transition-colors"
                  rows={4}
                  value={formData.nota_interna}
                  onChange={(e) => setFormData({ ...formData, nota_interna: e.target.value })}
                  placeholder="Información interna para el equipo..."
                />
              </div>
            </div>

            <div className="modal-footer p-6 border-t border-slate-800/50 flex gap-3 justify-end">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-5 py-2 rounded-lg text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitModal}
                className="px-6 py-2 bg-primary rounded-lg text-white text-sm font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
              >
                {modoModal === "agregar" ? "Guardar" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantillaSelector;
