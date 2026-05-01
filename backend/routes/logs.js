const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// @route   GET /api/logs
// @desc    Get all logs
// @access  Private/Admin
router.get('/', auth, auth.adminOnly, (req, res) => {
  try {
    const logs = logger.getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
