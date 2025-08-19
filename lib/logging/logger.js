/**
 * Structured Logger for LexChronos
 * @description Centralized logging with multiple transports and structured format
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logger = null;
    this.config = null;
    this.requestLogger = null;
    this.init();
  }

  init() {
    // Load configuration
    try {
      this.config = require('../../config');
    } catch (error) {
      // Fallback configuration if config not available
      this.config = {
        app: { environment: process.env.NODE_ENV || 'development' },
        logging: {
          level: process.env.LOG_LEVEL || 'info',
          format: process.env.NODE_ENV === 'production' ? 'json' : 'dev',
          destination: {
            console: true,
            file: { enabled: true, filename: './logs/app.log' }
          }
        }
      };
    }

    this.createLogger();
    this.createRequestLogger();
  }

  createLogger() {
    const { level, format: logFormat, destination } = this.config.logging;

    // Define log formats
    const formats = {
      dev: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, service, userId, requestId, ...meta }) => {
          let log = `${timestamp} [${level}]`;
          
          if (service) log += ` [${service}]`;
          if (requestId) log += ` [${requestId}]`;
          if (userId) log += ` [user:${userId}]`;
          
          log += `: ${message}`;
          
          // Add metadata if present
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          
          return log;
        })
      ),
      
      json: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf((info) => {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            message: info.message,
            service: info.service || 'lexchronos',
            environment: this.config.app.environment,
            requestId: info.requestId,
            userId: info.userId,
            stack: info.stack,
            ...info
          });
        })
      )
    };

    // Create transports
    const transports = [];

    // Console transport
    if (destination.console) {
      transports.push(new winston.transports.Console({
        level,
        format: formats[logFormat] || formats.dev,
        handleExceptions: true,
        handleRejections: true
      }));
    }

    // File transport
    if (destination.file?.enabled) {
      const fileTransport = new winston.transports.File({
        filename: path.resolve(destination.file.filename || './logs/app.log'),
        level,
        format: formats.json, // Always use JSON for file logs
        maxsize: destination.file.maxSize ? this.parseSize(destination.file.maxSize) : 50 * 1024 * 1024, // 50MB
        maxFiles: destination.file.maxFiles || 5,
        handleExceptions: true,
        handleRejections: true
      });
      transports.push(fileTransport);

      // Error log file
      transports.push(new winston.transports.File({
        filename: path.resolve('./logs/error.log'),
        level: 'error',
        format: formats.json,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10
      }));
    }

    // CloudWatch transport (if configured)
    if (destination.cloudWatch?.enabled && process.env.NODE_ENV === 'production') {
      try {
        const WinstonCloudWatch = require('winston-cloudwatch');
        transports.push(new WinstonCloudWatch({
          logGroupName: destination.cloudWatch.logGroup || '/lexchronos/application',
          logStreamName: destination.cloudWatch.logStream || `${this.config.app.environment}-${new Date().toISOString().split('T')[0]}`,
          awsRegion: process.env.AWS_REGION || 'us-east-1',
          jsonMessage: true,
          level,
          retentionInDays: 30
        }));
      } catch (error) {
        console.warn('CloudWatch logging not available:', error.message);
      }
    }

    // Create the logger
    this.logger = winston.createLogger({
      level,
      transports,
      exitOnError: false,
      defaultMeta: {
        service: 'lexchronos',
        environment: this.config.app.environment,
        version: this.config.app.version || '1.0.0',
        pid: process.pid,
        hostname: require('os').hostname()
      }
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.resolve('./logs/exceptions.log'),
        format: formats.json,
        maxsize: 50 * 1024 * 1024,
        maxFiles: 5
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.resolve('./logs/rejections.log'),
        format: formats.json,
        maxsize: 50 * 1024 * 1024,
        maxFiles: 5
      })
    );
  }

  createRequestLogger() {
    const morgan = require('morgan');

    // Custom token for request ID
    morgan.token('requestId', (req) => req.requestId || 'unknown');
    morgan.token('userId', (req) => req.user?.id || 'anonymous');
    morgan.token('realIp', (req) => {
      return req.headers['cf-connecting-ip'] || 
             req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress;
    });

    // Define formats
    const formats = {
      dev: ':method :url :status :res[content-length] - :response-time ms [:requestId] [:userId]',
      combined: ':realIp - :userId [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :requestId :response-time'
    };

    const format = this.config.logging.format === 'json' ? 'combined' : 'dev';

    this.requestLogger = morgan(formats[format], {
      stream: {
        write: (message) => {
          this.logger.info(message.trim(), {
            type: 'http_request',
            service: 'http'
          });
        }
      },
      skip: (req, res) => {
        // Skip health check requests in production
        if (this.config.app.environment === 'production' && req.url === '/api/health') {
          return true;
        }
        return false;
      }
    });
  }

  parseSize(size) {
    const match = size.match(/^(\d+)(k|m|g)?$/i);
    if (!match) return 50 * 1024 * 1024; // Default 50MB
    
    const value = parseInt(match[1]);
    const unit = (match[2] || '').toLowerCase();
    
    switch (unit) {
      case 'k': return value * 1024;
      case 'm': return value * 1024 * 1024;
      case 'g': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  // Main logging methods
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Specialized logging methods
  security(message, meta = {}) {
    this.logger.warn(message, { ...meta, category: 'security' });
  }

  audit(message, meta = {}) {
    this.logger.info(message, { ...meta, category: 'audit' });
  }

  performance(message, meta = {}) {
    this.logger.info(message, { ...meta, category: 'performance' });
  }

  database(message, meta = {}) {
    this.logger.debug(message, { ...meta, category: 'database' });
  }

  api(message, meta = {}) {
    this.logger.info(message, { ...meta, category: 'api' });
  }

  // Context-aware logging
  child(context = {}) {
    return {
      error: (message, meta = {}) => this.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
      security: (message, meta = {}) => this.security(message, { ...context, ...meta }),
      audit: (message, meta = {}) => this.audit(message, { ...context, ...meta }),
      performance: (message, meta = {}) => this.performance(message, { ...context, ...meta }),
      database: (message, meta = {}) => this.database(message, { ...context, ...meta }),
      api: (message, meta = {}) => this.api(message, { ...context, ...meta })
    };
  }

  // Express middleware for request logging
  requestMiddleware() {
    return this.requestLogger;
  }

  // Express middleware for request ID and context
  contextMiddleware() {
    const { v4: uuidv4 } = require('uuid');
    
    return (req, res, next) => {
      // Generate request ID
      req.requestId = req.headers['x-request-id'] || uuidv4();
      res.set('x-request-id', req.requestId);

      // Create request-scoped logger
      req.logger = this.child({
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });

      // Log request start
      req.logger.debug('Request started', {
        headers: req.headers,
        query: req.query,
        params: req.params
      });

      // Track response
      const originalSend = res.send;
      res.send = function(data) {
        req.logger.debug('Request completed', {
          statusCode: res.statusCode,
          responseSize: data ? data.length : 0
        });
        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Graceful shutdown
  async close() {
    if (this.logger) {
      this.logger.info('Logger shutting down gracefully');
      return new Promise((resolve) => {
        this.logger.on('finish', resolve);
        this.logger.end();
      });
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and the class
module.exports = logger;
module.exports.Logger = Logger;