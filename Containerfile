# ==========================================
# Multi-stage Containerfile for Mercanto Frontend
# ==========================================

# Stage 1: Build the Vue 3 SPA using Debian-based Node.js (matching host v26)
FROM docker.io/library/node:26-slim AS builder

WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code (including .env if present)
COPY . .

# Build argument for VITE_API_BASE_URL (defaults to prod azure URL if not provided)
ARG VITE_API_BASE_URL="https://mercanto-bytes.northcentralus.cloudapp.azure.com/api"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build application for production
RUN npm run build

# Stage 2: Serve static production assets with Nginx
FROM docker.io/library/nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
