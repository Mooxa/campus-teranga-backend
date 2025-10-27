const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// All event routes can be accessed with optional authentication
// Note: For now using auth middleware, can be made optional later
// router.use(optionalAuth);

// Placeholder for event routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Events endpoint',
    events: [],
  });
});

module.exports = router;
