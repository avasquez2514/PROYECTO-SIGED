# 1. ETAPA DE CONSTRUCCIÓN (BUILDER)
# Usa una imagen Node.js completa para instalar dependencias y construir la app.
FROM node:20-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de manifiesto para que Docker pueda cachear la instalación de dependencias
COPY package.json package-lock.json ./

# Instala todas las dependencias, incluyendo las de desarrollo
RUN npm install

# Copia el código fuente restante de todo el proyecto (incluyendo Next.js y tu Backend)
COPY . .

# Construye la aplicación Next.js.
RUN npm run build

# ---
# 2. ETAPA FINAL (RUNNER)
# Usa una imagen Node.js más ligera (alpine) para el entorno de ejecución en producción.
FROM node:20-alpine AS runner

# Establece el directorio de trabajo dentro del contenedor para el runner
WORKDIR /app

# Configura el entorno como producción y el puerto (Formato Corregido)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Copia solo los archivos esenciales desde la etapa de construcción (BUILDER)
# 1. La compilación de Next.js
COPY --from=builder /app/.next ./.next
# 2. Las dependencias de producción
COPY --from=builder /app/node_modules ./node_modules
# 3. La carpeta pública de archivos estáticos
COPY public ./public

# Copia el código de tu servidor unificado y la lógica del backend
# `server.js` es tu punto de entrada.
COPY server.js ./
COPY Backend ./Backend

# Copia tsconfig.json si es necesario para el runtime
COPY tsconfig.json ./

# Comando para iniciar la aplicación unificada (tu server.js es el punto de entrada)
CMD node server.js