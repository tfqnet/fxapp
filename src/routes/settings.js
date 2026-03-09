// routes/settings.js — read and update app settings
const express = require('express');
const router = express.Router();
const { readSettings, writeSettings } = require('../storage');

// GET /api/settings
router.get('/', (req, res) => {
  const settings = readSettings();
  // Never expose full token in response — mask it
  const masked = {
    ...settings,
    telegramBotToken: settings.telegramBotToken
      ? settings.telegramBotToken.substring(0, 8) + '••••••••'
      : '',
  };
  res.json(masked);
});

// PATCH /api/settings
// Accepts: { wiseFeePercent, alertThreshold, telegramBotToken, telegramChatId }
router.patch('/', (req, res) => {
  const allowed = ['wiseFeePercent', 'alertThreshold', 'telegramBotToken', 'telegramChatId'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }

  const saved = writeSettings(updates);
  res.json({ message: 'Settings updated.', settings: saved });
});

module.exports = router;
