# Build stage
FROM node:20-slim AS builder
ARG VITE_GEMINI_API_KEY
# Single source of truth for the Gemini API key; mirrors to legacy names for compatibility
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
ENV GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
ENV API_KEY=${VITE_GEMINI_API_KEY}
WORKDIR /app

# Install build tools required for bcrypt native compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

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

# Install build tools for bcrypt in production stage
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Clean up build tools after npm install to reduce image size
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y

# Copy compiled assets and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/database.js ./database.js
COPY --from=builder /app/historicalPrices.js ./historicalPrices.js
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils

# Ensure data directory exists for persistence mounts
RUN mkdir -p /app/data

EXPOSE 8080
CMD ["node", "server.js"]
