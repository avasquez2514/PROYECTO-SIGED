"use client";

import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import { FaSave, FaTimes } from "react-icons/fa";
// Asegúrate de que esta ruta sea correcta:
import "../styles/Modal.css"; 

// 📘 Interfaz que define las propiedades (props) esperadas por el componente Modal
interface ModalProps {
  isOpen: boolean;           // Controla si el modal debe mostrarse
  onClose: () => void;       // Función que se ejecuta al cerrar el modal
  onSave?: () => void;       // (Opcional) Función para guardar cambios
  
  // 🟢 PROPIEDADES AÑADIDAS PARA SOLUCIONAR EL ERROR DE COMPILACIÓN
  title: string;             // Título que se mostrará en el encabezado del modal
  showSaveButton: boolean;   // Controla si el botón de guardar debe mostrarse
  // -----------------------------------------------------------------

  children: ReactNode;       // Contenido dinámico que se mostrará dentro del modal
}

// 🧠 Componente Modal
const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  children, 
  title,                 // Añadida a la desestructuración
  showSaveButton         // Añadida a la desestructuración
}) => {
  // 🛑 Si el modal no está abierto, no renderiza nada
  if (!isOpen) return null;

  // 🔍 Busca el contenedor del modal en el DOM 
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    console.error("❌ No se encontró un elemento con id 'modal-root'.");
    return null;
  }

  // 🎯 Usa createPortal para renderizar el contenido del modal fuera del DOM principal
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        
        {/* 1. Encabezado del modal con el título */}
        <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            
            {/* ❌ Botón para cerrar el modal */}
            <button className="modal-close" onClick={onClose}>
              <FaTimes />
            </button>
        </div>

        {/* 🧩 Contenido del modal proporcionado desde el componente padre */}
        {children}

        {/* 2. Botón Guardar (solo si showSaveButton es true Y onSave está definido) */}
        {onSave && showSaveButton && (
          <button className="modal-save-button" onClick={onSave}>
            <FaSave style={{ marginRight: "8px" }} />
            Guardar
          </button>
        )}

      </div>
    </div>,
    modalRoot // ⬅️ Lugar donde se inyecta el modal
  );
};

export default Modal;
