# Build from the REPO ROOT, not backend/ - scripts/migrate.ts resolves migrations at
# ../../database/migrations relative to itself, so the image needs database/ alongside backend/
# just like the working tree does:
#
#   docker build -f backend/Dockerfile -t spotlight-backend .
#
# Multi-stage: the builder stage has the full toolchain (TypeScript, devDependencies) to compile
# src/ -> dist/; the runtime stage only gets the compiled JS and production dependencies, keeping
# the deployed image free of the source tree and build tooling.

FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/scripts ./scripts
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
# scripts/migrate.ts resolves migrations at <script-dir>/../../database/migrations, i.e.
# /app/scripts/../../database -> /database - matching that layout exactly, not guessing at it.
COPY database /database

# Runs as the non-root "node" user the base image already provides, not root.
USER node

EXPOSE 4000

# scripts/migrate.ts is TypeScript - run it through tsx (a prod dependency) rather than shipping
# a second, ts-node-only image just for one startup command. dist/src/server.js, not
# dist/server.js: tsconfig's rootDir is "." (it also needs to compile scripts/ and tests/), so
# tsc preserves the src/ prefix under dist/ - confirmed by actually building and running it, not
# assumed from the file layout.
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && node dist/src/server.js"]
