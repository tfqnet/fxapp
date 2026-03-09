// ─────────────────────────────────────────────────────────────────────────────
// scheduler.js
// Runs the full analysis pipeline every 15 minutes using node-cron.
//
// Pipeline:
//   1. Fetch all market data
//   2. Load previous snapshot from history
//   3. Compute signal score
//   4. Calculate Wise net advantage
//   5. Persist to storage
//   6. Send Telegram alert if score meets threshold & net advantage > 0
// ─────────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const { fetchAllMarketData } = require('./services/dataFetcher');
const { computeSignal, getPreviousSnapshot } = require('./services/signalEngine');
const { calculateNetAdvantage } = require('./services/wiseFeeModel');
const { sendTelegramAlert } = require('./services/notificationService');
const { appendAlert, readSettings } = require('./storage');

// ── Run one analysis cycle ────────────────────────────────────────
async function runAnalysis() {
  console.log(`\n⏰  [${new Date().toISOString()}] Running FX analysis...`);
  const settings = readSettings();

  try {
    // 1. Fetch live data
    const currData = await fetchAllMarketData();
    console.log(`   FX: ${currData.fxRate}  Oil: ${currData.oilPrice}  DXY: ${currData.dxy}`);

    // 2. Get previous snapshot for trend calculation
    const prevData = getPreviousSnapshot();
    if (!prevData) {
      // First run — store snapshot, no signal yet
      appendAlert({ ...currData, totalScore: 0, recommendation: 'HOLD', firstRun: true });
      console.log('   ℹ️  First run — baseline stored. Signal on next cycle.');
      return;
    }

    // 3. Compute signal
    const signal = computeSignal(prevData, currData);

    // 4. Wise fee model
    const wise = calculateNetAdvantage(signal.estimatedMovePct);

    // 5. Build full snapshot record
    const record = {
      ...currData,
      ...signal,
      ...wise,
      timestamp: new Date().toISOString(),
      usingFallback: currData.usingFallback || false,
    };

    // 6. Persist
    appendAlert(record);
    console.log(`   Score: ${record.totalScore}  Rec: ${record.recommendation}  Net: ${record.netAdvantage}%`);

    // 7. Notify if threshold met AND worth acting on
    const threshold = settings.alertThreshold || 2;
    const shouldAlert =
      Math.abs(record.totalScore) >= threshold && record.isWorthActing;

    if (shouldAlert) {
      await sendTelegramAlert(record);
    } else {
      console.log('   No alert triggered (below threshold or net advantage ≤ 0).');
    }
  } catch (err) {
    console.error('❌  Analysis error:', err.message);
  }
}

// ── Start the cron scheduler ──────────────────────────────────────
// "*/15 * * * *"  →  every 15 minutes
function startScheduler() {
  console.log('🕐  Scheduler started — analysis runs every 15 minutes.');
  runAnalysis(); // run immediately on startup

  cron.schedule('*/15 * * * *', runAnalysis);
}

module.exports = { startScheduler, runAnalysis };
