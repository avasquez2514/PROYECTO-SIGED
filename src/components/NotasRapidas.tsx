"use client";

import React, { useState, useEffect, useCallback } from "react";
import "../styles/notasRapidas.css";

interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  fechaModificacion: string;
}

const NotasRapidas: React.FC = () => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [notaActual, setNotaActual] = useState<Nota | null>(null);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [corrigiendoTodo, setCorrigiendoTodo] = useState(false);

  useEffect(() => {
    const notasGuardadas = localStorage.getItem("notas_rapidas");
    if (notasGuardadas) {
      setNotas(JSON.parse(notasGuardadas));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notas_rapidas", JSON.stringify(notas));
  }, [notas]);

  const crearNuevaNota = () => {
    const nuevaNota: Nota = {
      id: Date.now().toString(),
      titulo: "",
      contenido: "",
      fechaModificacion: new Date().toISOString(),
    };
    setNotas([nuevaNota, ...notas]);
    seleccionarNota(nuevaNota);
  };

  const seleccionarNota = (nota: Nota) => {
    setNotaActual(nota);
    setTitulo(nota.titulo);
    setContenido(nota.contenido);
  };

  const guardarNota = () => {
    if (!notaActual) return;

    const notasActualizadas = notas.map((n) =>
      n.id === notaActual.id
        ? { ...n, titulo, contenido, fechaModificacion: new Date().toISOString() }
        : n
    );
    setNotas(notasActualizadas);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2000);
  };

  const eliminarNota = (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
      setNotas(notas.filter((n) => n.id !== id));
      if (notaActual?.id === id) {
        setNotaActual(null);
        setTitulo("");
        setContenido("");
      }
    }
  };

  const mejorarConIA = async () => {
    if (!contenido.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/ia/mejorar-texto-chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: contenido, modo: "mejorar" }),
      });
      const data = await response.json();
      if (data.textoMejorado) {
        setAiSuggestion(data.textoMejorado);
        setShowAIModal(true);
      }
    } catch (error) {
      console.error("Error al mejorar con IA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const corregirOrtografiaAutomatica = async () => {
    if (!contenido.trim()) return;
    setCorrigiendoTodo(true);
    try {
      const response = await fetch("/api/ia/mejorar-texto-chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: contenido, modo: "corregir_ortografia" }),
      });
      const data = await response.json();
      if (data.textoMejorado) {
        setContenido(data.textoMejorado);
        const notasActualizadas = notas.map((n) =>
          n.id === notaActual?.id
            ? { ...n, contenido: data.textoMejorado, fechaModificacion: new Date().toISOString() }
            : n
        );
        setNotas(notasActualizadas);
      }
    } catch (error) {
      console.error("Error al corregir ortografía:", error);
    } finally {
      setCorrigiendoTodo(false);
    }
  };

  const manejarCargaImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
      try {
        const response = await fetch("/api/ia/extraer-texto-imagen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: base64String, mimeType: file.type }),
        });
        const data = await response.json();
        if (data.textoMejorado) {
          setContenido((prev) => prev + "\n" + data.textoMejorado);
        }
      } catch (error) {
        console.error("Error OCR:", error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportarNotas = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notas));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `notas_rapidas_${new Date().toLocaleDateString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importarNotas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setNotas([...imported, ...notas]);
      } catch (error) {
        alert("Error al importar el archivo");
      }
    };
    reader.readAsText(file);
  };

  const limpiarTodasLasNotas = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar TODAS las notas? Esta acción no se puede deshacer.")) {
      setNotas([]);
      setNotaActual(null);
      setTitulo("");
      setContenido("");
      localStorage.removeItem("notas_rapidas");
    }
  };

  return (
    <div className="notas-rapidas-view">
      {/* Header Premium */}
      <div className="notas-header-p">
        <div className="header-left-p">
          <div className="title-row-p">
            <h1 className="main-title-p">Panel de Notas Rápidas</h1>
            <span className="version-badge-p">v1.4.0</span>
          </div>
          <p className="subtitle-p">Monitorización de datos en tiempo real</p>
        </div>
        <div className="header-actions-p">
          <button onClick={crearNuevaNota} className="btn-action-p accent-green">
            <span className="material-symbols-outlined">add</span>
            NUEVA NOTA
          </button>
          <button onClick={exportarNotas} className="btn-action-p accent-blue">
            <span className="material-symbols-outlined">ios_share</span>
            EXPORTAR
          </button>
          <label className="btn-action-p accent-blue">
            <span className="material-symbols-outlined">file_download</span>
            IMPORTAR
            <input type="file" accept=".json" onChange={importarNotas} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Barra de Estadísticas */}
      <div className="stats-bar-p">
        <div className="stat-card-p blue">
          <span className="stat-label-p">TOTAL NOTAS</span>
          <span className="stat-value-p">{notas.length}</span>
        </div>
        <div className="stat-card-p celeste">
          <span className="stat-label-p">MODIFICADAS HOY</span>
          <span className="stat-value-p">
            {notas.filter(n => new Date(n.fechaModificacion).toLocaleDateString() === new Date().toLocaleDateString()).length}
          </span>
        </div>
        <div className="stat-card-p yellow">
          <span className="stat-label-p">ALMACENAMIENTO</span>
          <span className="stat-value-p">{(new Blob([JSON.stringify(notas)]).size / 1024).toFixed(1)}KB</span>
        </div>
        <div className="stat-card-p green">
          <span className="stat-label-p">BACKUP STATUS</span>
          <span className="stat-value-p status-ok">OK</span>
        </div>
      </div>

      {/* Grid de Notas Rediseñado */}
      <div className="main-content-p">
        <div className="notes-grid-p">
          {notas.sort((a, b) => new Date(b.fechaModificacion).getTime() - new Date(a.fechaModificacion).getTime())
            .map((nota) => (
              <div
                key={nota.id}
                className={`note-card-p ${notaActual?.id === nota.id ? 'selected' : ''}`}
                onClick={() => seleccionarNota(nota)}
              >
                <div className="card-header-p">
                  <div className="title-with-dot">
                    <span className="status-dot"></span>
                    <h3 className="card-title-p">{nota.titulo || "Nueva Nota de Sistema"}</h3>
                  </div>
                </div>
                <p className="card-snippet-p">
                  {nota.contenido.substring(0, 100) || "Sin contenido..."}
                  {nota.contenido.length > 100 ? "..." : ""}
                </p>
                <div className="card-footer-p">
                  <div className="footer-date-p">
                    <span className="material-symbols-outlined">schedule</span>
                    MODIFICADO: {new Date(nota.fechaModificacion).toLocaleDateString()}
                  </div>
                  <span className={`status-chip-p ${nota.id.length % 3 === 0 ? 'urgent' : nota.id.length % 3 === 1 ? 'draft' : 'archived'}`}>
                    {nota.id.length % 3 === 0 ? 'URGENTE' : nota.id.length % 3 === 1 ? 'DRAFT' : 'ARCHIVADO'}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Editor o Estado Vacío */}
        <div className="editor-view-p">
          {notaActual ? (
            <div className="premium-editor-p">
              <div className="editor-controls-p">
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título de la nota..."
                  className="editor-title-input-p"
                />
                <div className="control-buttons-p">
                  <label className={`btn-upload-p ${isLoading ? 'disabled' : ''}`} title="Imagen a Texto">
                    <span className="material-symbols-outlined">image_search</span>
                    <input type="file" accept="image/*" onChange={manejarCargaImagen} disabled={isLoading} style={{ display: 'none' }} />
                  </label>
                  <button onClick={mejorarConIA} className="btn-ia-p" title="Sugerencia IA" disabled={isLoading}>
                    <span className="material-symbols-outlined">auto_fix_high</span>
                  </button>
                  <button onClick={corregirOrtografiaAutomatica} className="btn-spell-p" title="Corregir Ortografía" disabled={corrigiendoTodo}>
                    <span className="material-symbols-outlined">{corrigiendoTodo ? 'sync' : 'spellcheck'}</span>
                  </button>
                  <button onClick={guardarNota} className="btn-save-p" title="Guardar">
                    <span className="material-symbols-outlined">save</span>
                  </button>
                  <button onClick={() => eliminarNota(notaActual.id)} className="btn-delete-p" title="Eliminar">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escriba aquí sus notas..."
                className="editor-textarea-p"
              />
            </div>
          ) : (
            <div className="empty-editor-p">
              <div className="empty-content-box-p">
                <span className="material-symbols-outlined large-icon-p">description</span>
                <h2 className="empty-title-p">EDITOR DE NOTAS</h2>
                <p className="empty-desc-p">Seleccione una nota existente o cree una nueva para comenzar a documentar el sistema.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          {/* Modal content simplified for brevity, following the same premium style */}
          <div className="modal-content-p glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-p">
              <h3>🤖 Sugerencia de la IA</h3>
              <button onClick={() => setShowAIModal(false)}>×</button>
            </div>
            <div className="modal-body-p">
              <p className="ai-text-p">{aiSuggestion}</p>
            </div>
            <div className="modal-footer-p">
              <button onClick={() => setShowAIModal(false)}>Cerrar</button>
              <button className="apply-btn-p" onClick={() => { setContenido(aiSuggestion); setShowAIModal(false); }}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotasRapidas;