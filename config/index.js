/**
 * Configuration Index
 * @description Main configuration loader that selects appropriate environment config
 */

const path = require('path');

// Determine environment
const environment = process.env.NODE_ENV || 'development';
const validEnvironments = ['development', 'staging', 'production', 'test'];

if (!validEnvironments.includes(environment)) {
  throw new Error(`Invalid NODE_ENV: ${environment}. Must be one of: ${validEnvironments.join(', ')}`);
}

// Load environment-specific configuration
let config;
try {
  config = require(path.join(__dirname, 'environments', `${environment}.js`));
} catch (error) {
  console.error(`Failed to load configuration for environment: ${environment}`);
  console.error(error.message);
  process.exit(1);
}

// Validate required environment variables
const requiredEnvVars = {
  development: [
    // Minimal requirements for development
  ],
  staging: [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET'
  ],
  production: [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'SENTRY_DSN',
    'NEXT_PUBLIC_APP_URL'
  ]
};

const required = requiredEnvVars[environment] || [];
const missing = required.filter(envVar => !process.env[envVar]);

if (missing.length > 0) {
  console.error(`Missing required environment variables for ${environment}:`);
  missing.forEach(envVar => console.error(`  - ${envVar}`));
  process.exit(1);
}

// Add computed properties
config.computed = {
  isProduction: environment === 'production',
  isStaging: environment === 'staging',
  isDevelopment: environment === 'development',
  isTest: environment === 'test',
  
  // Database connection info
  databaseName: getDatabaseName(config.database?.url),
  
  // Application info
  version: process.env.npm_package_version || config.app.version,
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
  
  // Feature flags computed
  featuresEnabled: Object.entries(config.features || {})
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature),
    
  // Security info
  isSecure: config.security?.https === true,
  
  // Monitoring info
  monitoringEnabled: Boolean(config.monitoring?.sentry?.dsn),
  analyticsEnabled: Boolean(
    config.monitoring?.analytics?.ga4Id || 
    config.monitoring?.analytics?.gtmId
  )
};

// Add utility functions
config.utils = {
  // Get configuration value with fallback
  get: (path, defaultValue) => {
    return getNestedValue(config, path, defaultValue);
  },
  
  // Check if feature is enabled
  isFeatureEnabled: (featureName) => {
    return config.features?.[featureName] === true;
  },
  
  // Get database configuration for specific use case
  getDatabaseConfig: (useCase = 'default') => {
    const dbConfig = { ...config.database };
    
    // Adjust pool size based on use case
    if (useCase === 'migration') {
      dbConfig.pool = { ...dbConfig.pool, max: 1, min: 1 };
    } else if (useCase === 'backup') {
      dbConfig.pool = { ...dbConfig.pool, max: 2, min: 1 };
    }
    
    return dbConfig;
  },
  
  // Get Redis configuration
  getRedisConfig: () => {
    return { ...config.redis };
  },
  
  // Get CORS origins
  getCorsOrigins: () => {
    if (Array.isArray(config.security?.cors?.origin)) {
      return config.security.cors.origin;
    }
    return [config.security?.cors?.origin || config.app.url].filter(Boolean);
  },
  
  // Get email configuration based on provider
  getEmailConfig: () => {
    const emailConfig = { ...config.email };
    const provider = emailConfig.transport;
    
    if (provider === 'sendgrid' && emailConfig.sendgrid?.apiKey) {
      return {
        ...emailConfig,
        provider: 'sendgrid',
        config: emailConfig.sendgrid
      };
    } else if (provider === 'resend' && emailConfig.resend?.apiKey) {
      return {
        ...emailConfig,
        provider: 'resend',
        config: emailConfig.resend
      };
    } else if (provider === 'smtp' && emailConfig.smtp) {
      return {
        ...emailConfig,
        provider: 'smtp',
        config: emailConfig.smtp
      };
    } else if (provider === 'console') {
      return {
        ...emailConfig,
        provider: 'console',
        config: {}
      };
    }
    
    // Fallback to console in development
    if (environment === 'development') {
      return {
        ...emailConfig,
        provider: 'console',
        config: {}
      };
    }
    
    throw new Error(`Invalid email configuration for environment: ${environment}`);
  }
};

