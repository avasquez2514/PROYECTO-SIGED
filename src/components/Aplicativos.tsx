"use client";

/**
 * Componente: Aplicativos (CORREGIDO)
 * ------------------------------------------
 * 
 * ✅ CORREGIDO: Ahora no envía usuario_id en las requests
 * ✅ CORREGIDO: Usa rutas relativas para producción
 * ✅ CORREGIDO: Sincronizado con el backend actualizado
 */

import React, { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import "../styles/aplicativos.css";
import Modal from "./Modal";

// --- INTERFACES ---
interface Aplicativo {
  id: number;
  nombre: string;
  url: string;
  categoria: string;
}

interface NuevoAplicativo {
  nombre: string;
  url: string;
  categoria: string;
}

// --- CONSTANTES ---
// ✅ CORRECCIÓN: Usa ruta relativa para producción
const API = `/api/aplicativos`;

/**
 * Componente principal de gestión de aplicativos (CORREGIDO)
 */
const Aplicativos: React.FC = () => {
  // --- ESTADO ---
  const [aplicativos, setAplicativos] = useState<Aplicativo[]>([]);
  const [nuevo, setNuevo] = useState<NuevoAplicativo>({
    nombre: "",
    url: "",
    categoria: "",
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);
  const [otraCategoria, setOtraCategoria] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [modoModal, setModoModal] = useState<"aplicativo" | "categoria">("aplicativo");
  const [filtroNombre, setFiltroNombre] = useState("");

  // --- LÓGICA PRINCIPAL ---

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /**
   * Efecto que carga los aplicativos al montar el componente
   */
  useEffect(() => {
    fetchAplicativos();
  }, []);

  /**
   * Función asíncrona que obtiene los aplicativos del usuario desde la API (CORREGIDA)
   */
  const fetchAplicativos = async () => {
    const token = getToken();
    
    // ✅ CORRECCIÓN: Solo validamos token, no usuario_id
    if (!token) {
      console.log("❌ Token no encontrado");
      return;
    }

    try {
      // ✅ CORRECCIÓN: No enviamos usuario_id por query params
      const res = await fetch(API, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

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
   * Agrega un nuevo aplicativo a través de la API (CORREGIDA)
   */
  const agregarAplicativo = async () => {
    const token = getToken();
    
    // ✅ CORRECCIÓN: Solo validamos token, no usuario_id
    if (!token) {
      console.log("❌ Token no encontrado");
      return;
    }
    
    if (!nuevo.nombre || !nuevo.url || !nuevo.categoria) {
      return alert("Completa todos los campos");
    }

    try {
      // ✅ CORRECCIÓN: No enviamos usuario_id en el body
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          nombre: nuevo.nombre,
          url: nuevo.url,
          categoria: nuevo.categoria
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || `Error ${response.status}`);
      }

      resetFormulario();
      fetchAplicativos(); // Recargar lista
    } catch (err) {
      console.error("Error al agregar aplicativo:", err);
      alert(`Error al agregar aplicativo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  /**
   * Guarda los cambios de un aplicativo editado (CORREGIDA)
   */
  const guardarEdicion = async () => {
    const token = getToken();
    
    // ✅ CORRECCIÓN: Solo validamos token
    if (!token || !editandoId) return;

    try {
      // ✅ CORRECCIÓN: No enviamos usuario_id en el body
      const response = await fetch(`${API}/${editandoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          nombre: nuevo.nombre,
          url: nuevo.url,
          categoria: nuevo.categoria
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || `Error ${response.status}`);
      }

      resetFormulario();
      fetchAplicativos();
    } catch (err) {
      console.error("Error al editar aplicativo:", err);
      alert(`Error al editar aplicativo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  /**
   * Elimina un aplicativo específico con confirmación (CORREGIDA)
   */
  const eliminarAplicativo = async (id: number) => {
    const token = getToken();
    if (!token) return;
    
    if (!window.confirm("¿Eliminar este aplicativo?")) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || `Error ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Aplicativo eliminado:", result.mensaje);
      fetchAplicativos();
    } catch (err) {
      console.error("❌ Error al eliminar aplicativo:", err);
      alert(`Error al eliminar aplicativo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  /**
   * Elimina una categoría y todos sus aplicativos
   */
  const eliminarCategoria = async (cat: string) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat}" y todos sus aplicativos?`))
      return;
    
    // ✅ CORRECCIÓN: Eliminamos los aplicativos de la categoría uno por uno
    const aplicativosAEliminar = aplicativos.filter((a) => a.categoria === cat);
    
    for (const aplicativo of aplicativosAEliminar) {
      await eliminarAplicativo(aplicativo.id);
    }
    
    // Actualizamos las categorías disponibles
    const nuevasCategorias = categoriasDisponibles.filter((c) => c !== cat);
    setCategoriasDisponibles(nuevasCategorias);
    
    if (categoriaSeleccionada === cat) {
      setCategoriaSeleccionada(nuevasCategorias[0] || "");
    }
  };

  // --- MANEJADORES DE MODAL --- (sin cambios)
  const abrirEditar = (a: Aplicativo) => {
    setNuevo({ nombre: a.nombre, url: a.url, categoria: a.categoria });
    setEditando(true);
    setEditandoId(a.id);
    setModoModal("aplicativo");
    setModalOpen(true);
  };

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

  const abrirModalCategoria = () => {
    setOtraCategoria("");
    setModoModal("categoria");
    setModalOpen(true);
  };

  const resetFormulario = () => {
    setNuevo({ nombre: "", url: "", categoria: "" });
    setEditando(false);
    setEditandoId(null);
    setModalOpen(false);
  };

  const handleGuardar = () => {
    if (modoModal === "aplicativo") {
      if (editando) {
        guardarEdicion();
      } else {
        agregarAplicativo();
      }
    } else {
      if (!otraCategoria) return alert("Ingresa un nombre");
      if (!categoriasDisponibles.includes(otraCategoria)) {
        setCategoriasDisponibles((prev) => [...prev, otraCategoria]);
      }
      setCategoriaSeleccionada(otraCategoria);
      setModalOpen(false);
    }
  };

  // --- CÁLCULOS --- (sin cambios)
  const agrupados = (aplicativos || []).reduce(
    (acc: Record<string, Aplicativo[]>, a) => {
      const cat = a.categoria || "Sin categoría";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    },
    {} as Record<string, Aplicativo[]>
  );

  const aplicativosFiltrados = (
    agrupados[categoriaSeleccionada] || []
  ).filter((a) =>
    a.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  // --- RENDER --- (sin cambios en el JSX)
  return (
    <div className="app-layout">
      {/* --- BARRA LATERAL --- */}
      <aside className="app-sidebar">
        <h3 className="sidebar-title">CATEGORIAS</h3>
        <nav className="sidebar-nav">
          {categoriasDisponibles.map((cat) => (
            <button
              key={cat}
              className={`sidebar-btn ${
                cat === categoriaSeleccionada ? "active" : ""
              }`}
              onClick={() => setCategoriaSeleccionada(cat)}
            >
              <span>{cat}</span>
              <span className="sidebar-btn-count">
                {agrupados[cat]?.length || 0}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-buttons">
          <button className="btn-add-category" onClick={abrirModalCategoria}>
            <FaPlus style={{ marginRight: "0.5rem" }} />
            Agregar Categoría
          </button>
          <button className="btn-add-app-sidebar" onClick={abrirModalAplicativo}>
            <FaPlus style={{ marginRight: "0.5rem" }} />
            Agregar Aplicativo
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="app-main-content">
        <header className="content-header">
          <h1 className="content-title">{categoriaSeleccionada}</h1>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar aplicativo..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>
        </header>

        {/* --- CONTENEDOR DE LA TABLA --- */}
        <div className="table-container">
          <h3 className="table-title">Lista de aplicativos</h3>
          <table className="app-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Icono</th>
                <th>Nombre</th>
                <th>URL</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {aplicativosFiltrados.map((a) => (
                <tr key={a.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <img
                      src={`${new URL(a.url).origin}/favicon.ico`}
                      alt={`Logo de ${a.nombre}`}
                      className="app-logo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/icono-app.png";
                      }}
                    />
                  </td>
                  <td>{a.nombre}</td>
                  <td className="url-cell">
                    <a href={a.url} target="_blank" rel="noreferrer" title={a.url}>
                      {a.url}
                    </a>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon edit"
                        title="Editar"
                        onClick={() => abrirEditar(a)}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Eliminar"
                        onClick={() => eliminarAplicativo(a.id)}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {aplicativosFiltrados.length === 0 && (
            <p className="empty-table-message">
              No se encontraron aplicativos
              {filtroNombre && ` que coincidan con "${filtroNombre}"`}.
            </p>
          )}
        </div>
      </main>

      {/* --- MODALES --- */}
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
