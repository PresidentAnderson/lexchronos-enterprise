# Deployment Guide

Comprehensive guide for deploying LexChronos to production environments.

## 📋 Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Configuration](#environment-configuration)
3. [Vercel Deployment](#vercel-deployment)
4. [Railway Deployment](#railway-deployment)
5. [Docker Deployment](#docker-deployment)
6. [AWS Deployment](#aws-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)

## 🌐 Deployment Overview

### Recommended Architecture

**Production Stack:**
- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Railway (PostgreSQL + Redis)
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Custom metrics
- **Analytics**: Google Analytics 4 + Microsoft Clarity

**Alternative Stacks:**
- **Self-hosted**: Docker Compose
- **AWS**: ECS/Fargate + RDS
- **Google Cloud**: Cloud Run + Cloud SQL
- **Azure**: Container Apps + PostgreSQL

### Prerequisites

```bash
# Required tools
node --version    # v18.0.0+
npm --version     # v9.0.0+
git --version     # v2.28.0+
docker --version  # v20.10.0+ (optional)

# Required accounts
- Vercel account
- Railway account (or cloud provider)
- Domain registrar access
- SSL certificate provider
```

## ⚙️ Environment Configuration

### Production Environment Variables

Create `.env.production`:

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL="postgresql://username:password@host:5432/lexchrono_prod"
REDIS_URL="redis://username:password@host:6379"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-32-chars-min"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-32-chars-min"

# Security
ENCRYPTION_PASSWORD="your-encryption-password"
ENCRYPTION_SALT="your-encryption-salt"

# Email (Production SMTP)
EMAIL_FROM="noreply@yourdomain.com"
SMTP_HOST="smtp.yourmailprovider.com"
SMTP_PORT=587
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
SMTP_SECURE=false

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="104857600"
# Or use cloud storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"

# Stripe (Production keys)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
GTM_ID="GTM-XXXXXXX"
CLARITY_PROJECT_ID="xxxxxxxx"
FACEBOOK_PIXEL_ID="xxxxxxxxxxxxxxx"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT="production"

# External Services
OPENAI_API_KEY="sk-..." # For AI features
TWILIO_ACCOUNT_SID="your-twilio-sid" # For SMS
TWILIO_AUTH_TOKEN="your-twilio-token"

# Feature Flags
ENABLE_DOCUMENT_COLLABORATION=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_REAL_TIME_SEARCH=true
ENABLE_ACTIVITY_FEED=true
ENABLE_PRESENCE_INDICATORS=true
ENABLE_ANALYTICS=true
```

### Security Checklist

```bash
# 1. Secure secrets management
# Store secrets in environment-specific secure storage
# Never commit secrets to version control
# Rotate secrets regularly

# 2. SSL/TLS Configuration
# Use valid SSL certificates
# Enable HSTS headers
# Configure secure cipher suites

# 3. Database Security
# Use strong passwords
# Enable SSL connections
# Configure firewall rules
# Regular security updates

# 4. Application Security
# Enable security headers
# Configure CORS properly
# Implement rate limiting
# Monitor for vulnerabilities
```

## 🚀 Vercel Deployment

### Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel

# Follow prompts:
# ? Set up and deploy "lexchrono"? [Y/n] y
# ? Which scope? your-team
# ? Link to existing project? [y/N] n
# ? What's your project's name? lexchrono
# ? In which directory is your code located? ./
```

### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/backups",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Deployment Script

Create `scripts/deploy-vercel.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting Vercel deployment..."

# Verify analytics are implemented
if ! ./scripts/verify-analytics.sh; then
  echo "❌ Analytics verification failed. Deployment aborted."
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Run security scan
echo "🔒 Running security scan..."
npm audit --audit-level=moderate

# Build and test production build locally
echo "🏗️ Testing production build..."
npm run build

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
if [ "$1" = "production" ]; then
  vercel --prod
else
  vercel
fi

echo "✅ Deployment complete!"
```

### Environment Variables Setup

```bash
# Set environment variables in Vercel
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add STRIPE_SECRET_KEY production
# ... add all production environment variables

# For staging environment
vercel env add DATABASE_URL preview
vercel env add JWT_SECRET preview
# ... add staging variables
```

### Custom Domain Setup

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS (add these records to your DNS provider)
# A record: @ -> 76.76.19.19
# CNAME record: www -> cname.vercel-dns.com

# Enable automatic HTTPS (handled by Vercel)
```

## 🚂 Railway Deployment

### Database Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Add PostgreSQL database
railway add postgresql

# Add Redis cache
railway add redis

# Get connection strings
railway variables
```

### Railway Configuration

Create `railway.json`:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build",
    "startCommand": "npm start"
  },
  "deploy": {
    "restartPolicyType": "always",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30
  }
}
```

### Database Migration

```bash
# Run migrations on Railway
railway run npx prisma migrate deploy

# Seed production database (if needed)
railway run npx prisma db seed

# Generate Prisma client
railway run npx prisma generate
```

### Environment Variables

```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set STRIPE_SECRET_KEY="sk_live_..."

# Import from file
railway variables set --from-file .env.production
```

## 🐳 Docker Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S lexchrono -u 1001

# Copy built application
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Set permissions
USER lexchrono

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://lexchrono:${POSTGRES_PASSWORD}@postgres:5432/lexchrono
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=lexchrono
      - POSTGRES_USER=lexchrono
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lexchrono"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API rate limiting
        location /api/auth {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## ☁️ AWS Deployment

### ECS with Fargate

```yaml
# aws/task-definition.json
{
  "family": "lexchrono",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "lexchrono",
      "image": "your-account.dkr.ecr.region.amazonaws.com/lexchrono:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:region:account:parameter/lexchrono/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:region:account:parameter/lexchrono/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/lexchrono",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Terraform Infrastructure

```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "lexchrono-vpc"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "lexchrono-postgres"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "lexchrono"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
  
  tags = {
    Name = "lexchrono-postgres"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "lexchrono-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "lexchrono-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  tags = {
    Name = "lexchrono-redis"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "lexchrono"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "lexchrono-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = {
    Name = "lexchrono-alb"
  }
}
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]
  
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: lexchrono

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Update ECS service
      run: |
        # Update task definition with new image
        aws ecs describe-task-definition --task-definition lexchrono \
          --query taskDefinition > task-definition.json
        
        # Update image URI
        jq --arg IMAGE "${{ steps.build-image.outputs.image }}" \
           '.containerDefinitions[0].image = $IMAGE' \
           task-definition.json > updated-task-definition.json
        
        # Register new task definition
        aws ecs register-task-definition \
          --cli-input-json file://updated-task-definition.json
        
        # Update service
        aws ecs update-service \
          --cluster lexchrono \
          --service lexchrono \
          --task-definition lexchrono
          
        # Wait for deployment to complete
        aws ecs wait services-stable \
          --cluster lexchrono \
          --services lexchrono
```

## 📊 Monitoring & Maintenance

### Health Checks

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import Redis from 'ioredis'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: false,
      redis: false,
      external_services: false
    },
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  }

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = true
  } catch (error) {
    checks.status = 'unhealthy'
    console.error('Database health check failed:', error)
  }

  try {
    // Redis check
    const redis = new Redis(process.env.REDIS_URL!)
    await redis.ping()
    redis.disconnect()
    checks.checks.redis = true
  } catch (error) {
    checks.status = 'unhealthy'
    console.error('Redis health check failed:', error)
  }

  try {
    // External services check (example: Stripe)
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    })
    checks.checks.external_services = response.ok
  } catch (error) {
    checks.status = 'degraded'
    console.error('External services check failed:', error)
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
```

### Application Monitoring

```typescript
// lib/monitoring/metrics.ts
class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Map<string, number> = new Map()

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0
    this.metrics.set(metric, current + value)
  }

  gauge(metric: string, value: number): void {
    this.metrics.set(metric, value)
  }

  async reportMetrics(): Promise<void> {
    // Send metrics to monitoring service
    if (process.env.DATADOG_API_KEY) {
      await this.sendToDatadog()
    }
    
    if (process.env.CLOUDWATCH_ENABLED) {
      await this.sendToCloudWatch()
    }
  }

  private async sendToCloudWatch(): Promise<void> {
    const cloudwatch = new AWS.CloudWatch()
    
    const metricData = Array.from(this.metrics.entries()).map(([name, value]) => ({
      MetricName: name,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }))

    await cloudwatch.putMetricData({
      Namespace: 'LexChronos',
      MetricData: metricData
    }).promise()
  }
}
```

### Database Maintenance

```sql
-- Daily maintenance script
-- scripts/db-maintenance.sql

