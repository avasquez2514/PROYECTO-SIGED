"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash, FaGoogle, FaApple, FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import "../styles/loginregistro.css";

interface LoginRegistroProps {
  onLogin: (usuario: any) => void;
}

const LoginRegistro: React.FC<LoginRegistroProps> = ({ onLogin }) => {
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [recordarme, setRecordarme] = useState(false);

  // ── TOAST ──
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Modo recuperación
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const guardarSesionEnLocalStorage = (token: string, usuario: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
  };

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    const ruta = esRegistro ? "registro" : "login";
    const datos = esRegistro ? { email, nombre, contraseña } : { email, contraseña };
    try {
      setCargando(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const respuesta = await fetch(`${API_BASE}/api/auth/${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) { showToast(resultado.mensaje || "Error en la autenticación", "error"); return; }
      guardarSesionEnLocalStorage(resultado.token, resultado.usuario);
      showToast(resultado.mensaje || "Inicio de sesión exitoso", "success");
      setTimeout(() => onLogin(resultado.usuario), 1200);
    } catch { showToast("Error de conexión con el servidor", "error"); } finally { setCargando(false); }
  };

  const recuperarContraseña = async (e: FormEvent) => {
    e.preventDefault();
    if (nueva !== confirmar) { showToast("Las contraseñas no coinciden", "error"); return; }
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const respuesta = await fetch(`${API_BASE}/api/auth/recuperar-contrasena`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, actual, nueva }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) { showToast(resultado.mensaje || "Error al recuperar contraseña", "error"); return; }
      showToast(resultado.mensaje || "Contraseña actualizada correctamente", "success");
      setModoRecuperar(false);
      setEmail(""); setActual(""); setNueva(""); setConfirmar("");
    } catch { showToast("Error de conexión con el servidor", "error"); }
  };

  /* ─── MODO RECUPERAR ─── */
  if (modoRecuperar) {
    return (
      <div className="lr-wrapper">
        {/* ── TOAST ── */}
        {toast && (
          <div className={`lr-toast lr-toast-${toast.type}`}>
            <span className="lr-toast-icon">
              {toast.type === "success" && <FaCheckCircle />}
              {toast.type === "error" && <FaTimesCircle />}
              {toast.type === "info" && <FaInfoCircle />}
            </span>
            <span className="lr-toast-msg">{toast.msg}</span>
            <div className="lr-toast-bar" />
          </div>
        )}
        <div className="lr-card">
          <h2 className="lr-title">Recuperar contraseña</h2>
          <p className="lr-subtitle">Ingresa tu correo y establece una nueva contraseña.</p>
          <form onSubmit={recuperarContraseña} className="lr-form">
            <div className="lr-field">
              <label className="lr-label">Correo electrónico</label>
              <input type="email" className="lr-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder=" " />
            </div>
            <div className="lr-field">
              <label className="lr-label">Contraseña actual</label>
              <div className="lr-pass-wrap">
                <input type={mostrarActual ? "text" : "password"} className="lr-input" value={actual} onChange={e => setActual(e.target.value)} required placeholder=" " />
                <button type="button" className="lr-eye" onClick={() => setMostrarActual(v => !v)}>{mostrarActual ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            </div>
            <div className="lr-field">
              <label className="lr-label">Nueva contraseña</label>
              <div className="lr-pass-wrap">
                <input type={mostrarNueva ? "text" : "password"} className="lr-input" value={nueva} onChange={e => setNueva(e.target.value)} required placeholder=" " />
                <button type="button" className="lr-eye" onClick={() => setMostrarNueva(v => !v)}>{mostrarNueva ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            </div>
            <div className="lr-field">
              <label className="lr-label">Confirmar contraseña</label>
              <div className="lr-pass-wrap">
                <input type={mostrarConfirmar ? "text" : "password"} className="lr-input" value={confirmar} onChange={e => setConfirmar(e.target.value)} required placeholder=" " />
                <button type="button" className="lr-eye" onClick={() => setMostrarConfirmar(v => !v)}>{mostrarConfirmar ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            </div>
            <button type="submit" className="lr-btn-primary">Guardar nueva contraseña</button>
            <button type="button" className="lr-btn-secondary" onClick={() => setModoRecuperar(false)}>Cancelar</button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── LOGIN / REGISTRO ─── */
  return (
    <div className="lr-wrapper">
      {/* ── TOAST ── */}
      {toast && (
        <div className={`lr-toast lr-toast-${toast.type}`}>
          <span className="lr-toast-icon">
            {toast.type === "success" && <FaCheckCircle />}
            {toast.type === "error" && <FaTimesCircle />}
            {toast.type === "info" && <FaInfoCircle />}
          </span>
          <span className="lr-toast-msg">{toast.msg}</span>
          <div className="lr-toast-bar" />
        </div>
      )}
      <div className="lr-card">

        {/* Título */}
        <h2 className="lr-title">Bienvenido</h2>
        <p className="lr-subtitle">Ingresa tus credenciales para continuar.</p>

        {/* Tabs */}
        <div className="lr-tabs">
          <button
            className={`lr-tab${esRegistro ? " lr-tab-active" : ""}`}
            onClick={() => setEsRegistro(true)}
          >
            Inscribirse
          </button>
          <button
            className={`lr-tab${!esRegistro ? " lr-tab-active" : ""}`}
            onClick={() => setEsRegistro(false)}
          >
            Iniciar sesión
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="lr-form">

          {/* Nombre (solo registro) */}
          {esRegistro && (
            <div className="lr-field">
              <label className="lr-label">Nombre completo</label>
              <input
                type="text"
                className="lr-input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder=" "
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="lr-field">
            <label className="lr-label">Correo electrónico</label>
            <input
              type="email"
              className="lr-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder=" "
              autoComplete="username"
            />
          </div>

          {/* Contraseña */}
          <div className="lr-field">
            <label className="lr-label">Contraseña</label>
            <div className="lr-pass-wrap">
              <input
                type={mostrar ? "text" : "password"}
                className="lr-input"
                value={contraseña}
                onChange={e => setContraseña(e.target.value)}
                required
                placeholder=" "
                autoComplete={esRegistro ? "new-password" : "current-password"}
              />
              <button type="button" className="lr-eye" onClick={() => setMostrar(v => !v)}>
                {mostrar ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Recordarme + Olvidé contraseña */}
          {!esRegistro && (
            <div className="lr-row-extras">
              <label className="lr-remember">
                <input
                  type="checkbox"
                  className="lr-checkbox"
                  checked={recordarme}
                  onChange={e => setRecordarme(e.target.checked)}
                />
                <span>Recordarme</span>
              </label>
              <button type="button" className="lr-forgot" onClick={() => setModoRecuperar(true)}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Botón principal */}
          <button type="submit" className="lr-btn-primary" disabled={cargando}>
            {cargando
              ? esRegistro ? "Registrando..." : "Ingresando..."
              : esRegistro ? "CREAR CUENTA" : "INGRESAR"}
          </button>
        </form>

        {/* Divisor */}
        <div className="lr-divider">
          <span>O INICIA SESIÓN CON</span>
        </div>

        {/* Botones sociales */}
        <div className="lr-social-grid">
          <button className="lr-social-btn">
            <FaGoogle size={16} style={{ color: "#ea4335" }} />
            <span>Google</span>
          </button>
          <button className="lr-social-btn">
            <FaApple size={16} />
            <span>Apple</span>
          </button>
        </div>

        {/* Footer */}
        <p className="lr-footer">
          Al crear una cuenta, aceptas nuestros{" "}
          <span className="lr-link">Términos y Condiciones</span>{" "}
          así como nuestra política de privacidad.
        </p>

      </div>
    </div>
  );
};

export default LoginRegistro;