// Add validation methods
config.validate = {
  // Validate all configuration
  all: () => {
    const errors = [];
    
    // Validate database configuration
    if (!config.database?.url && environment !== 'development') {
      errors.push('Database URL is required');
    }
    
    // Validate Redis configuration
    if (!config.redis?.url && environment === 'production') {
      errors.push('Redis URL is required in production');
    }
    
    // Validate JWT secret
    if (!config.auth?.jwt?.secret || config.auth.jwt.secret.length < 32) {
      errors.push('JWT secret must be at least 32 characters');
    }
    
    // Validate session secret
    if (!config.auth?.session?.secret || config.auth.session.secret.length < 32) {
      errors.push('Session secret must be at least 32 characters');
    }
    
    // Validate Sentry configuration in production
    if (environment === 'production' && !config.monitoring?.sentry?.dsn) {
      errors.push('Sentry DSN is required in production');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Validate specific service configuration
  service: (serviceName) => {
    const validators = {
      database: () => validateDatabaseConfig(config.database),
      redis: () => validateRedisConfig(config.redis),
      email: () => validateEmailConfig(config.email),
      auth: () => validateAuthConfig(config.auth),
      monitoring: () => validateMonitoringConfig(config.monitoring)
    };
    
    const validator = validators[serviceName];
    if (!validator) {
      return { isValid: false, errors: [`Unknown service: ${serviceName}`] };
    }
    
    return validator();
  }
};

// Helper functions
function getDatabaseName(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}

function getNestedValue(obj, path, defaultValue) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
}

function validateDatabaseConfig(dbConfig) {
  const errors = [];
  
  if (!dbConfig?.url) {
    errors.push('Database URL is required');
  }
  
  if (dbConfig?.pool) {
    if (dbConfig.pool.max < 1) {
      errors.push('Database pool max must be at least 1');
    }
    if (dbConfig.pool.min < 0) {
      errors.push('Database pool min cannot be negative');
    }
    if (dbConfig.pool.max < dbConfig.pool.min) {
      errors.push('Database pool max must be greater than or equal to min');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

function validateRedisConfig(redisConfig) {
  const errors = [];
  
  if (environment === 'production' && !redisConfig?.url) {
    errors.push('Redis URL is required in production');
  }
  
  return { isValid: errors.length === 0, errors };
}

function validateEmailConfig(emailConfig) {
  const errors = [];
  
  if (!emailConfig?.from) {
    errors.push('Email from address is required');
  }
  
  const transport = emailConfig?.transport;
  if (transport === 'smtp' && !emailConfig?.smtp?.host) {
    errors.push('SMTP host is required when using SMTP transport');
  }
  
  if (transport === 'sendgrid' && !emailConfig?.sendgrid?.apiKey) {
    errors.push('SendGrid API key is required when using SendGrid transport');
  }
  
  return { isValid: errors.length === 0, errors };
}

function validateAuthConfig(authConfig) {
  const errors = [];
  
  if (!authConfig?.jwt?.secret || authConfig.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters');
  }
  
  if (!authConfig?.session?.secret || authConfig.session.secret.length < 32) {
    errors.push('Session secret must be at least 32 characters');
  }
  
  return { isValid: errors.length === 0, errors };
}

function validateMonitoringConfig(monitoringConfig) {
  const errors = [];
  
  if (environment === 'production' && !monitoringConfig?.sentry?.dsn) {
    errors.push('Sentry DSN is required in production');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Validate configuration on load
const validation = config.validate.all();
if (!validation.isValid && environment !== 'development') {
  console.error('Configuration validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  
  if (environment === 'production') {
    process.exit(1);
  }
}

// Log configuration summary
if (environment === 'development') {
  console.log(`Configuration loaded for ${environment} environment`);
  console.log(`Features enabled: ${config.computed.featuresEnabled.join(', ') || 'none'}`);
  console.log(`Monitoring: ${config.computed.monitoringEnabled ? 'enabled' : 'disabled'}`);
  console.log(`Analytics: ${config.computed.analyticsEnabled ? 'enabled' : 'disabled'}`);
}

module.exports = config;