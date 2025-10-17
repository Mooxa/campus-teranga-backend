const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/formations', require('./routes/formations'));
app.use('/api/services', require('./routes/services'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/seed', require('./routes/seed'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_teranga', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionRetryDelayMS: 5000, // Keep trying to send operations for 5 seconds
  heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
})
.then(async () => {
  console.log('MongoDB connected successfully');
  // Seed sample data in development
  if (process.env.NODE_ENV === 'development') {
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
})
.catch(err => console.error('MongoDB connection error:', err));

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
