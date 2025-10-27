const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Database Configuration
 * 
 * This module handles MongoDB connection with proper error handling,
 * connection pooling, and production-ready configurations.
 */

class DatabaseConfig {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      // Connection options for production readiness
      const options = {
        // Connection pool settings
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
        
        // Security settings (for MongoDB Atlas or SSL-enabled databases)
        ...(process.env.NODE_ENV === 'production' && {
          ssl: true,
          tlsAllowInvalidCertificates: false,
          tlsAllowInvalidHostnames: false,
        }),
        
        // Performance settings
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Monitoring
        monitorCommands: process.env.NODE_ENV === 'development',
      };

      logger.info('Connecting to MongoDB...', {
        uri: mongoUri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
        environment: process.env.NODE_ENV,
      });

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;

      logger.info('MongoDB connected successfully', {
        host: this.connection.connection.host,
        port: this.connection.connection.port,
        name: this.connection.connection.name,
      });

      // Handle connection events
      this.setupEventHandlers();

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup MongoDB event handlers
   */
  setupEventHandlers() {
    const db = mongoose.connection;

    db.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    db.on('error', (error) => {
      logger.error('Mongoose connection error:', {
        error: error.message,
        stack: error.stack,
      });
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    db.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('MongoDB disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Database is not connected',
        };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database is responding',
        connection: this.getConnectionStatus(),
      };
    } catch (error) {
      logger.error('Database health check failed:', {
        error: error.message,
        stack: error.stack,
      });
      
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;
