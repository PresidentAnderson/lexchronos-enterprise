/**
 * Production Environment Configuration
 * @description Configuration settings for production environment
 */

module.exports = {
  // Application Settings
  app: {
    name: 'LexChronos',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://lexchronos.com',
    port: process.env.PORT || 3000,
    environment: 'production',
    cluster: process.env.CLUSTER_MODE === 'true'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: true
    },
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 25,
      min: 5,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000
    },
    logging: false, // Disable SQL logging in production
    sync: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true
      },
      // Connection pooling for high availability
      statement_timeout: 60000,
      query_timeout: 60000,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 30000
    }
  },

  // Redis Configuration (High Availability)
  redis: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 300,
    maxRetriesPerRequest: 5,
    lazyConnect: true,
    keepAlive: true,
    family: 4,
    keyPrefix: 'lexchronos:prod:',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 20000,
    commandTimeout: 10000,
    retryDelayOnClusterDown: 300,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 5,
    // Redis Cluster Configuration (if applicable)
    cluster: {
      enableReadyCheck: false,
      redisOptions: {
        password: process.env.REDIS_PASSWORD
      }
    }
  },

  // Authentication & Security
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Short-lived in production
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'lexchronos',
      audience: 'lexchronos-users',
      algorithm: 'HS256'
    },
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 3600000, // 1 hour
      secure: true, // HTTPS only
      httpOnly: true,
      sameSite: 'strict'
    },
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      saltRounds: 14 // Higher security in production
    },
    // Multi-factor authentication
    mfa: {
      enabled: true,
      issuer: 'LexChronos',
      window: 1
    }
  },

  // Rate Limiting (Strict in production)
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    // Custom rate limiting for different endpoints
    apis: {
      auth: { windowMs: 900000, max: 5 }, // 5 attempts per 15 minutes
      upload: { windowMs: 3600000, max: 10 }, // 10 uploads per hour
      search: { windowMs: 60000, max: 60 } // 60 searches per minute
    }
  },

  // Email Configuration
  email: {
    transport: process.env.EMAIL_PROVIDER || 'sendgrid',
    smtp: {
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT) || 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      },
      tls: {
        rejectUnauthorized: true
      }
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM
    },
    from: process.env.EMAIL_FROM || 'noreply@lexchronos.com',
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
    webhookEndpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`,
    // Advanced Stripe settings
    apiVersion: '2023-10-16',
    timeout: 80000,
    maxNetworkRetries: 3
  },

  // Monitoring & Analytics
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      environment: 'production',
      debug: false,
      tracesSampleRate: 0.1, // 10% sampling to reduce overhead
      profilesSampleRate: 0.05, // 5% profiling
      beforeSend: (event) => {
        // Filter out known non-critical errors
        const ignoreErrors = [
          'ChunkLoadError',
          'Network Error',
          'Loading chunk',
          'ResizeObserver loop limit exceeded'
        ];
        
        if (event.exception?.values?.[0]?.value) {
          const errorMessage = event.exception.values[0].value;
          if (ignoreErrors.some(ignore => errorMessage.includes(ignore))) {
            return null;
          }
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
      },
      mixpanel: {
        token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
      }
    },
    // Application Performance Monitoring
    apm: {
      newRelic: {
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
        appName: 'LexChronos Production'
      }
    }
  },

  // File Storage
  storage: {
    provider: 'aws', // Primary storage
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'lexchronos-prod-uploads',
      region: process.env.AWS_S3_REGION || 'us-east-1',
      acl: 'private',
      signedUrlExpires: 3600, // 1 hour
      encryption: 'AES256',
      versioningEnabled: true
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
      transformation: {
        quality: 'auto',
        format: 'auto'
      }
    },
    cdn: {
      enabled: true,
      domain: process.env.CDN_DOMAIN || 'cdn.lexchronos.com'
    }
  },

  // Search Configuration
  search: {
    provider: process.env.SEARCH_PROVIDER || 'elasticsearch',
    elasticsearch: {
      url: process.env.ELASTICSEARCH_URL,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
      index: 'lexchronos-production',
      ssl: {
        rejectUnauthorized: true
      },
      maxRetries: 3,
      requestTimeout: 60000
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID,
      adminApiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      searchApiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
      indexName: 'lexchronos_production'
    }
  },

  // Caching Configuration (Aggressive caching in production)
  cache: {
    redis: {
      ttl: parseInt(process.env.REDIS_CACHE_TTL) || 14400, // 4 hours
      prefix: 'cache:prod:'
    },
    api: {
      ttl: parseInt(process.env.API_CACHE_TTL) || 1800, // 30 minutes
      enabled: true
    },
    cdn: {
      enabled: true,
      ttl: 86400 // 24 hours for static assets
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'warn',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
    format: 'json', // Structured logging for production
    destination: {
      console: false, // Disable console logging in production
      file: {
        enabled: true,
        filename: './logs/production.log',
        maxFiles: 30,
        maxSize: '20m'
      },
      cloudWatch: {
        enabled: process.env.AWS_CLOUDWATCH_ENABLED === 'true',
        logGroup: '/lexchronos/production',
        logStream: process.env.AWS_CLOUDWATCH_LOG_STREAM
      }
    },
    errorReporting: true,
    auditLogging: true
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

  // Security Configuration (Maximum security)
  security: {
    cors: {
      origin: [
        'https://lexchronos.com',
        'https://www.lexchronos.com',
        'https://api.lexchronos.com'
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
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE) || 63072000, // 2 years
        includeSubDomains: true,
        preload: true
      },
      xssFilter: true,
      noSniff: true,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin' }
    },
    https: true,
    trustProxy: true
  },

  // WebSocket Configuration
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3001,
    cors: {
      origin: ['https://lexchronos.com', 'https://www.lexchronos.com'],
      methods: ['GET', 'POST']
    },
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
    connectionTimeout: 20000,
    maxConnections: 10000,
    clustering: true
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    encryption: {
      enabled: true,
      key: process.env.BACKUP_ENCRYPTION_KEY,
      algorithm: 'aes-256-gcm'
    },
    destinations: {
      s3: {
        bucket: process.env.S3_BACKUP_BUCKET || 'lexchronos-prod-backups',
        region: process.env.AWS_S3_REGION || 'us-east-1',
        storageClass: 'STANDARD_IA'
      },
      glacier: {
        enabled: true,
        transitionDays: 30
      }
    },
    verification: true,
    notification: {
      enabled: true,
      email: process.env.BACKUP_NOTIFICATION_EMAIL,
      slack: process.env.BACKUP_NOTIFICATION_SLACK_WEBHOOK
    }
  },

  // Performance Configuration
  performance: {
    compression: {
      enabled: process.env.ENABLE_COMPRESSION !== 'false',
      level: parseInt(process.env.COMPRESSION_LEVEL) || 9 // Maximum compression
    },
    minification: true,
    bundleAnalyzer: false,
    optimization: {
      splitChunks: true,
      runtimeChunk: true,
      sideEffects: false
    }
  },

  // Health Check Configuration
  health: {
    enabled: true,
    endpoint: '/api/health',
    interval: 30000, // 30 seconds
    timeout: 10000, // 10 seconds
    checks: {
      database: true,
      redis: true,
      externalAPIs: true,
      fileSystem: true
    }
  },

  // API Configuration
  api: {
    version: 'v1',
    timeout: 30000, // 30 seconds
    maxRequestSize: '10mb',
    documentation: {
      enabled: false, // Disable API docs in production
      path: '/api/docs'
    }
  },

  // Production Specific Settings
  production: {
    cluster: {
      enabled: process.env.CLUSTER_MODE === 'true',
      workers: process.env.CLUSTER_WORKERS || 'auto'
    },
    gracefulShutdown: {
      enabled: true,
      timeout: 30000 // 30 seconds
    },
    healthChecks: true,
    monitoring: true,
    alerting: {
      enabled: true,
      channels: {
        email: process.env.ALERT_EMAIL,
        slack: process.env.ALERT_SLACK_WEBHOOK,
        pagerduty: process.env.PAGERDUTY_API_KEY
      }
    }
  }
};