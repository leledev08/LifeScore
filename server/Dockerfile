FROM node:20-alpine AS base
WORKDIR /app

# Install deps for all workspaces
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm ci --workspace=shared --workspace=server

# Build shared types
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Build server
COPY server/ ./server/
RUN npm run build --workspace=server

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm ci --workspace=shared --workspace=server --omit=dev

COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/server/dist ./server/dist

# Copy migration SQL files
COPY server/src/db/migrations ./server/dist/db/migrations

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
