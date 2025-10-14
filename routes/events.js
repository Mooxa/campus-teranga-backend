const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const { category, upcoming } = req.query;
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('registeredUsers', 'fullName phoneNumber')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'fullName phoneNumber');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already registered
    if (event.registeredUsers.includes(req.user._id)) {
      return res.status(400).json({ message: 'User already registered for this event' });
    }

    // Check capacity
    if (event.capacity > 0 && event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.registeredUsers.push(req.user._id);
    await event.save();

    res.json({ message: 'Successfully registered for event' });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unregister from event
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.registeredUsers = event.registeredUsers.filter(
      userId => userId.toString() !== req.user._id.toString()
    );
    
    await event.save();

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Unregister from event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
