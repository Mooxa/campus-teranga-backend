const express = require('express');
const router = express.Router();
const { adminAuth, superAdminAuth } = require('../middleware/adminAuth');
const User = require('../models/User');
const Event = require('../models/Event');
const Formation = require('../models/Formation');
const Service = require('../models/Service');

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
      totalUsers,
      activeUsers,
      totalEvents,
      totalFormations,
      totalServices,
      recentUsers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// User Management Routes
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
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

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { fullName, email, phoneNumber, country, university, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only super admin can change roles
    if (role && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can change user roles' });
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

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

router.delete('/users/:id', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Event Management Routes
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
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

    const events = await Event.find(query)
      .populate('registeredUsers', 'fullName email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Error creating event' });
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
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// Formation Management Routes
router.get('/formations', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
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

    const formations = await Formation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Formation.countDocuments(query);

    res.json(formations);
  } catch (error) {
    console.error('Get formations error:', error);
    res.status(500).json({ message: 'Error fetching formations' });
  }
});

router.post('/formations', async (req, res) => {
  try {
    const formation = new Formation(req.body);
    await formation.save();
    res.status(201).json(formation);
  } catch (error) {
    console.error('Create formation error:', error);
    res.status(500).json({ message: 'Error creating formation' });
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
      return res.status(404).json({ message: 'Formation not found' });
    }
    
    res.json(formation);
  } catch (error) {
    console.error('Update formation error:', error);
    res.status(500).json({ message: 'Error updating formation' });
  }
});

router.delete('/formations/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndDelete(req.params.id);
    if (!formation) {
      return res.status(404).json({ message: 'Formation not found' });
    }
    res.json({ message: 'Formation deleted successfully' });
  } catch (error) {
    console.error('Delete formation error:', error);
    res.status(500).json({ message: 'Error deleting formation' });
  }
});

// Service Management Routes
router.get('/services', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
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

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(query);

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Error creating service' });
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
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Error updating service' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Error deleting service' });
  }
});

module.exports = router;
