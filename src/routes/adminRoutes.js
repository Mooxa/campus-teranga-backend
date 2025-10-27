const express = require('express');
const auth = require('../middleware/auth');
const { adminAuth, superAdminAuth } = require('../middleware/adminAuth');
const User = require('../models/User');
const Formation = require('../models/Formation');
const Service = require('../models/Service');
const Event = require('../models/Event');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalEvents = await Event.countDocuments();
    const totalFormations = await Formation.countDocuments();
    const totalServices = await Service.countDocuments();
    
    // Get recent users (last 5)
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalEvents,
        totalFormations,
        totalServices,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// User Management Routes
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', role = '' } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user',
      error: error.message 
    });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { fullName, email, phoneNumber, country, university, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Only super admin can change roles
    if (role && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only super admin can change user roles' 
      });
    }

    const updateData = { fullName, email, phoneNumber, country, university, isActive };
    if (role && req.user.role === 'super_admin') {
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating user',
      error: error.message 
    });
  }
});

router.delete('/users/:id', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user',
      error: error.message 
    });
  }
});

// Event Management Routes
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', category = '' } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Event.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching events',
      error: error.message 
    });
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating event',
      error: error.message 
    });
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating event',
      error: error.message 
    });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }
    res.json({ 
      success: true,
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting event',
      error: error.message 
    });
  }
});

// Formation Management Routes
router.get('/formations', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', type = '' } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [formations, total] = await Promise.all([
      Formation.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Formation.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: formations,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get formations error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching formations',
      error: error.message 
    });
  }
});

router.post('/formations', async (req, res) => {
  try {
    const formation = new Formation(req.body);
    await formation.save();
    res.status(201).json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Create formation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating formation',
      error: error.message 
    });
  }
});

router.put('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!formation) {
      return res.status(404).json({ 
        success: false,
        message: 'Formation not found' 
      });
    }
    
    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Update formation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating formation',
      error: error.message 
    });
  }
});

router.delete('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndDelete(req.params.id);
    if (!formation) {
      return res.status(404).json({ 
        success: false,
        message: 'Formation not found' 
      });
    }
    res.json({ 
      success: true,
      message: 'Formation deleted successfully' 
    });
  } catch (error) {
    console.error('Delete formation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting formation',
      error: error.message 
    });
  }
});

// Program Management Routes
router.post('/formations/:id/programs', async (req, res) => {
  try {
    const { name, level, duration, language } = req.body;
    const formation = await Formation.findById(req.params.id);
    
    if (!formation) {
      return res.status(404).json({ 
        success: false,
        message: 'Formation not found' 
      });
    }

    formation.programs.push({ name, level, duration, language });
    await formation.save();

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Add program error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding program',
      error: error.message 
    });
  }
});

router.put('/formations/:formationId/programs/:programId', async (req, res) => {
  try {
    const { name, level, duration, language } = req.body;
    const formation = await Formation.findById(req.params.formationId);
    
    if (!formation) {
      return res.status(404).json({ 
        success: false,
        message: 'Formation not found' 
      });
    }

    const program = formation.programs.id(req.params.programId);
    if (!program) {
      return res.status(404).json({ 
        success: false,
        message: 'Program not found' 
      });
    }

    if (name) program.name = name;
    if (level) program.level = level;
    if (duration) program.duration = duration;
    if (language) program.language = language;

    await formation.save();

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating program',
      error: error.message 
    });
  }
});

router.delete('/formations/:formationId/programs/:programId', async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.formationId);
    
    if (!formation) {
      return res.status(404).json({ 
        success: false,
        message: 'Formation not found' 
      });
    }

    const program = formation.programs.id(req.params.programId);
    if (!program) {
      return res.status(404).json({ 
        success: false,
        message: 'Program not found' 
      });
    }

    program.remove();
    await formation.save();

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting program',
      error: error.message 
    });
  }
});

// Service Management Routes
router.get('/services', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', category = '' } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Service.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: services,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching services',
      error: error.message 
    });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating service',
      error: error.message 
    });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found' 
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating service',
      error: error.message 
    });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found' 
      });
    }
  res.json({
    success: true,
      message: 'Service deleted successfully' 
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting service',
      error: error.message 
    });
  }
});

module.exports = router;
