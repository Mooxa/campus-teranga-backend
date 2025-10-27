const express = require('express');
const Formation = require('../models/Formation');
const auth = require('../middleware/auth');

const router = express.Router();

// Public route - get all active formations
router.get('/', async (req, res) => {
  try {
    const { type, city, isActive = true } = req.query;
    let query = { isActive: isActive === 'true' || isActive === true };
    
    if (type) {
      query.type = type;
    }
    
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    const formations = await Formation.find(query).sort({ createdAt: -1 }).lean();
    
    res.json({
      success: true,
      data: formations
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

// Public route - get formation by ID
router.get('/:id', async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id).lean();
    
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
    console.error('Get formation by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching formation',
      error: error.message 
    });
  }
});

module.exports = router;
