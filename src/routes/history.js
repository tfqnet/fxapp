// routes/history.js — returns paginated alert history
const express = require('express');
const router = express.Router();
const { getLatest } = require('../storage');

// GET /api/history?limit=50
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const history = getLatest(limit);
  res.json({ count: history.length, records: history });
});

module.exports = router;
