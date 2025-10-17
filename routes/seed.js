const express = require('express');
const seedProductionData = require('../seed_production');
const seedRobustData = require('../seed_robust');
const User = require('../models/User');
const Formation = require('../models/Formation');
const Service = require('../models/Service');
const Event = require('../models/Event');

const router = express.Router();

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      formations: await Formation.countDocuments(),
      services: await Service.countDocuments(),
      events: await Event.countDocuments(),
      adminUsers: await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } })
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Database statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving database statistics',
      error: error.message
    });
  }
});

// Seed production data (robust version)
router.post('/seed', async (req, res) => {
  try {
    // Check if we're in production and require authentication
    if (process.env.NODE_ENV === 'production') {
      // You might want to add additional security here
      // For now, we'll allow seeding in production but log it
      console.log('⚠️  Production seeding requested from IP:', req.ip);
    }

    console.log('🌱 Starting robust database seeding...');
    
    const stats = await seedRobustData();

    res.json({
      success: true,
      message: 'Database seeded successfully with robust method!',
      data: stats
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message
    });
  }
});

// Seed production data (original version - for fallback)
router.post('/seed-original', async (req, res) => {
  try {
    console.log('🌱 Starting original database seeding...');
    
    await seedProductionData();
    
    // Get updated statistics
    const stats = {
      users: await User.countDocuments(),
      formations: await Formation.countDocuments(),
      services: await Service.countDocuments(),
      events: await Event.countDocuments(),
      adminUsers: await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } })
    };

    res.json({
      success: true,
      message: 'Database seeded successfully with original method!',
      data: stats
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message
    });
  }
});

// Clear all data (DANGEROUS - use with caution)
router.post('/clear', async (req, res) => {
  try {
    // Only allow in development or with special environment variable
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DATA_CLEAR) {
      return res.status(403).json({
        success: false,
        message: 'Data clearing not allowed in production'
      });
    }

    console.log('🗑️  Clearing all data...');
    
    await User.deleteMany({});
    await Formation.deleteMany({});
    await Service.deleteMany({});
    await Event.deleteMany({});

    res.json({
      success: true,
      message: 'All data cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing database',
      error: error.message
    });
  }
});

// Reset database (clear + seed)
router.post('/reset', async (req, res) => {
  try {
    // Only allow in development or with special environment variable
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DATA_RESET) {
      return res.status(403).json({
        success: false,
        message: 'Database reset not allowed in production'
      });
    }

    console.log('🔄 Resetting database...');
    
    // Clear all data
    await User.deleteMany({});
    await Formation.deleteMany({});
    await Service.deleteMany({});
    await Event.deleteMany({});

    // Seed fresh data
    await seedProductionData();

    // Get updated statistics
    const stats = {
      users: await User.countDocuments(),
      formations: await Formation.countDocuments(),
      services: await Service.countDocuments(),
      events: await Event.countDocuments(),
      adminUsers: await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } })
    };

    res.json({
      success: true,
      message: 'Database reset and seeded successfully!',
      data: stats
    });

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting database',
      error: error.message
    });
  }
});

module.exports = router;
