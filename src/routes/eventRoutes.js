const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// Public route - get all active events
router.get('/', async (req, res) => {
  try {
    const { isActive = true } = req.query;
    let query = { isActive: isActive === 'true' || isActive === true };
    
    const events = await Event.find(query).sort({ createdAt: -1 }).lean();
    
    res.json({
      success: true,
      data: events
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

// Public route - get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    
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
    console.error('Get event by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching event',
      error: error.message 
    });
  }
});

module.exports = router;
