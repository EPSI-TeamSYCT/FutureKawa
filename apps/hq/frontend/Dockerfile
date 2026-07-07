# syntax=docker/dockerfile:1

# ---- Build stage: compile the Vite app ----------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Build-time configuration (Vite inlines VITE_* at build).
#   Defaults keep the self-contained MSW demo (offline, no backend needed).
#   For a real backend: --build-arg VITE_USE_MOCKS=false --build-arg VITE_API_URL=https://api…
ARG VITE_API_URL=""
ARG VITE_USE_MOCKS="true"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage: serve static files with nginx (non-root) ------------
# nginx-unprivileged runs as UID 101 (no root) and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
