"use client";

import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import "../styles/Modal.css";

// 📘 Interfaz (Esto ya estaba bien)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
  children: React.ReactNode;
  title: string; // <-- Definición correcta
}

// 🧠 Componente Modal (Aquí estaba el error)
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave = () => { },
  children,
  title, // <-- 1. Faltaba recibir el title
  showSaveButton = false, // <-- 2. Faltaba recibir el showSaveButton
}) => {
  // 🛑 Si el modal no está abierto, no renderiza nada
  if (!isOpen) return null;

  // 🔍 Busca el contenedor del modal en el DOM
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    console.error("❌ No se encontró un elemento con id 'modal-root'.");
    return null;
  }

  // 🎯 Usa createPortal para renderizar el contenido del modal
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">

        {/* --- ENCABEZADO CON TÍTULO Y BOTÓN DE CERRAR --- */}
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3> {/* <-- 3. Usando el title */}
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* --- CUERPO DEL MODAL --- */}
        <div className="modal-body">
          {children}
        </div>

        {/* --- PIE DE PÁGINA CON BOTONES --- */}
        <div className="modal-footer">
          {/* <-- 4. Usando showSaveButton para decidir si se muestra */}
          {showSaveButton && onSave && (
            <button className="modal-save-button" onClick={onSave}>
              <FaSave style={{ marginRight: "8px" }} />
              Guardar
            </button>
          )}
        </div>

      </div>
    </div>,
    modalRoot // ⬅️ Lugar donde se inyecta el modal
  );
};

export default Modal;