const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Database connection check middleware
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      success: false,
      message: 'Database not connected. Please try again later.',
      error: 'MongoNotConnectedError'
    });
  }
  next();
};

// Register
router.post('/register', checkDatabaseConnection, async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Full name, phone number, and password are required' 
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this phone number' 
      });
    }

    // Check if email is already in use (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: 'User already exists with this email address' 
        });
      }
    }

    // Create new user
    const user = new User({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      password
    });

    await user.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

// Login
router.post('/login', checkDatabaseConnection, async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Validate required fields
    if (!phoneNumber || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and password are required' 
      });
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber: phoneNumber.trim() });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Get current user
router.get('/me', checkDatabaseConnection, auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        phoneNumber: req.user.phoneNumber,
        email: req.user.email,
        country: req.user.country,
        university: req.user.university,
        role: req.user.role,
        isActive: req.user.isActive
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', checkDatabaseConnection, auth, async (req, res) => {
  try {
    const { fullName, email, country, university } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.country = country || user.country;
    user.university = university || user.university;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        country: user.country,
        university: user.university
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
