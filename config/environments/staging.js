/**
 * Staging Environment Configuration
 * @description Configuration settings for staging/pre-production environment
 */

module.exports = {
  // Application Settings
  app: {
    name: 'LexChronos',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://staging.lexchronos.com',
    port: process.env.PORT || 3000,
    environment: 'staging'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 15,
      min: 2,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000
    },
    logging: process.env.NODE_ENV === 'development', // Conditional logging
    sync: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
    lazyConnect: true,
    keepAlive: true,
    family: 4,
    keyPrefix: 'lexchronos:staging:',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    commandTimeout: 5000,
    retryDelayOnClusterDown: 300,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },

  // Authentication & Security
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '4h', // Shorter in staging
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '24h',
      issuer: 'lexchronos',
      audience: 'lexchronos-users',
      algorithm: 'HS256'
    },
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 14400000, // 4 hours
      secure: true, // HTTPS only
      httpOnly: true,
      sameSite: 'strict'
    },
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
      saltRounds: 12
    }
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Email Configuration
  email: {
    transport: 'smtp',
    smtp: {
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM
    },
    from: process.env.EMAIL_FROM || 'staging@lexchronos.com',
    templates: {
      path: './emails/templates',
      options: {
        extension: 'hbs',
        layoutsDir: './emails/layouts',
        partialsDir: './emails/partials'
      }
    }
  },

  // OAuth Providers
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: ['openid', 'email', 'profile'],
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: ['user:email'],
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      scope: ['openid', 'email', 'profile'],
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/microsoft`
    }
  },

  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      basic: process.env.STRIPE_PRICE_ID_BASIC,
      premium: process.env.STRIPE_PRICE_ID_PREMIUM,
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE
    },
    webhookEndpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
  },

  // Monitoring & Analytics
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      environment: 'staging',
      debug: false,
      tracesSampleRate: 0.2, // 20% sampling in staging
      profilesSampleRate: 0.2,
      beforeSend: (event) => {
        // Filter out non-critical errors in staging
        if (event.level === 'info' || event.level === 'debug') {
          return null;
        }
        return event;
      }
    },
    analytics: {
      ga4Id: process.env.GA4_ID,
      gtmId: process.env.GTM_ID,
      fbPixelId: process.env.FB_PIXEL_ID,
      clarityProjectId: process.env.CLARITY_PROJECT_ID,
      posthog: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        debug: false
      }
    }
  },

  // File Storage
  storage: {
    provider: 'aws', // Use cloud storage in staging
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'lexchronos-staging-uploads',
      region: process.env.AWS_S3_REGION || 'us-east-1',
      acl: 'private',
      signedUrlExpires: 3600 // 1 hour
    },
    local: {
      uploadDir: './uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/*', 'application/pdf', 'text/*']
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    }
  },

  // Search Configuration
  search: {
    provider: process.env.SEARCH_PROVIDER || 'elasticsearch',
    elasticsearch: {
      url: process.env.ELASTICSEARCH_URL,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
      index: 'lexchronos-staging'
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID,
      adminApiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      searchApiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
      indexName: 'lexchronos_staging'
    }
  },

  // Caching Configuration
  cache: {
    redis: {
      ttl: parseInt(process.env.REDIS_CACHE_TTL) || 7200, // 2 hours
      prefix: 'cache:staging:'
    },
    api: {
      ttl: parseInt(process.env.API_CACHE_TTL) || 600, // 10 minutes
      enabled: true
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    format: 'combined',
    destination: {
      console: true,
      file: {
        enabled: true,
        filename: './logs/staging.log',
        maxFiles: 5,
        maxSize: '10m'
      }
    },
    errorReporting: true
  },

  // Feature Flags
  features: {
    realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES !== 'false',
    advancedSearch: process.env.FEATURE_ADVANCED_SEARCH !== 'false',
    analyticsDashboard: process.env.FEATURE_ANALYTICS_DASHBOARD !== 'false',
    multiTenant: process.env.FEATURE_MULTI_TENANT === 'true',
    apiRateLimiting: process.env.FEATURE_API_RATE_LIMITING !== 'false',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
  },

  // Security Configuration
  security: {
    cors: {
      origin: [
        'https://staging.lexchronos.com',
        'https://staging-api.lexchronos.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 200
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-eval'", "https:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
        includeSubDomains: true
      }
    },
    https: true
  },

  // WebSocket Configuration
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3001,
    cors: {
      origin: 'https://staging.lexchronos.com',
      methods: ['GET', 'POST']
    },
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
    connectionTimeout: 20000,
    maxConnections: 1000
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
    encryption: {
      enabled: true,
      key: process.env.BACKUP_ENCRYPTION_KEY
    },
    destinations: {
      s3: {
        bucket: process.env.S3_BACKUP_BUCKET || 'lexchronos-staging-backups',
        region: process.env.AWS_S3_REGION || 'us-east-1'
      }
    }
  },

  // Performance Configuration
  performance: {
    compression: {
      enabled: process.env.ENABLE_COMPRESSION !== 'false',
      level: parseInt(process.env.COMPRESSION_LEVEL) || 6
    },
    minification: true,
    bundleAnalyzer: process.env.ANALYZE_BUNDLE === 'true'
  },

  // Staging Specific Settings
  staging: {
    resetDatabase: false, // Set to true to reset DB on deployment
    mockExternalAPIs: false,
    testDataGeneration: true,
    allowTestUsers: true,
    debugPanel: true,
    performanceMonitoring: true
  }
};