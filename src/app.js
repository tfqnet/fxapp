const express = require('express');
const cors = require('cors');

const signalRoutes = require('./routes/signal');
const historyRoutes = require('./routes/history');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/signal', signalRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);

// ── 404 handler ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

module.exports = app;
