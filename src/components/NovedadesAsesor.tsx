"use client";

import React, { useCallback, useEffect, useState } from "react";
import "../styles/novedadesAsesor.css";
import Modal from "./Modal";

interface Novedad {
  id: string;
  novedad: string;
  nota_avances: string;
  usuario_id: string;
}

interface NovedadesAsesorProps {
  torre: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// --- ICONOS SVG ---
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

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const NovedadesAsesor: React.FC<NovedadesAsesorProps> = ({ torre }) => {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [textoNovedad, setTextoNovedad] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCargandoMejora, setIsCargandoMejora] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "null") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const usuario_id = usuario?.id;

  const STORAGE_KEY = "novedades_asesor_local";

  const cargarNovedades = useCallback(() => {
    setIsLoading(true);
    try {
      const storedNovedades = localStorage.getItem(STORAGE_KEY);
      if (storedNovedades) {
        setNovedades(JSON.parse(storedNovedades));
      } else {
        setNovedades([]);
      }
    } catch (error) {
      console.error("Error al cargar novedades de LocalStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNovedades();
  }, [cargarNovedades]);

  const manejarGuardar = () => {
    if (!textoNovedad.trim()) return;
    try {
      const nuevaNovedad: Novedad = {
        id: Date.now().toString(),
        novedad: `Novedad de Asesor - ${new Date().toLocaleDateString()}`,
        nota_avances: textoNovedad.trim(),
        usuario_id: usuario_id || "local_user",
      };

      const nuevasNovedades = [nuevaNovedad, ...novedades];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasNovedades));

      setNovedades(nuevasNovedades);
      setTextoNovedad("");
      setBase64Image(null);
      setModalOpen(false);
    } catch (error) {
      console.error("Error al guardar novedad en LocalStorage:", error);
    }
  };

  const eliminarNovedad = (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta novedad?")) return;
    try {
      const nuevasNovedades = novedades.filter((nov) => nov.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasNovedades));
      setNovedades(nuevasNovedades);
    } catch (error) {
      console.error("Error al eliminar novedad de LocalStorage:", error);
    }
  };

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      alert("Texto copiado al portapapeles");
    });
  };

  const mejorarConIA = async () => {
    if (!textoNovedad.trim()) return;
    setIsCargandoMejora(true);
    try {
      const response = await fetch(`${API_URL}/api/ia/mejorar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: textoNovedad, modo: "mejorar" }),
      });
      const data = await response.json();
      if (data.textoMejorado) setTextoNovedad(data.textoMejorado);
    } catch (error) {
      console.error("Error al mejorar con IA:", error);
    } finally {
      setIsCargandoMejora(false);
    }
  };

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const procesarOCR = async () => {
    if (!base64Image || !mimeType) return;
    setIsCargandoMejora(true);
    try {
      const base64Clean = base64Image.split(",")[1];
      const response = await fetch(`${API_URL}/api/ia/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ base64Image: base64Clean, mimeType }),
      });
      const data = await response.json();
      if (data.textoMejorado) setTextoNovedad(data.textoMejorado);
    } catch (error) {
      console.error("Error OCR:", error);
    } finally {
      setIsCargandoMejora(false);
    }
  };

  const novedadesFiltradas = novedades.filter((nov) =>
    nov.nota_avances.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  return (
    <div className="novedades-asesor-container">
      <div className="novedades-content">
        <div className="novedades-header">
          <div className="novedades-title-section">
            <div className="novedades-icon"><FileTextIcon /></div>
            <div className="novedades-title-text">
              <h1>Novedades de Asesor</h1>
              <p>Registro y gestión de incidencias torre {torre}</p>
            </div>
          </div>
          <button className="agregar-button" onClick={() => setModalOpen(true)}>
            <PlusIcon /> Agregar Novedad
          </button>
        </div>

        <div className="busqueda-section">
          <div className="busqueda-wrapper">
            <SearchIcon />
            <input type="text" placeholder="Buscar novedades..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} />
          </div>
          <div className="stats-pill">Total: {novedades.length}</div>
        </div>

        {isLoading ? (
          <div className="loading-state">Cargando novedades...</div>
        ) : novedadesFiltradas.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#475569' }}>inventory_2</span>
            <p>No se encontraron novedades</p>
          </div>
        ) : (
          <div className="novedades-grid">
            {novedadesFiltradas.map((nov) => (
              <div key={nov.id} className="novedad-card">
                <p className="novedad-texto">{nov.nota_avances}</p>
                <div className="novedad-footer">
                  <button onClick={() => copiarAlPortapapeles(nov.nota_avances)} className="btn-icon" title="Copiar"><CopyIcon /> <span>Copiar</span></button>
                  <button onClick={() => eliminarNovedad(nov.id)} className="btn-icon delete" title="Eliminar"><Trash2Icon /> <span>Eliminar</span></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Novedad">
        <div className="modal-body-custom">
          <textarea value={textoNovedad} onChange={(e) => setTextoNovedad(e.target.value)} placeholder="Describe la novedad aquí..." rows={6} className="novedad-textarea" />

          <div className="ia-tools">
            <button onClick={mejorarConIA} disabled={isCargandoMejora} className="btn-ia">
              {isCargandoMejora ? "🚀 Procesando..." : "🤖 Mejorar con IA"}
            </button>
            <div className="ocr-tool">
              <input type="file" accept="image/*" onChange={manejarArchivo} id="file-upload" />
              <label htmlFor="file-upload" className="btn-file">🖼️ Cargar Imagen</label>
              {base64Image && <button onClick={procesarOCR} className="btn-ocr">✨ Extraer Texto</button>}
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={() => setModalOpen(false)} className="btn-cancelar">Cancelar</button>
            <button onClick={manejarGuardar} className="btn-guardar">Guardar Novedad</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NovedadesAsesor;