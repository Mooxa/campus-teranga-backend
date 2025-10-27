const express = require('express');
const Formation = require('../models/Formation');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all formations
router.get('/', async (req, res) => {
  try {
    const { type, city } = req.query;
    let query = { isActive: true };

    if (type) {
      query.type = type;
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    const formations = await Formation.find(query).sort({ createdAt: -1 });
    res.json(formations);
  } catch (error) {
    console.error('Get formations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get formation by ID
router.get('/:id', async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);
    
    if (!formation) {
      return res.status(404).json({ message: 'Formation not found' });
    }

    res.json(formation);
  } catch (error) {
    console.error('Get formation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create formation (admin only - for now, no auth required for demo)
router.post('/', async (req, res) => {
  try {
    const formation = new Formation(req.body);
    await formation.save();
    res.status(201).json(formation);
  } catch (error) {
    console.error('Create formation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update formation
router.put('/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!formation) {
      return res.status(404).json({ message: 'Formation not found' });
    }

    res.json(formation);
  } catch (error) {
    console.error('Update formation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete formation
router.delete('/:id', async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!formation) {
      return res.status(404).json({ message: 'Formation not found' });
    }

    res.json({ message: 'Formation deleted successfully' });
  } catch (error) {
    console.error('Delete formation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
