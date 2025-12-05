FROM node:20-bookworm

WORKDIR /app

# Install dependencies (including devDeps for Prisma CLI)
COPY package*.json ./
RUN npm install

# Copy Prisma files and generate client at build time
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Run migrations, seed, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node src/index.js"]
