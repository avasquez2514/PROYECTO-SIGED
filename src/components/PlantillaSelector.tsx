"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import "../styles/plantillas.css";

/**
 * Interfaz que define la estructura de una plantilla de notas
 * @interface Plantilla
 * @property {string} id - Identificador único de la nota
 * @property {string} plantilla_id - ID de la plantilla asociada
 * @property {string} notaPublica - Contenido de la nota pública
 * @property {string} notaInterna - Contenido de la nota interna
 */
interface Plantilla {
  id: string;
  plantilla_id: string;
  notaPublica: string;
  notaInterna: string;
}

/**
 * Props del componente PlantillaSelector
 * @interface PlantillaSelectorProps
 * @property {string} torre - Identificador de la torre para el encabezado de notas internas
 * @property {(texto: string) => void} onSelect - Función callback que se ejecuta al seleccionar o modificar texto
 */
interface PlantillaSelectorProps {
  torre: string;
  onSelect: (texto: string) => void;
}

/**
 * Componente selector de plantillas para gestión de notas públicas e internas
 * Permite seleccionar, crear, modificar, eliminar y copiar plantillas de texto
 * @component
 * @param {PlantillaSelectorProps} props - Props del componente
 * @returns {JSX.Element} Interfaz completa de selección y gestión de plantillas
 */
