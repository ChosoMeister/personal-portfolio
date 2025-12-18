# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy compiled assets and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils

# Ensure data directory exists for persistence mounts
RUN mkdir -p /app/data

EXPOSE 8080
CMD ["node", "server.js"]
