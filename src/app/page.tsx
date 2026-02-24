"use client";

import React, { useEffect, useState } from "react";
import Alarma from "../components/Alarma";
import Aplicativos from "../components/Aplicativos";
import EnvioCorreos from "../components/EnvioCorreos";
import LoginRegistro from "../components/LoginRegistro";
import NotasAvances from "../components/NotasAvances";
import NotasConciliacion from "../components/NotasConciliacion";
import NotasRapidas from "../components/NotasRapidas";
import NovedadesAsesor from "../components/NovedadesAsesor";
import PlantillasAdicionales from "../components/PlantillasAdicionales";
import PlantillaSelector from "../components/PlantillaSelector";
import Sidebar from "../components/Sidebar";
import TorreSelector from "../components/TorreSelector";
import Tema from "../components/Tema";

import { useNavegacion } from "../hooks/useNavegacion";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export default function Page() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [mostrarSelector, setMostrarSelector] = useState<boolean>(false);
  const [despachoOpen, setDespachoOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem("usuario");
      if (guardado && guardado !== "undefined") {
        setUsuario(JSON.parse(guardado));
      }
    } catch (error) {
      console.error("❌ Error al leer usuario desde localStorage:", error);
    }
  }, []);

  const {
    tipoNota,
    torre,
    pantallaBlanca,
    modoB2B,
    vista,
    vistaEspecial,
    handleSelectTipoNota,
    handleTorreSeleccionada,
    handleVistaEspecial,
    handleVolverInicio,
  } = useNavegacion();

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  const handleMenuOpen = () => setMenuOpen(!menuOpen);

  // Cierra el sidebar cuando hace click en INICIO
  const handleInicioClick = () => {
    handleVolverInicio();
    setMenuOpen(false);
    setDespachoOpen(false);
  };

  // Abre el sidebar y muestra pantalla en blanco
  const handleAbrirMenuConTorre = () => {
    setMenuOpen(true);
    // 🚀 La función que elimina el Sidebar ahora se llama desde el botón "Let's talk"
    handleSelectTipoNota("DESPACHO B2B");
  };

  // Maneja la selección de torre
  const handleTorreSeleccionadaConSubmenu = (torreSeleccionada: string) => {
    handleTorreSeleccionada(torreSeleccionada);
    setMostrarSelector(false);
  };

  // Determina si mostrar la pantalla de bienvenida elegante
  const mostrarBienvenida = usuario && vista === "inicio" && !pantallaBlanca;

  return (
    <div className="app-container">
      <div className="marca-de-agua"></div>

      {!usuario ? (
        <LoginRegistro onLogin={setUsuario} />
      ) : (
        <>
          <Sidebar
            onSelectTipoNota={handleSelectTipoNota}
            isOpen={menuOpen}
            onClose={handleMenuOpen}
            onVistaEspecial={handleVistaEspecial}
            torreSeleccionada={torre}
            modoB2B={modoB2B}
            onVolverInicio={handleInicioClick}
            cerrarSesion={cerrarSesion}
          />

          <main className="main-container bg-mesh">
            {/* --- DECORACIONES DE FONDO --- */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -z-10"></div>

            <div className="absolute bottom-12 right-12 select-none pointer-events-none metallic-logo">
              <span className="text-9xl font-black tracking-tighter italic" style={{ fontSize: '12rem', color: 'rgba(255,255,255,0.05)' }}>A</span>
            </div>

            {/* --- INDICADOR DE TORRE --- */}
            {torre && (
              <div className="tower-indicator">
                <div className="tower-dot"></div>
                <span>TORRE: {torre}</span>
              </div>
            )}

            {/* --- HEADER SUPERIOR --- */}
            {!pantallaBlanca && vista === "inicio" && (
              <header className="h-16 flex items-center justify-center px-8 z-10 mt-8">
                <div className="glass px-6 py-2 rounded-full flex items-center gap-8 border-slate-700/30">
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/90 hover:text-primary transition-colors cursor-pointer border-none bg-transparent" onClick={handleInicioClick}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>home</span> HOME
                  </button>
                  <div className="h-4 w-[1px] bg-slate-700/50"></div>
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent" onClick={cerrarSesion}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>shield</span> ABOUT
                  </button>
                </div>
              </header>
            )}

            {mostrarSelector ? (
              <TorreSelector onSelect={handleTorreSeleccionadaConSubmenu} />
            ) : mostrarBienvenida ? (
              <div className="welcome-container fade-in">
                <div className="welcome-content">
                  <h2 className="welcome-title text-neon-glow leading-tight">
                    BIENVENIDO {usuario.nombre?.toUpperCase()}
                  </h2>
                  <p className="welcome-subtitle uppercase tracking-[0.2em] opacity-60">
                    Haz click en el botón para seleccionar tu torre
                  </p>

                  <button
                    onClick={handleAbrirMenuConTorre}
                    className="welcome-button glass glass-hover group"
                  >
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/90">Selecciona tu torre</span>
                    <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-x-2">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              // Contenido restante...
              <div className="flex-1 w-full overflow-auto">
                {pantallaBlanca ? (
                  <div className="pantalla-blanca"></div>
                ) : vista === "inicio" ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="welcome-title text-neon-glow">HOLA, {usuario.nombre?.toUpperCase()}</h1>
                  </div>
                ) : modoB2B && !torre ? (
                  <TorreSelector onSelect={handleTorreSeleccionadaConSubmenu} />
                ) : vistaEspecial === "notasAvances" ? (
                  <NotasAvances torre={torre} />
                ) : vistaEspecial === "notasConciliacion" ? (
                  <NotasConciliacion torre={torre} />
                ) : vistaEspecial === "notasSeguimiento" || vistaEspecial === "plantillas" ? (
                  <PlantillaSelector torre={torre} onSelect={() => { }} />
                ) : vistaEspecial === "plantillasAdicionales" ? (
                  <PlantillasAdicionales torre={torre} />
                ) : vistaEspecial === "envioInicio" ||
                  vistaEspecial === "envioCierre" ||
                  vistaEspecial === "envioApertura" ||
                  vistaEspecial === "envioPermisos" ? (
                  <EnvioCorreos tipo={vistaEspecial} />
                ) : vistaEspecial === "alarma" ? (
                  <Alarma />
                ) : vistaEspecial === "aplicativos" ? (
                  <Aplicativos torre={torre} />
                ) : vistaEspecial === "novedadesAsesor" ? (
                  <NovedadesAsesor torre={torre || ""} />
                ) : vistaEspecial === "notasRapidas" ? (
                  <NotasRapidas />
                ) : (
                  !modoB2B && !torre && tipoNota && (
                    <TorreSelector onSelect={handleTorreSeleccionadaConSubmenu} />
                  )
                )}
              </div>
            )}
          </main>

        </>
      )}
    </div>
  );
}