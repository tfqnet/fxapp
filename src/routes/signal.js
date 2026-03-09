// routes/signal.js — returns the latest computed signal snapshot
const express = require('express');
const router = express.Router();
const { getLatest } = require('../storage');

// GET /api/signal/latest
router.get('/latest', (req, res) => {
  const history = getLatest(1);
  if (history.length === 0) {
    return res.status(404).json({ error: 'No signal data yet. Wait for the first scheduler cycle.' });
  }
  res.json(history[0]);
});

// GET /api/signal/run  — manually trigger one analysis cycle
router.post('/run', async (req, res) => {
  try {
    const { runAnalysis } = require('../scheduler');
    await runAnalysis();
    const history = getLatest(1);
    res.json({ message: 'Analysis complete', result: history[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
