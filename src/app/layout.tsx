import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/tema.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGED - Despacho-B2B",
  description: "Sistema Integral de Gestión de Despacho",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        {/* Actualizamos el color del tema para navegadores móviles a juego con el diseño oscuro */}
        <meta name="theme-color" content="#020617" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased
          /* Cambiamos a fondo oscuro profundo y texto claro por defecto */
          bg-[#020617] 
          text-slate-200
          min-h-screen
          selection:bg-blue-500/30
        `}
      >
        {/* Contenedor principal para organizar Sidebar y Contenido si lo necesitas después */}
        <div className="relative flex min-h-screen overflow-hidden">
            {children}
        </div>
        <div id="modal-root" />
      </body>
    </html>
  );
}
