# Production Dockerfile for zapdev API Server
FROM oven/bun:1.2.18-alpine as base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the API server
CMD ["bun", "run", "api-dev-server.ts"]
