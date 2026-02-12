# ─── Stage 1: Build the static site ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# NocoDB credentials – injected by Coolify as build-time args
ARG NOCODB_BASE_URL
ARG NOCODB_API_TOKEN
ARG NOCODB_PROJECT_ID

ENV NOCODB_BASE_URL=${NOCODB_BASE_URL}
ENV NOCODB_API_TOKEN=${NOCODB_API_TOKEN}
ENV NOCODB_PROJECT_ID=${NOCODB_PROJECT_ID}

# Install dependencies first (layer cache)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source files
COPY frontend/ ./

# Build tailwind + eleventy
RUN npm run build

# ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:stable-alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built static site
COPY --from=builder /app/_site /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
