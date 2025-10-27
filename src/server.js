const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import configurations
const databaseConfig = require('./config/database');
const logger = require('./config/logger');
const { corsConfig, securityMiddleware } = require('./config/security');
const { globalErrorHandler, handleNotFound, handleUncaughtException, handleUnhandledRejection } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const formationRoutes = require('./routes/formationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedRoutes = require('./routes/seed');

/**
 * Express Application
 * 
 * This is the main server file with production-ready configurations
 * including security, logging, error handling, and performance optimizations.
 */

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    
    // Initialize server
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
  }

  /**
   * Initialize middleware
   */
  initializeMiddlewares() {
    // Trust proxy (for rate limiting and IP detection)
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(securityMiddleware);

    // CORS
    this.app.use(cors(corsConfig));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev', { stream: logger.stream }));
    } else {
      this.app.use(morgan('combined', { stream: logger.stream }));
    }

    // Request logging
    this.app.use((req, res, next) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  /**
   * Initialize routes
   */
  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/events', eventRoutes);
    this.app.use('/api/formations', formationRoutes);
    this.app.use('/api/services', serviceRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/seed', seedRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Campus Teranga API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        documentation: '/api/docs',
        health: '/health',
      });
    });

    // Handle 404 routes
    this.app.all('*', handleNotFound);
  }

  /**
   * Initialize error handling
   */
  initializeErrorHandling() {
    this.app.use(globalErrorHandler);
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    try {
      await databaseConfig.connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      process.exit(1);
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Handle uncaught exceptions and unhandled rejections
      handleUncaughtException();
      handleUnhandledRejection();

      // Start server
      this.app.listen(this.port, this.host, () => {
        logger.info(`🚀 Server running on ${this.host}:${this.port}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📊 Health check: http://${this.host}:${this.port}/health`);
        logger.info(`📱 iOS Simulator access: http://192.168.1.2:${this.port}/api`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown);
      process.on('SIGINT', this.gracefulShutdown);

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    
    // Close database connection
    databaseConfig.disconnect().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error during database disconnection:', error);
      process.exit(1);
    });
  };
}

// Create and start server
const server = new Server();
server.start();

module.exports = server;
