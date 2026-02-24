// src/components/Tema.tsx
"use client";

import React, { useEffect, useState } from "react";

const TEMA_CLASS = "dark-theme"; // La clase que tu CSS reconoce

const Tema = () => {
  const [darkMode, setDarkMode] = useState(false);

  // 1. useEffect de Inicialización: Carga el tema guardado al montar.
  useEffect(() => {
    const savedTheme = localStorage.getItem("tema");
    const isDark = savedTheme === "oscuro";

    setDarkMode(isDark);

    // Aplica la clase correcta al <body> para la carga inicial
    if (isDark) {
      document.body.classList.add(TEMA_CLASS);
    } else {
      document.body.classList.remove(TEMA_CLASS);
    }
  }, []);

  // 2. useEffect de Cambio: Aplica el nuevo tema y lo guarda.
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add(TEMA_CLASS);
      localStorage.setItem("tema", "oscuro");
    } else {
      document.body.classList.remove(TEMA_CLASS);
      localStorage.setItem("tema", "claro");
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(d => !d);
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
      title="Cambiar tema"
    >
      <span className={`material-symbols-outlined text-sm ${darkMode ? "text-primary" : "text-amber-400"}`}>
        {darkMode ? "dark_mode" : "light_mode"}
      </span>
      <span>{darkMode ? "Oscuro" : "Claro"}</span>
    </button>
  );
};

export default Tema;