const PlantillaSelector: React.FC<PlantillaSelectorProps> = ({ torre, onSelect }) => {
  // --- ESTADOS DEL COMPONENTE ---

  /**
   * Estado que almacena las plantillas organizadas por nombre de novedad
   * @state {Record<string, Plantilla>}
   */
  const [plantillas, setPlantillas] = useState<Record<string, Plantilla>>({});

  /**
   * Estado para la novedad actualmente seleccionada
   * @state {string}
   */
  const [notaSeleccionada, setNotaSeleccionada] = useState("");

  /**
   * Estado que controla el tipo de nota a mostrar (pública o interna)
   * @state {"publica" | "interna"}
   */
  const [tipoNota, setTipoNota] = useState<"publica" | "interna">("interna");

  /**
   * Estado para el texto de la nota actual
   * @state {string}
   */
  const [textoNota, setTextoNota] = useState("");

  /**
   * Estado que indica si el texto ha sido modificado manualmente
   * @state {boolean}
   */
  const [textoModificado, setTextoModificado] = useState(false);

  /**
   * Estado que controla la visibilidad del modal de gestión
   * @state {boolean}
   */
  const [mostrarModal, setMostrarModal] = useState(false);

  /**
   * Estado que indica el modo de operación del modal
   * @state {"agregar" | "modificar"}
   */
  const [modoModal, setModoModal] = useState<"agregar" | "modificar">("agregar");

  /**
   * Estado para los datos del formulario del modal
   * @state {object}
   */
  const [formData, setFormData] = useState({
    novedad: "",
    nota_publica: "",
    nota_interna: "",
  });

  /**
   * URL base de la API para operaciones CRUD de notas
   * @constant {string}
   */
  const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notas`;

  /**
   * Carga las plantillas desde la API y las organiza por nombre de novedad
   * @async
   * @function
   * @returns {Promise<void>}
   */
  const cargarPlantillas = async () => {
    // Obtener datos de autenticación desde localStorage
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

    // Validar que exista autenticación
    if (!token || !usuario?.id) return;

    try {
      // Realizar petición GET a la API
      const res = await fetch(`${API}/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` },
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

      setPlantillas(agrupadas);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setPlantillas({});
    }
  };

  /**
   * Efecto para cargar plantillas al montar el componente
   * Se ejecuta una vez al inicializar el componente
   */
  useEffect(() => {
    cargarPlantillas();
  }, []);

  /**
   * Efecto para actualizar el texto de la nota cuando cambia la selección o tipo
   * Se ejecuta cuando cambian la nota seleccionada, tipo de nota o plantillas
   */
  useEffect(() => {
    // Solo actualizar si hay una nota seleccionada y no ha sido modificada manualmente
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

  /**
   * Maneja el cambio de selección de nota en el dropdown
   * @function
   * @param {ChangeEvent<HTMLSelectElement>} e - Evento de cambio del select
   */
  const handleNotaChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setNotaSeleccionada(e.target.value);
    setTextoModificado(false); // Resetear flag de modificación manual
  };

  /**
   * Maneja el cambio entre tipo de nota (pública o interna)
   * @function
   * @param {"publica" | "interna"} tipo - Tipo de nota seleccionado
   */
  const handleTipoNotaChange = (tipo: "publica" | "interna") => {
    setTipoNota(tipo);
    setTextoModificado(false); // Resetear flag de modificación manual
  };

  /**
   * Maneja los cambios manuales en el textarea de la nota
   * @function
   * @param {ChangeEvent<HTMLTextAreaElement>} e - Evento de cambio del textarea
   */
  const handleTextoChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTextoNota(e.target.value);
    setTextoModificado(true); // Marcar como modificado manualmente
  };

  /**
   * Copia el texto actual al portapapeles
   * @function
   */
  const copiarTexto = () => {
    navigator.clipboard.writeText(textoNota);
  };

  /**
   * Limpia el texto actual y notifica al componente padre
   * @function
   */
  const limpiarTexto = () => {
    setTextoNota("");
    setTextoModificado(true);
    onSelect(""); // Notificar al componente padre
  };

  // --- FUNCIONES DE GESTIÓN DE PLANTILLAS ---

  /**
   * Abre el modal en modo agregar con el formulario vacío
   * @function
   */
  const abrirModalAgregar = () => {
    setModoModal("agregar");
    setFormData({ novedad: "", nota_publica: "", nota_interna: "" });
    setMostrarModal(true);
  };

  /**
   * Abre el modal en modo modificar con los datos de la plantilla seleccionada
   * @function
   */
  const abrirModalModificar = () => {
    // Validar que haya una nota seleccionada
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
   * Maneja el envío del formulario del modal (agregar o modificar)
   * @async
   * @function
   * @returns {Promise<void>}
   */
  const handleSubmitModal = async () => {
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

    // Validar autenticación
    if (!token || !usuario?.id) return;

    try {
      let response;

      if (modoModal === "agregar") {
        // Crear nombre único para evitar duplicados
        const nombreUnico = `${formData.novedad.trim()} - ${Date.now()}`;

        // Realizar petición POST para crear nueva plantilla
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
        // Modo modificar - obtener datos actuales
        const actual = plantillas[notaSeleccionada];

        // Realizar petición PUT para actualizar plantilla existente
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
        // Actualizar la selección si cambió el nombre
        setNotaSeleccionada(formData.novedad.trim());
      }

      // Manejar errores de la API
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

      // Cerrar modal y recargar datos
      setMostrarModal(false);
      cargarPlantillas();
    } catch (error) {
      console.error("Error al guardar/editar:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar plantilla: ${errorMessage}`);
    }
  };

  /**
   * Elimina la plantilla seleccionada con confirmación del usuario
   * @async
   * @function
   * @returns {Promise<void>}
   */
  const eliminarPlantilla = async () => {
    // Validar que haya una nota seleccionada
    if (!notaSeleccionada) {
      alert("Selecciona una nota primero");
      return;
    }

    const id = plantillas[notaSeleccionada].id;
    const token = localStorage.getItem("token");
    if (!token) return;

    // Confirmación de eliminación
    if (!window.confirm(`¿Eliminar plantilla "${notaSeleccionada}"?`)) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Manejar errores de la API
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

      // Limpiar estados y recargar datos
      setNotaSeleccionada("");
      setTextoNota("");
      onSelect("");
      cargarPlantillas();
    } catch (error) {
      console.error("❌ Error al eliminar plantilla:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar plantilla: ${errorMessage}`);
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="plantilla-view-wrapper">
      <div className="plantilla-container-premium">
        <div className="plantilla-card-premium">
          {/* Header con icono, título y subtítulo */}
          <div className="plantilla-header-premium">
            <div className="header-icon-box-p">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="header-text-p">
              <h2 className="title-p">Plantillas de Notas</h2>
              <p className="subtitle-p">Gestión de comunicaciones y notas de despacho</p>
            </div>
          </div>

          {/* Dropdown para seleccionar nota */}
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

          {/* Botones de Acción Superior */}
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

          {/* Textarea para edición de notas */}
          <div className="textarea-section-p">
            <textarea
              value={textoNota}
              onChange={handleTextoChange}
              className="textarea-p"
              placeholder="Contenido de la plantilla..."
            />
          </div>

          {/* Seleccionador de Tipo de Nota */}
          <div className="type-toggle-p">
            <button
              className={`type-toggle-btn ${tipoNota === "interna" ? "active" : ""}`}
              onClick={() => handleTipoNotaChange("interna")}
            >
              <span className="material-symbols-outlined">lock</span>
              NOTA INTERNA
            </button>
            <button
              className={`type-toggle-btn ${tipoNota === "publica" ? "active" : ""}`}
              onClick={() => handleTipoNotaChange("publica")}
            >
              <span className="material-symbols-outlined">public</span>
              NOTA PÚBLICA
            </button>
          </div>

          {/* Botones de utilidad */}
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

      {/* Marca de Agua SIGED */}

      {/* Modal para agregar/modificar plantillas */}
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