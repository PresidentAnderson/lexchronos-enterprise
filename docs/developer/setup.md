# Development Environment Setup

Complete guide to setting up LexChronos for local development.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Installation](#application-installation)
5. [Development Tools](#development-tools)
6. [Testing Setup](#testing-setup)
7. [IDE Configuration](#ide-configuration)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

**Operating System:**
- macOS 10.15+ or Ubuntu 18.04+ or Windows 10+
- Git 2.28+
- Docker & Docker Compose (optional but recommended)

**Required Software:**

```bash
# Node.js (LTS version)
Node.js 18.17.0 or later
npm 9.0.0 or later (or yarn 1.22.0+)

# Database
PostgreSQL 14.0+
Redis 6.2+

# Optional (for containerized development)
Docker 20.10+
Docker Compose 2.0+
```

### Hardware Requirements

**Minimum:**
- RAM: 8GB
- Storage: 10GB free space
- CPU: 2 cores

**Recommended:**
- RAM: 16GB
- Storage: 20GB free space (SSD preferred)
- CPU: 4+ cores

## 🌍 Environment Setup

### 1. Install Node.js

**Using Node Version Manager (Recommended):**

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows - install nvm-windows from GitHub releases
# https://github.com/coreybutler/nvm-windows

# Restart terminal, then:
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x
```

**Direct Installation:**
- Download from [nodejs.org](https://nodejs.org/)
- Install LTS version (18.x)

### 2. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14

# Create database user
createuser -s lexchrono
createdb lexchrono_dev -O lexchrono
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE USER lexchrono WITH PASSWORD 'your_password';
CREATE DATABASE lexchrono_dev OWNER lexchrono;
GRANT ALL PRIVILEGES ON DATABASE lexchrono_dev TO lexchrono;
\q
```

**Windows:**
- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer and follow setup wizard
- Use pgAdmin to create database and user

**Docker Alternative:**
```bash
docker run --name lexchrono-postgres \
  -e POSTGRES_DB=lexchrono_dev \
  -e POSTGRES_USER=lexchrono \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:14
```

### 3. Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
- Download from [Redis releases](https://github.com/tporadowski/redis/releases)
- Or use WSL with Linux instructions

**Docker Alternative:**
```bash
docker run --name lexchrono-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

## 🗄️ Database Configuration

### Environment Variables

Create environment files for different environments:

```bash
# Create environment files
cp .env.example .env.local
cp .env.example .env.test
```

**Edit `.env.local`:**
```env
# Database Configuration
DATABASE_URL="postgresql://lexchrono:your_password@localhost:5432/lexchrono_dev"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# Server Configuration
PORT=3000
NODE_ENV=development

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="104857600" # 100MB

# Email Configuration (Development)
EMAIL_FROM="noreply@lexchronos.local"
SMTP_HOST="localhost"
SMTP_PORT="1025"

# Feature Flags
ENABLE_DOCUMENT_COLLABORATION=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_REAL_TIME_SEARCH=true
ENABLE_ACTIVITY_FEED=true
ENABLE_PRESENCE_INDICATORS=true

# Analytics (Development - use test keys)
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
GTM_ID="GTM-XXXXXXX"
CLARITY_PROJECT_ID="xxxxxxxx"

# Stripe (Development - use test keys)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Sentry (Optional for error tracking)
SENTRY_DSN="https://your-sentry-dsn"
SENTRY_ENVIRONMENT="development"
```

**Edit `.env.test`:**
```env
# Test Database
DATABASE_URL="postgresql://lexchrono:your_password@localhost:5432/lexchrono_test"
REDIS_URL="redis://localhost:6379/1"

# Test JWT Secrets
JWT_SECRET="test-jwt-secret"
JWT_REFRESH_SECRET="test-refresh-secret"

# Test Configuration
NODE_ENV=test
PORT=3001

# Disable external services in tests
ENABLE_ANALYTICS=false
ENABLE_EMAIL=false
ENABLE_WEBHOOKS=false
```

### Database Initialization

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data (optional)
npx prisma db seed
```

## 📦 Application Installation

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/lexchrono.git
cd lexchrono

# Install dependencies
npm install

# Or using yarn
yarn install
```

### 2. Verify Installation

```bash
# Check all dependencies are installed
npm list --depth=0

# Verify database connection
npx prisma db pull

# Test Redis connection
redis-cli ping
```

### 3. Start Development Server

```bash
# Start the development server
npm run dev

# Or with specific port
PORT=3000 npm run dev

# The server will start on http://localhost:3000
```

**Expected Output:**
```
✓ Ready on http://localhost:3000
✓ Database connected
✓ Redis connected
✓ Socket.IO server listening
```

## 🛠️ Development Tools

### Package Manager

**npm Scripts:**
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

### Code Quality Tools

**ESLint Configuration:**
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

**TypeScript Checking:**
```bash
# Type checking
npm run type-check

# Watch mode
npm run type-check -- --watch
```

**Prettier (Code Formatting):**
```bash
# Format code
npx prettier --write .

# Check formatting
npx prettier --check .
```

### Database Tools

**Prisma Studio (Database GUI):**
```bash
# Open Prisma Studio
npm run db:studio

# Access at http://localhost:5555
```

**Database Management:**
```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Seed database with sample data
npm run db:seed

# View current schema
npx prisma introspect
```

## 🧪 Testing Setup

### Test Environment

**Install Testing Dependencies:**
```bash
# Already included in package.json, but if needed:
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev cypress @cypress/webpack-dev-server
npm install --save-dev @playwright/test
```

**Create Test Database:**
```bash
# Create test database
createdb lexchrono_test -O lexchrono

# Run migrations on test database
DATABASE_URL="postgresql://lexchrono:password@localhost:5432/lexchrono_test" npx prisma migrate deploy
```

### Running Tests

**Unit Tests:**
```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Integration Tests:**
```bash
# Run API integration tests
npm run test:integration

# Run specific test file
npm test -- auth.test.ts
```

**End-to-End Tests:**
```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests (interactive)
npm run test:e2e:dev

# Run specific test
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

**Performance Tests:**
```bash
# Run Lighthouse CI
npm run test:lighthouse

# Run custom performance tests
npm run test:performance
```

## 💻 IDE Configuration

### Visual Studio Code

**Recommended Extensions:**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-typescript.typescript",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

**Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

**Launch Configuration (`.vscode/launch.json`):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "ready on http://localhost:([0-9]+)",
        "uriFormat": "http://localhost:%s",
        "action": "openExternally"
      }
    }
  ]
}
```

### IntelliJ IDEA / WebStorm

**File Types:**
- Associate `.prisma` files with Database language
- Enable TypeScript service
- Configure Prettier as default formatter

**Run Configurations:**
```javascript
// Package.json script: dev
// Working directory: project root
// Environment: NODE_ENV=development
```

## 🐳 Docker Development (Optional)

### Docker Compose Setup

**Create `docker-compose.dev.yml`:**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://lexchrono:password@postgres:5432/lexchrono_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: lexchrono_dev
      POSTGRES_USER: lexchrono
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Dockerfile.dev:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

**Start Development Environment:**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## 🔧 Troubleshooting

### Common Issues

**1. Port Already in Use:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

**2. Database Connection Issues:**
```bash
# Test PostgreSQL connection
psql -h localhost -U lexchrono -d lexchrono_dev

# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql     # Linux

# Reset Prisma client
rm -rf node_modules/.prisma
npx prisma generate
```

**3. Redis Connection Issues:**
```bash
# Test Redis connection
redis-cli ping

# Check if Redis is running
brew services list | grep redis  # macOS
sudo systemctl status redis     # Linux
```

**4. Node Modules Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**5. TypeScript Errors:**
```bash
# Restart TypeScript service in IDE
# Or run type check manually
npm run type-check

# Clear TypeScript cache
rm -rf .next
npm run build
```

### Development Tips

**1. Hot Reload Issues:**
- Ensure file watchers are not at system limit
- Restart development server
- Check for conflicting processes

**2. Database Schema Changes:**
```bash
# After modifying Prisma schema
npx prisma migrate dev --name your_change_description
npx prisma generate
```

**3. Environment Variables:**
- Restart server after changing `.env` files
- Use `console.log(process.env.VARIABLE_NAME)` to debug
- Ensure no trailing spaces in `.env` values

**4. Performance Issues:**
- Close unnecessary applications
- Use `npm run build` to test production build
- Check for memory leaks in browser dev tools

## 📚 Next Steps

**Once setup is complete:**

1. **Explore the Codebase:**
   - Review [Architecture Guide](./architecture.md)
   - Check [API Reference](./api-reference.md)
   - Study [Database Schema](./database-schema.md)

2. **Make Your First Change:**
   - Create a feature branch
   - Make a small change
   - Run tests
   - Submit a pull request

3. **Learn the Development Workflow:**
   - Read [Contributing Guidelines](../../CONTRIBUTING.md)
   - Understand the Git workflow
   - Join the developer community

**Happy coding!** 🚀