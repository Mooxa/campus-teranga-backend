const express = require('express');
const {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateToken,
} = require('../validators/authValidators');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deactivateAccount,
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Authentication Routes
 * 
 * These routes handle user authentication operations
 * with proper validation and security measures.
 */

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.use(auth); // All routes below this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/profile', validateProfileUpdate, updateProfile);
router.patch('/change-password', validatePasswordChange, changePassword);
router.patch('/deactivate', deactivateAccount);

module.exports = router;
