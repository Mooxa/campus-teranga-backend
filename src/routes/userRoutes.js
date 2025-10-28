const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// All user routes require authentication
router.use(auth);

// Get user profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      dateOfBirth, 
      address, 
      fieldOfStudy, 
      yearOfStudy, 
      bio 
    } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update fields if provided
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (address !== undefined) user.address = address;
    if (fieldOfStudy !== undefined) user.fieldOfStudy = fieldOfStudy;
    if (yearOfStudy !== undefined) user.yearOfStudy = yearOfStudy;
    if (bio !== undefined) user.bio = bio;

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

module.exports = router;
