const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/history.json');

// ── Ensure data file exists ───────────────────────────────────────
function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// ── Read all history ──────────────────────────────────────────────
function readHistory() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

// ── Append a new alert record ─────────────────────────────────────
function appendAlert(alertRecord) {
  const history = readHistory();
  history.unshift(alertRecord); // newest first

  // Keep only the last 500 records
  const trimmed = history.slice(0, 500);
  fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2));
  return alertRecord;
}

// ── Get latest N records ──────────────────────────────────────────
function getLatest(n = 50) {
  return readHistory().slice(0, n);
}

// ── Get/Set settings from a separate settings.json ───────────────
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

const DEFAULT_SETTINGS = {
  wiseFeePercent: parseFloat(process.env.WISE_FEE_PERCENT) || 0.5,
  alertThreshold: parseInt(process.env.ALERT_THRESHOLD) || 2,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
};

function readSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
}

function writeSettings(updates) {
  const current = readSettings();
  const merged = { ...current, ...updates };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

module.exports = { readHistory, appendAlert, getLatest, readSettings, writeSettings };
