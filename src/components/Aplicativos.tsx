"use client";

/**
 * Componente: Aplicativos
 * ------------------------------------------
 * 
 * Este componente gestiona la visualización, creación, edición
 * y eliminación de aplicativos clasificados por categoría.
 * Cada usuario autenticado puede tener su propio conjunto
 * de aplicativos, los cuales se almacenan y protegen mediante
 * autenticación JWT en el backend.
 * 
 * ------------------------------------------
 * FUNCIONALIDADES PRINCIPALES:
 * 
 * - Listar aplicativos agrupados por categoría.
 * - Filtrar aplicativos por nombre en tiempo real.
 * - Agregar nuevos aplicativos asociados al usuario actual.
 * - Editar o eliminar aplicativos existentes.
 * - Crear y eliminar categorías personalizadas.
 * - Sincronizar datos con el backend mediante peticiones HTTP (fetch)
 *   autenticadas con token JWT.
 */

import React, { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import "../styles/aplicativos.css";
import Modal from "./Modal";

// --- INTERFACES ---

/**
 * Interfaz que define la estructura de un aplicativo
 * @interface Aplicativo
 * @property {number} id - Identificador único del aplicativo
 * @property {string} nombre - Nombre descriptivo del aplicativo
 * @property {string} url - URL de acceso al aplicativo
 * @property {string} categoria - Categoría a la que pertenece el aplicativo
 */
interface Aplicativo {
  id: number;
  nombre: string;
  url: string;
  categoria: string;
}

/**
 * Interfaz para la creación de nuevos aplicativos
 * @interface NuevoAplicativo
 * @property {string} nombre - Nombre del nuevo aplicativo
 * @property {string} url - URL del nuevo aplicativo
 * @property {string} categoria - Categoría del nuevo aplicativo
 */
interface NuevoAplicativo {
  nombre: string;
  url: string;
  categoria: string;
}

// --- CONSTANTES ---

/**
 * URL base de la API para operaciones CRUD de aplicativos
 * @constant {string}
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const API = `${API_BASE}/api/aplicativos`;

/**
 * Componente principal de gestión de aplicativos
 * @component
 * @returns {JSX.Element} Interfaz completa de gestión de aplicativos
 */
interface AplicativosProps {
  torre?: string;
}

const Aplicativos: React.FC<AplicativosProps> = ({ torre }) => {
  // --- ESTADO ---

  /**
   * Estado que almacena la lista completa de aplicativos del usuario
   * @state {Aplicativo[]}
   */
  const [aplicativos, setAplicativos] = useState<Aplicativo[]>([]);

  /**
   * Estado para el formulario de nuevo aplicativo o edición
   * @state {NuevoAplicativo}
   */
  const [nuevo, setNuevo] = useState<NuevoAplicativo>({
    nombre: "",
    url: "",
    categoria: "",
  });

  /**
   * Estado que almacena las categorías disponibles del usuario
   * @state {string[]}
   */
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);

  /**
   * Estado para el nombre de nueva categoría en el modal
   * @state {string}
   */
  const [otraCategoria, setOtraCategoria] = useState("");

  /**
   * Estado que controla la categoría actualmente seleccionada en la sidebar
   * @state {string}
   */
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

  /**
   * Estado que controla la visibilidad del modal
   * @state {boolean}
   */
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * Estado que indica si se está editando un aplicativo existente
   * @state {boolean}
   */
  const [editando, setEditando] = useState(false);

  /**
   * Estado que almacena el ID del aplicativo en edición
   * @state {number | null}
   */
  const [editandoId, setEditandoId] = useState<number | null>(null);

  /**
   * Estado que controla el tipo de modal activo (aplicativo o categoría)
   * @state {"aplicativo" | "categoria"}
   */
  const [modoModal, setModoModal] = useState<"aplicativo" | "categoria">("aplicativo");

  /**
   * Estado para el filtro de búsqueda por nombre de aplicativo
   * @state {string}
   */
  const [filtroNombre, setFiltroNombre] = useState("");

  // --- LÓGICA PRINCIPAL ---

  /**
   * Obtiene los datos del usuario desde localStorage
   * @returns {object | null} Datos del usuario o null si no está autenticado
   */
  const getUsuario = () => {
    // Verificar que window está disponible (evita errores en SSR)
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  };

  /**
   * Obtiene el token JWT desde localStorage
   * @returns {string | null} Token de autenticación o null
   */
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /**
   * Efecto que carga los aplicativos al montar el componente
   * Se ejecuta una vez al inicializar el componente
   */
  useEffect(() => {
    fetchAplicativos();
  }, []);

  /**
   * Función asíncrona que obtiene los aplicativos del usuario desde la API
   * @async
   * @returns {Promise<void>}
   */
  const fetchAplicativos = async () => {
    const token = getToken();
    const usuario = getUsuario();

    // Validar que existe autenticación
    if (!token || !usuario?.id) return;

    try {
      // Realizar petición GET a la API con autenticación
      const res = await fetch(`${API}?usuario_id=${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Aplicativo[] = await res.json();
      setAplicativos(data);

      // Extraer categorías únicas de los aplicativos
      const categorias = [...new Set(data.map((a) => a.categoria))];
      setCategoriasDisponibles(categorias);

      // Seleccionar primera categoría por defecto si no hay selección
      if (!categoriaSeleccionada && categorias.length > 0) {
        setCategoriaSeleccionada(categorias[0]);
      }
    } catch (err) {
      console.error("Error al cargar aplicativos:", err);
    }
  };

  /**
   * Agrega un nuevo aplicativo a través de la API
   * @async
   * @returns {Promise<void>}
   */
  const agregarAplicativo = async () => {
    const token = getToken();
    const usuario = getUsuario();

    // Validaciones de autenticación y datos requeridos
    if (!token || !usuario?.id) return;
    if (!nuevo.nombre || !nuevo.url || !nuevo.categoria)
      return alert("Completa todos los campos");

    try {
      // Petición POST para crear nuevo aplicativo
      await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...nuevo, usuario_id: usuario.id }),
      });

      resetFormulario();
      fetchAplicativos(); // Recargar lista
    } catch (err) {
      console.error("Error al agregar:", err);
    }
  };

  /**
   * Guarda los cambios de un aplicativo editado
   * @async
   * @returns {Promise<void>}
   */
  const guardarEdicion = async () => {
    const token = getToken();
    const usuario = getUsuario();

    // Validar que hay un aplicativo en edición
    if (!token || !usuario?.id || !editandoId) return;

    try {
      // Petición PUT para actualizar aplicativo existente
      await fetch(`${API}/${editandoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...nuevo, usuario_id: usuario.id }),
      });

      resetFormulario();
      fetchAplicativos(); // Recargar lista
    } catch (err) {
      console.error("Error al editar:", err);
    }
  };

  /**
   * Elimina un aplicativo específico con confirmación
   * @async
   * @param {number} id - ID del aplicativo a eliminar
   * @returns {Promise<void>}
   */
  const eliminarAplicativo = async (id: number) => {
    const token = getToken();
    if (!token) return;

    // Confirmación de eliminación
    if (!window.confirm("¿Eliminar este aplicativo?")) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.mensaje || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Aplicativo eliminado:", result.mensaje);
      fetchAplicativos(); // Recargar lista
    } catch (err) {
      console.error("❌ Error al eliminar aplicativo:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al eliminar aplicativo: ${errorMessage}`);
    }
  };

  /**
   * Elimina una categoría y todos sus aplicativos
   * @param {string} cat - Nombre de la categoría a eliminar
   */
  const eliminarCategoria = (cat: string) => {
    // Confirmación de eliminación
    if (!window.confirm(`¿Eliminar la categoría "${cat}" y todos sus aplicativos?`))
      return;

    // Filtrar aplicativos y categorías
    setAplicativos(aplicativos.filter((a) => a.categoria !== cat));
    const nuevas = categoriasDisponibles.filter((c) => c !== cat);
    setCategoriasDisponibles(nuevas);

    // Ajustar categoría seleccionada si era la eliminada
    if (categoriaSeleccionada === cat) {
      setCategoriaSeleccionada(nuevas[0] || "");
    }
  };

  // --- MANEJADORES DE MODAL ---

  /**
   * Abre el modal en modo edición con los datos de un aplicativo
   * @param {Aplicativo} a - Aplicativo a editar
   */
  const abrirEditar = (a: Aplicativo) => {
    setNuevo({ nombre: a.nombre, url: a.url, categoria: a.categoria });
    setEditando(true);
    setEditandoId(a.id);
    setModoModal("aplicativo");
    setModalOpen(true);
  };

  /**
   * Abre el modal para agregar un nuevo aplicativo
   */
  const abrirModalAplicativo = () => {
    setNuevo({
      nombre: "",
      url: "",
      categoria: categoriaSeleccionada || ""
    });
    setEditando(false);
    setEditandoId(null);
    setModoModal("aplicativo");
    setModalOpen(true);
  };

  /**
   * Abre el modal para crear una nueva categoría
   */
  const abrirModalCategoria = () => {
    setOtraCategoria("");
    setModoModal("categoria");
    setModalOpen(true);
  };

  /**
   * Resetea el formulario y cierra el modal
   */
  const resetFormulario = () => {
    setNuevo({ nombre: "", url: "", categoria: "" });
    setEditando(false);
    setEditandoId(null);
    setModalOpen(false);
  };

  /**
   * Función principal de guardado que maneja ambos modos del modal
   */
  const handleGuardar = () => {
    if (modoModal === "aplicativo") {
      // Modo aplicativo: crear o editar
      if (editando) {
        guardarEdicion();
      } else {
        agregarAplicativo();
      }
    } else {
      // Modo categoría: crear nueva categoría
      if (!otraCategoria) return alert("Ingresa un nombre");
      if (!categoriasDisponibles.includes(otraCategoria)) {
        setCategoriasDisponibles((prev) => [...prev, otraCategoria]);
      }
      setCategoriaSeleccionada(otraCategoria);
      setModalOpen(false);
    }
  };

  // --- CÁLCULOS ---

  /**
   * Agrupa los aplicativos por categoría para la sidebar
   * @type {Record<string, Aplicativo[]>}
   */
  const agrupados = (aplicativos || []).reduce(
    (acc: Record<string, Aplicativo[]>, a) => {
      const cat = a.categoria || "Sin categoría";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    },
    {} as Record<string, Aplicativo[]>
  );

  /**
   * Aplicativos filtrados por categoría seleccionada y término de búsqueda
   * @type {Aplicativo[]}
   */
  const aplicativosFiltrados = (
    agrupados[categoriaSeleccionada] || []
  ).filter((a) =>
    a.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  return (
    <div className="aplicativos-wrapper">
      <header className="header">
        <div className="header-title">Workspace / Dashboard</div>

        <div className="search-box">
          <span className="material-symbols-outlined icon">search</span>
          <input
            type="text"
            placeholder="Buscar aplicativo..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <div className="user-profile-btn" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1e293b", border: "1px solid #334155", overflow: "hidden" }}>
            <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="User" />
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-container">
          <div className="page-header">
            <div className="page-title">
              <h2>
                APLICATIVOS DESPACHO
                <span className="badge">{aplicativos.length} TOTAL</span>
              </h2>
              <p className="page-subtitle">Gestión centralizada de herramientas operativas de despacho.</p>
            </div>
            <button className="btn-new" onClick={abrirModalAplicativo}>
              <span className="material-symbols-outlined">add</span>
              Nuevo Aplicativo
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>
                    <div className="checkbox-circle" style={{ opacity: 0.5 }}></div>
                  </th>
                  <th>ÍCONO</th>
                  <th>NOMBRE DEL APLICATIVO</th>
                  <th>URL DE ACCESO</th>
                  <th style={{ textAlign: "right" }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {aplicativosFiltrados.map((a) => {
                  const getAppData = (name: string) => {
                    const lower = name.toLowerCase();
                    if (lower.includes('bmc')) return { icon: 'bolt', color: '#f97316', tag: 'PLATFORM · V2.4' };
                    if (lower.includes('pymes')) return { icon: 'grid_view', color: '#3b82f6', tag: 'INTERNAL TOOL' };
                    if (lower.includes('gmail')) return { icon: 'chat', color: '#ef4444', tag: 'COMMUNICATION' };
                    if (lower.includes('parafiscales')) return { icon: 'folder', color: '#10b981', tag: 'DOCUMENTATION · DRIVE' };
                    if (lower.includes('buzon')) return { icon: 'mail', color: '#a855f7', tag: 'OUTLOOK MAIL' };
                    return { icon: 'apps', color: '#6366f1', tag: 'EXTERNAL RESOURCE' };
                  };

                  const appData = getAppData(a.nombre);

                  return (
                    <tr key={a.id}>
                      <td style={{ textAlign: "center" }}>
                        <div className="checkbox-circle"></div>
                      </td>
                      <td>
                        <div
                          className="icon-box"
                          style={{
                            background: `${appData.color}15`,
                            borderColor: `${appData.color}30`
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ color: appData.color, fontSize: '1.5rem' }}>
                            {appData.icon}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="app-name">{a.nombre.toUpperCase()}</div>
                        <div className="app-tag">{appData.tag}</div>
                      </td>
                      <td>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="app-link">
                          {a.url.length > 45 ? a.url.substring(0, 45) + "..." : a.url}
                          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>open_in_new</span>
                        </a>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action" onClick={() => abrirEditar(a)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="btn-action delete" onClick={() => eliminarAplicativo(a.id)}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="table-footer">
              <span className="footer-text">
                MOSTRANDO 1 - {aplicativosFiltrados.length} DE {aplicativos.length} APLICATIVOS
              </span>
              <div className="pagination">
                <button className="page-btn"><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <button className="page-btn"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">TOTAL APPS</div>
              <div className="stat-value">{aplicativos.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">LINKS ACTIVOS</div>
              <div className="stat-value" style={{ color: "#10b981" }}>{aplicativos.length - 2 > 0 ? aplicativos.length - 2 : aplicativos.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">MANTENIMIENTO</div>
              <div className="stat-value" style={{ color: "#f97316" }}>2</div>
            </div>
            <div className="stat-card" style={{ border: "1px solid rgba(59, 130, 246, 0.3)", background: "rgba(59, 130, 246, 0.05)" }}>
              <div className="stat-label">VERSIÓN SISTEMA</div>
              <div className="stat-value" style={{ color: "var(--primary)" }}>v4.0.1</div>
            </div>
          </div>
        </div>
      </div>

      <button className="help-fab">
        <span className="material-symbols-outlined" style={{ fontSize: "1.875rem" }}>help_outline</span>
      </button>

      <div className="bg-decoration">
        <svg width="128" height="128" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 22h20L12 2zm0 3.84L18.66 20H5.34L12 5.84zM11 11h2v4h-2v-4zm0 6h2v2h-2v-2z"></path>
        </svg>
      </div>

      {/* --- MODAL APLICATIVO --- */}
      <Modal
        isOpen={modalOpen && modoModal === "aplicativo"}
        onClose={resetFormulario}
        onSave={handleGuardar}
        title={editando ? "Editar Aplicativo" : "Agregar Aplicativo"}
        showSaveButton={true}
      >
        <div className="form-section">
          <label className="section-label" htmlFor="app-name">
            Nombre del aplicativo
          </label>
          <input
            id="app-name"
            type="text"
            className="form-input"
            placeholder="Ej: Google Drive"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          />
        </div>

        <div className="form-section">
          <label className="section-label" htmlFor="app-url">
            URL
          </label>
          <input
            id="app-url"
            type="text"
            className="form-input"
            placeholder="https://drive.google.com"
            value={nuevo.url}
            onChange={(e) => setNuevo({ ...nuevo, url: e.target.value })}
          />
        </div>

        <div className="form-section">
          <label className="section-label" htmlFor="app-category">
            Categoría
          </label>
          <select
            id="app-category"
            className="form-select"
            value={nuevo.categoria}
            onChange={(e) =>
              setNuevo({ ...nuevo, categoria: e.target.value })
            }
          >
            <option value="">Selecciona una categoría</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* --- MODAL CATEGORÍA --- */}
      <Modal
        isOpen={modalOpen && modoModal === "categoria"}
        onClose={resetFormulario}
        onSave={handleGuardar}
        title="Nueva Categoría"
        showSaveButton={true}
      >
        <div className="form-section">
          <label className="section-label" htmlFor="cat-name">
            Nombre de la categoría
          </label>
          <input
            id="cat-name"
            type="text"
            className="form-input"
            value={otraCategoria}
            onChange={(e) => setOtraCategoria(e.target.value)}
            placeholder="Ej: Utilidades"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Aplicativos;