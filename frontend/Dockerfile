# ── Development ──────────────────────────────────────────────────────────────
# Vite dev server with HMR. Source is mounted as a volume at runtime (see
# docker-compose.dev.yml), so this stage only installs dependencies.
FROM node:24-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:1.29-alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
