const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Debug: Log environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('API_URL:', process.env.API_URL || 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001', // Admin dashboard local development
      'http://localhost:3002', // Alternative admin port
      'http://192.168.1.2:3000', // iOS simulator access
      'http://192.168.1.2:3001', // iOS simulator admin access
      'https://campus-teranga-admin.vercel.app',
      'https://campus-teranga-admin-git-main.vercel.app',
      'https://campus-teranga-admin-git-develop.vercel.app',
      'https://campus-teranga-admin-git-main-mooxa.vercel.app', // Full Vercel URL
      'https://campus-teranga-admin-git-develop-mooxa.vercel.app' // Full Vercel URL
    ];
    
    // Allow localhost and local network for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.1.2')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/formations', require('./routes/formations'));
app.use('/api/services', require('./routes/services'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/seed', require('./routes/seed'));

// Database connection and server startup
const startServer = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Ensure MongoDB URI is defined
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_teranga';
    const apiUrl = process.env.API_URL || `http://localhost:${PORT}`;
    
    console.log('MongoDB URI:', mongoUri);
    console.log('API URL:', apiUrl);
    
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined. Please check your environment configuration.');
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      bufferCommands: false, // Disable mongoose buffering
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Seed sample data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🌱 Seeding development database...');
      const seedData = require('./seed_data');
      await seedData();
    }
    
    // Auto-seed in production if SEED_ON_START is set
    if (process.env.NODE_ENV === 'production' && process.env.SEED_ON_START === 'true') {
      console.log('🌱 Auto-seeding production database with robust method...');
      try {
        const seedRobustData = require('./seed_robust');
        await seedRobustData();
        console.log('✅ Production database seeded successfully');
      } catch (error) {
        console.error('❌ Error auto-seeding production database:', error);
        // Fallback to original method
        try {
          console.log('🔄 Trying fallback seeding method...');
          const seedProductionData = require('./seed_production');
          await seedProductionData();
          console.log('✅ Fallback seeding completed successfully');
        } catch (fallbackError) {
          console.error('❌ Fallback seeding also failed:', fallbackError);
        }
      }
    }
    
    // Start the server only after database connection is established
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: ${apiUrl}`);
      console.log(`📊 Health check: ${apiUrl}/health`);
      console.log(`📱 iOS Simulator access: http://192.168.1.2:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Teranga API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