-- Update table statistics
ANALYZE;

-- Vacuum tables to reclaim space
VACUUM (ANALYZE, VERBOSE);

-- Reindex if needed
REINDEX DATABASE lexchrono;

-- Clean up old audit logs (keep 1 year)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Clean up expired sessions
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- Update search indexes
REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
```

## 🔄 Rollback Procedures

### Quick Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

PREVIOUS_VERSION=${1:-$(git rev-parse HEAD~1)}

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Vercel rollback
if [ "$DEPLOYMENT_TARGET" = "vercel" ]; then
  vercel rollback --yes
fi

# Railway rollback
if [ "$DEPLOYMENT_TARGET" = "railway" ]; then
  railway rollback $PREVIOUS_VERSION
fi

# Docker rollback
if [ "$DEPLOYMENT_TARGET" = "docker" ]; then
  docker-compose down
  git checkout $PREVIOUS_VERSION
  docker-compose up -d
fi

# Database rollback (if needed)
if [ "$ROLLBACK_DATABASE" = "true" ]; then
  echo "⚠️ Rolling back database migrations"
  npx prisma migrate reset --force
  npx prisma migrate deploy
fi

echo "✅ Rollback completed successfully"
```

### Deployment Verification

```bash
#!/bin/bash
# scripts/verify-deployment.sh

set -e

APP_URL=${1:-"https://app.lexchronos.com"}

echo "🔍 Verifying deployment at $APP_URL"

# Health check
response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health")
if [ "$response" != "200" ]; then
  echo "❌ Health check failed (HTTP $response)"
  exit 1
fi

# Database connectivity
response=$(curl -s "$APP_URL/api/health" | jq -r '.checks.database')
if [ "$response" != "true" ]; then
  echo "❌ Database connectivity failed"
  exit 1
fi

# Redis connectivity
response=$(curl -s "$APP_URL/api/health" | jq -r '.checks.redis')
if [ "$response" != "true" ]; then
  echo "❌ Redis connectivity failed"
  exit 1
fi

# Analytics verification
if ! ./scripts/verify-analytics.sh "$APP_URL"; then
  echo "❌ Analytics verification failed"
  exit 1
fi

echo "✅ Deployment verification successful"
```

This deployment guide covers multiple deployment strategies and provides production-ready configurations for scaling LexChronos across different infrastructure providers.