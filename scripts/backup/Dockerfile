# Backup Service Dockerfile
FROM node:20-alpine

# Install required system dependencies
RUN apk add --no-cache \
    postgresql-client \
    aws-cli \
    tar \
    gzip \
    curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY scripts/backup/ ./scripts/backup/
COPY config/ ./config/
COPY lib/ ./lib/

# Create backup directory
RUN mkdir -p /backups

# Set permissions
RUN chmod +x ./scripts/backup/backup.js

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node ./scripts/backup/backup.js health || exit 1

# Default command
CMD ["node", "./scripts/backup/backup.js", "full"]