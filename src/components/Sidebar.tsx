// src/components/Sidebar.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";

interface SidebarProps {
  onSelectTipoNota: (tipo: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onVistaEspecial: (vista: string) => void;
  torreSeleccionada: string | null;
  onVolverInicio: () => void;
  cerrarSesion: () => void;
  modoB2B: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSelectTipoNota,
  onVistaEspecial,
  onVolverInicio,
  cerrarSesion,
}) => {
  const [isDespachoOpen, setDespachoOpen] = useState(true);
  const [correoMenuOpen, setCorreoMenuOpen] = useState(false);
  const [correoMenuPos, setCorreoMenuPos] = useState({ top: 0 });
  const correoRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCorreoMenu = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (correoRef.current) {
      const rect = correoRef.current.getBoundingClientRect();
      setCorreoMenuPos({ top: rect.top });
    }
    setCorreoMenuOpen(true);
  }, []);

  const closeCorreoMenu = useCallback(() => {
    closeTimer.current = setTimeout(() => setCorreoMenuOpen(false), 200);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <aside className="w-64 border-r border-slate-800/50 flex flex-col bg-sidebar-dark z-20 h-screen sticky top-0">
      {/* --- LOGO SECTION --- */}
      <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={onVolverInicio}>
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined font-bold">bolt</span>
        </div>
        <div>
          <h1 className="text-sm font-black tracking-[0.2em] text-white">DESPACHO B2B</h1>
          <p className="text-[9px] uppercase tracking-widest text-white font-bold">Premium Console</p>
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        <button
          onClick={onVolverInicio}
          className="flex items-center gap-3 px-5 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all group w-full text-left"
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">home</span>
          <span className="text-xs font-bold uppercase tracking-[0.15em]">Inicio</span>
        </button>

        <div className="pt-4 pb-2 px-5">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Servicios</span>
        </div>

        {/* DESPACHO B2B CATEGORY */}
        <div>
          <button
            onClick={() => setDespachoOpen(!isDespachoOpen)}
            className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all group w-full text-left ${isDespachoOpen ? 'text-white' : 'text-white hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">hub</span>
              <span className="text-xs font-bold uppercase tracking-[0.15em]">Despacho B2B</span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isDespachoOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {isDespachoOpen && (
            <div className="mt-2 ml-4 space-y-1 border-l border-slate-800/50 pl-4">
              <button onClick={() => onVistaEspecial("alarma")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                <span className="material-symbols-outlined text-lg">notifications</span> Alarma
              </button>
              <button onClick={() => onVistaEspecial("aplicativos")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                <span className="material-symbols-outlined text-lg">apps</span> Aplicativos
              </button>

              {/* ENVÍO DE CORREOS con submenú flotante */}
              <div
                className="relative"
                onMouseEnter={openCorreoMenu}
                onMouseLeave={closeCorreoMenu}
              >
                <button
                  ref={correoRef}
                  className="flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">mail</span>
                    Envío de Correos
                  </div>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>

                {/* Submenú flotante */}
                {correoMenuOpen && (
                  <div
                    className="fixed left-64 z-50 w-52 rounded-xl overflow-hidden shadow-2xl"
                    style={{ top: correoMenuPos.top }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={closeCorreoMenu}
                  >
                    <div className="bg-[#070c18] border border-slate-800/80 rounded-xl py-1 backdrop-blur-xl shadow-2xl">
                      {[
                        { label: "Envío Apertura", vista: "envioApertura" },
                        { label: "Envío Cierre", vista: "envioCierre" },
                        { label: "Envío Inicio", vista: "envioInicio" },
                        { label: "Envío Permisos", vista: "envioPermisos" },
                      ].map((item) => (
                        <button
                          key={item.vista}
                          onClick={() => {
                            onVistaEspecial(item.vista);
                            setCorreoMenuOpen(false);
                          }}
                          className="w-full text-left px-5 py-3 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => onVistaEspecial("novedadesAsesor")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                <span className="material-symbols-outlined text-lg">group</span> Novedades Asesor
              </button>
              <button onClick={() => onVistaEspecial("notasRapidas")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                <span className="material-symbols-outlined text-lg">edit_note</span> Notas Rápidas
              </button>

              <div className="pt-2">
                <span className="text-[9px] font-bold text-white uppercase px-4">Documentación</span>
                <button onClick={() => onVistaEspecial("notasAvances")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                  <span className="material-symbols-outlined text-lg">history</span> Avances
                </button>
                <button onClick={() => onVistaEspecial("plantillas")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                  <span className="material-symbols-outlined text-lg">description</span> Plantillas Pública/Interna
                </button>
                <button onClick={() => onVistaEspecial("plantillasAdicionales")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                  <span className="material-symbols-outlined text-lg">library_books</span> Plantillas Adicionales
                </button>
                <button onClick={() => onVistaEspecial("notasConciliacion")} className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-white hover:bg-slate-800/30 w-full text-left transition-all">
                  <span className="material-symbols-outlined text-lg">handshake</span> Conciliación
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-slate-800/50 space-y-1">
        <button className="flex items-center gap-3 px-3 py-3 rounded-xl text-white hover:bg-slate-800/20 transition-all w-full text-left">
          <span className="material-symbols-outlined text-xl">Ajustes</span>
          <span className="text-xs font-bold uppercase tracking-widest"></span>
        </button>
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-3 px-5 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all w-full text-left"
        >
          <span className="material-symbols-outlined text-xl">Salir</span>
          <span className="text-xs font-bold uppercase tracking-widest"></span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;