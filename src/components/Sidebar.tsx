"use client";

import React, { useState } from "react";
import Tema from "./Tema"; 
import {
  FiHome,
  FiPackage,
  FiAlertTriangle,
  FiTrello,
  FiMail,
  FiFileText,
  FiUsers,
  FiEdit3,
  FiLock,
  FiChevronDown,
  FiX,
  FiSettings,
  FiZap,
  FiShield,
  FiBarChart2 // Icono para Reportes similar a la imagen
} from "react-icons/fi";

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
  isOpen,
  onClose,
  onVistaEspecial,
  torreSeleccionada,
  onVolverInicio,
  cerrarSesion,
  modoB2B,
}) => {
  const [isNotasDespachoOpen, setNotasDespachoOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>("home");

  const handleNavClick = (itemId: string) => {
    setActiveNav(itemId); 
    if (itemId === 'home') onVolverInicio(); 
    else if (itemId === 'about') cerrarSesion();
  };

  return (
    <>
      {/* OVERLAY PARA MÓVIL */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* SIDEBAR PRINCIPAL */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 
        bg-[#020617] border-r border-white/5
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        
        {/* LOGO SECTION */}
        <div className="p-6 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <FiZap className="text-white text-xl fill-current" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wider text-sm">ADMIN MOC</h1>
            <p className="text-[10px] text-slate-500 font-medium">PREMIUM CONSOLE</p>
          </div>
        </div>

        {/* CONTENIDO DEL MENÚ */}
        <div className="flex-1 px-4 space-y-8 overflow-y-auto">
          
          {/* SECCIÓN PRINCIPAL */}
          <div>
            <button 
              onClick={() => handleNavClick('home')}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${activeNav === 'home' 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}
              `}
            >
              <FiHome size={20} />
              <span className="font-semibold text-sm tracking-wide">INICIO</span>
            </button>
          </div>

          {/* SECCIÓN SERVICIOS */}
          <div>
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-4">Servicios</p>
            <div className="space-y-1">
              <button 
                onClick={() => setNotasDespachoOpen(!isNotasDespachoOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-400 hover:text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FiPackage size={20} className="group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm font-medium">DESPACHO B2B</span>
                </div>
                <FiChevronDown className={`transition-transform duration-200 ${isNotasDespachoOpen ? "rotate-180" : ""}`} />
              </button>

              {/* SUBMENÚ CON EFECTO DE LÍNEA IZQUIERDA */}
              {isNotasDespachoOpen && (
                <div className="ml-6 pl-4 border-l border-white/10 space-y-1 py-2">
                  <button onClick={() => onVistaEspecial("alarma")} className="w-full text-left py-2 text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                    <FiAlertTriangle size={14} /> Alarma
                  </button>
                  <button onClick={() => onVistaEspecial("aplicativos")} className="w-full text-left py-2 text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                    <FiTrello size={14} /> Aplicativos
                  </button>
                </div>
              )}

              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 transition-colors group">
                <FiBarChart2 size={20} className="group-hover:text-blue-400 transition-colors" />
                <span className="text-sm font-medium">REPORTES</span>
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER - SETTINGS & LOGOUT */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium">
            <FiSettings size={20} />
            <span>Settings</span>
          </button>
          <button 
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all text-sm font-medium"
          >
            <FiLock size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* NAVBAR SUPERIOR (Glassmorphism) */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 lg:left-[calc(50%+128px)] z-30">
        <div className="flex items-center gap-2 bg-[#0d1321]/80 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full shadow-2xl">
          <button onClick={() => handleNavClick('home')} className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeNav === 'home' ? 'text-blue-400' : 'text-slate-400'}`}>
            Home
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <Tema />
          <div className="w-[1px] h-4 bg-white/10" />
          <button onClick={cerrarSesion} className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            About
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
