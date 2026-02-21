FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy React app
COPY public ./public
COPY src ./src
COPY tsconfig.json ./

# Build static files
RUN npm run build

# Serve static build with 'serve'
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
