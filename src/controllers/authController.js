const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const User = require('../models/User');

/**
 * Authentication Controller
 * 
 * This module handles all authentication-related operations
 * with proper error handling and security measures.
 */

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new AppError('JWT secret is not configured', 500);
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'campus-teranga-api',
      audience: 'campus-teranga-app',
    }
  );
};

/**
 * Send token response
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  console.log('🔑 [BACKEND] Generating JWT token...');
  const token = generateToken(user._id);
  console.log('✅ [BACKEND] JWT token generated');
  
  // Remove password from output
  user.password = undefined;
  
  const responseData = {
    success: true,
    message,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
  
  console.log('📤 [BACKEND] Sending response:', {
    statusCode,
    message,
    userId: user._id,
    userPhone: user.phoneNumber,
    tokenPresent: !!token,
  });
  
  res.status(statusCode).json(responseData);
  console.log('✅ [BACKEND] Response sent successfully');
};

/**
 * Register new user
 */
const register = catchAsync(async (req, res) => {
  console.log('🚀 [BACKEND] Registration request received');
  console.log('📝 [BACKEND] Request body:', {
    fullName: req.body.fullName ? 'Present' : 'Missing',
    phoneNumber: req.body.phoneNumber ? 'Present' : 'Missing',
    email: req.body.email ? 'Present' : 'Missing',
    password: req.body.password ? 'Present' : 'Missing',
  });
  console.log('🌐 [BACKEND] Request IP:', req.ip);
  console.log('🌐 [BACKEND] User Agent:', req.get('User-Agent'));
  
  const { fullName, phoneNumber, email, password } = req.body;

  // Validate required fields
  if (!fullName || !phoneNumber || !password) {
    console.log('❌ [BACKEND] Missing required fields');
    throw new AppError('Full name, phone number, and password are required', 400);
  }

  console.log('✅ [BACKEND] Required fields validation passed');

  // Check if user already exists
  console.log('🔍 [BACKEND] Checking for existing user...');
  const existingUser = await User.findOne({
    $or: [
      { phoneNumber },
      ...(email ? [{ email }] : [])
    ]
  });

  if (existingUser) {
    console.log('❌ [BACKEND] User already exists');
    if (existingUser.phoneNumber === phoneNumber) {
      console.log('❌ [BACKEND] Phone number already in use');
      throw new AppError('User already exists with this phone number', 400);
    }
    if (existingUser.email === email) {
      console.log('❌ [BACKEND] Email already in use');
      throw new AppError('User already exists with this email address', 400);
    }
  }

  console.log('✅ [BACKEND] No existing user found');

  // Create new user
  console.log('👤 [BACKEND] Creating new user...');
  const user = new User({
    fullName: fullName.trim(),
    phoneNumber: phoneNumber.trim(),
    email: email ? email.trim().toLowerCase() : undefined,
    password,
  });

  console.log('💾 [BACKEND] Saving user to database...');
  await user.save();

  console.log('✅ [BACKEND] User saved successfully');
  console.log('👤 [BACKEND] User ID:', user._id);
  console.log('👤 [BACKEND] User phone:', user.phoneNumber);
  console.log('👤 [BACKEND] User email:', user.email || 'Not provided');

  logger.info('User registered successfully', {
    userId: user._id,
    phoneNumber: user.phoneNumber,
    email: user.email,
    ip: req.ip,
  });

  sendTokenResponse(user, 201, res, 'User created successfully');
});

/**
 * Login user
 */
const login = catchAsync(async (req, res) => {
  const { phoneNumber, password } = req.body;

  // Find user by phone number
  const user = await User.findOne({ phoneNumber }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid phone number or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 403);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    logger.warn('Failed login attempt', {
      phoneNumber,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    throw new AppError('Invalid phone number or password', 401);
  }

  logger.info('User logged in successfully', {
    userId: user._id,
    phoneNumber: user.phoneNumber,
    ip: req.ip,
  });

  sendTokenResponse(user, 200, res, 'Login successful');
});

/**
 * Logout user
 */
const logout = catchAsync(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  
  logger.info('User logged out', {
    userId: req.user._id,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Get current user
 */
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Update user profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const { fullName, email } = req.body;
  const userId = req.user._id;

  // Check if email is already in use by another user
  if (email) {
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: userId }
    });
    
    if (existingUser) {
      throw new AppError('Email address is already in use', 400);
    }
  }

  const updateData = {};
  if (fullName) updateData.fullName = fullName.trim();
  if (email) updateData.email = email.trim().toLowerCase();

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { 
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  logger.info('User profile updated', {
    userId: user._id,
    updatedFields: Object.keys(updateData),
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Change password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Get user with password
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info('Password changed successfully', {
    userId: user._id,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Deactivate account
 */
const deactivateAccount = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  logger.info('Account deactivated', {
    userId: user._id,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully',
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deactivateAccount,
};
