// ─────────────────────────────────────────────────────────────────────────────
// notificationService.js
// Sends formatted Telegram alerts using the Bot API.
// Token and chat ID are read from settings (allows live updates from app).
// ─────────────────────────────────────────────────────────────────────────────

const TelegramBot = require('node-telegram-bot-api');
const { readSettings } = require('../storage');

// ── Emoji helpers ─────────────────────────────────────────────────
function trendEmoji(dir) {
  if (dir === 'up') return '📈';
  if (dir === 'down') return '📉';
  return '➡️';
}

function recommendationEmoji(rec) {
  if (rec === 'BUY USD') return '🟢';
  if (rec === 'SELL USD') return '🔴';
  return '🟡';
}

// ── Format the Telegram message ───────────────────────────────────
function formatMessage(snapshot) {
  const {
    fxRate, oilPrice, dxy,
    fxTrend, oilTrend, dxyTrend,
    totalScore, recommendation,
    estimatedMovePct, wiseFeePercent, netAdvantage,
    timestamp,
  } = snapshot;

  const scoreStr = totalScore >= 0 ? `+${totalScore}` : `${totalScore}`;
  const movePct  = estimatedMovePct.toFixed(2);
  const feePct   = wiseFeePercent.toFixed(2);
  const netPct   = netAdvantage.toFixed(2);

  return [
    `🚨 *MYR FX SIGNAL*`,
    ``,
    `💱 USD/MYR: \`${fxRate.toFixed(4)}\``,
    `🛢 Oil (Brent): \`$${oilPrice.toFixed(2)}\``,
    `📊 USD Index (DXY proxy): \`${dxy.toFixed(2)}\``,
    ``,
    `FX Trend:        ${trendEmoji(fxTrend)} ${fxTrend.charAt(0).toUpperCase() + fxTrend.slice(1)}`,
    `Oil Trend:       ${trendEmoji(oilTrend)} ${oilTrend.charAt(0).toUpperCase() + oilTrend.slice(1)}`,
    `USD Index Trend: ${trendEmoji(dxyTrend)} ${dxyTrend.charAt(0).toUpperCase() + dxyTrend.slice(1)}`,
    ``,
    `📝 *Signal Score: ${scoreStr}*`,
    ``,
    `${recommendationEmoji(recommendation)} *Recommendation: ${recommendation}*`,
    ``,
    `Estimated movement: ${movePct}%`,
    `Wise fee:           ${feePct}%`,
    `Net advantage:      *${netPct}%*`,
    ``,
    `🕐 ${timestamp}`,
  ].join('\n');
}

// ── Send alert ────────────────────────────────────────────────────
async function sendTelegramAlert(snapshot) {
  const settings = readSettings();
  const { telegramBotToken, telegramChatId } = settings;

  if (!telegramBotToken || !telegramChatId) {
    console.warn('⚠️  Telegram not configured — skipping notification.');
    return;
  }

  const bot = new TelegramBot(telegramBotToken);
  const text = formatMessage(snapshot);

  try {
    await bot.sendMessage(telegramChatId, text, { parse_mode: 'Markdown' });
    console.log('📨  Telegram alert sent.');
  } catch (err) {
    console.error('❌  Telegram send error:', err.message);
  }
}

module.exports = { sendTelegramAlert, formatMessage };
