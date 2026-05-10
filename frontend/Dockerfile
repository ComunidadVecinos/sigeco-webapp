FROM node:20-alpine

WORKDIR /app

# Dependencias fijadas a lockfile para builds reproducibles.
COPY package*.json ./
RUN npm ci

# Archivos mínimos necesarios para construir el frontend estático.
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY src ./src
COPY components.json ./


# Build estático servido luego por `serve`.
RUN npm run build

# Runtime ligero para publicar la build ya generada.
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
