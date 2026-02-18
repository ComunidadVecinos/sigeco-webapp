FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=development
ENV PORT=4000

EXPOSE 4000

# Run migrations, seed, then start server
CMD ["node", "src/index.js"]
