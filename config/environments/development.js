/**
 * Development Environment Configuration
 * @description Configuration settings for local development
 */

module.exports = {
  // Application Settings
  app: {
    name: 'LexChronos',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    port: process.env.PORT || 3000,
    environment: 'development'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://lexchrono:lexchrono@localhost:5432/lexchrono_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'lexchrono_dev',
    username: process.env.DB_USER || 'lexchrono',
    password: process.env.DB_PASSWORD || 'lexchrono_dev_password',
    ssl: process.env.DB_SSL === 'true' || false,
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
      min: 0,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000
    },
    logging: true, // Enable SQL logging in development
    sync: false, // Never use sync in production
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: true,
    family: 4,
    keyPrefix: 'lexchronos:dev:',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000
  },

  // Authentication & Security
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'dev_jwt_secret_key_please_change_in_production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'lexchronos',
      audience: 'lexchronos-users'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'dev_session_secret_please_change',
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
      secure: false, // Allow non-HTTPS in development
      httpOnly: true,
      sameSite: 'lax'
    },
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
      requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
      saltRounds: 10
    }
  },

  // Rate Limiting (Relaxed for development)
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' // Skip for localhost
  },

  // Email Configuration (Development uses console transport)
  email: {
    transport: 'console', // Log emails to console in development
    smtp: {
      host: process.env.EMAIL_SERVER_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    },
    from: process.env.EMAIL_FROM || 'dev@lexchronos.local',
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
      scope: ['openid', 'email', 'profile']
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: ['user:email']
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      scope: ['openid', 'email', 'profile']
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
    }
  },

  // Monitoring & Analytics
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      environment: 'development',
      debug: true,
      tracesSampleRate: 1.0, // 100% sampling in development
      profilesSampleRate: 1.0
    },
    analytics: {
      ga4Id: process.env.GA4_ID,
      gtmId: process.env.GTM_ID,
      fbPixelId: process.env.FB_PIXEL_ID,
      clarityProjectId: process.env.CLARITY_PROJECT_ID,
      posthog: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
      }
    }
  },

  // File Storage
  storage: {
    provider: 'local', // Use local storage in development
    local: {
      uploadDir: './uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/*', 'application/pdf', 'text/*']
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_S3_REGION || 'us-east-1'
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    }
  },

  // Search Configuration
  search: {
    provider: 'memory', // Use in-memory search for development
    elasticsearch: {
      url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID,
      adminApiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      searchApiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
    }
  },

  // Caching Configuration
  cache: {
    redis: {
      ttl: parseInt(process.env.REDIS_CACHE_TTL) || 3600, // 1 hour
      prefix: 'cache:dev:'
    },
    api: {
      ttl: parseInt(process.env.API_CACHE_TTL) || 300, // 5 minutes
      enabled: false // Disable API caching in development
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true' || true,
    format: 'dev', // Morgan format for development
    destination: {
      console: true,
      file: false // Disable file logging in development
    }
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
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    helmet: {
      contentSecurityPolicy: false, // Disable in development
      crossOriginEmbedderPolicy: false
    },
    https: false // HTTP in development
  },

  // WebSocket Configuration
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3001,
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000
  },

  // Development Specific Settings
  development: {
    hotReload: true,
    debugMode: true,
    mockExternalAPIs: true,
    seedDatabase: true,
    showDetailedErrors: true,
    enableProfiling: true,
    bypassAuthentication: false, // Set to true to bypass auth in development
    autoMigrate: true
  }
};