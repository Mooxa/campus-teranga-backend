const express = require('express');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

const router = express.Router();

// Public route - get all active services
router.get('/', async (req, res) => {
  try {
    const { isActive = true } = req.query;
    let query = { isActive: isActive === 'true' || isActive === true };
    
    const services = await Service.find(query).sort({ createdAt: -1 }).lean();
    
    res.json({
      success: true,
      data: services
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

// Public route - get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).lean();
    
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
    console.error('Get service by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching service',
      error: error.message 
    });
  }
});

module.exports = router;
