# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and seed files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seeds ./seeds

# tsx is needed at runtime to run the seed (TS file)
RUN npm install -g tsx

EXPOSE 5000

CMD ["npm", "run", "start"]
