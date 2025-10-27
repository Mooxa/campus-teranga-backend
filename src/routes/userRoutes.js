const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(auth);

// Placeholder for user-specific routes
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint',
    user: req.user,
  });
});

module.exports = router;
