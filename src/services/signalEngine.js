// ─────────────────────────────────────────────────────────────────────────────
// signalEngine.js
// Computes score from three market indicators and produces a BUY/SELL/HOLD.
//
// Score table:
//   FX trend:   USD/MYR rising  → +1 | falling → -1
//   Oil trend:  Brent rising    → -1 | falling  → +1
//   DXY trend:  DXY rising      → +1 | falling  → -1
//
//   Score ≥ +2  →  BUY USD
//   Score ≤ -2  →  SELL USD
//   Else        →  HOLD
// ─────────────────────────────────────────────────────────────────────────────

const { readHistory } = require('../storage');

// ── Determine direction from last two values ──────────────────────
function trend(prev, curr) {
  if (curr > prev) return 'up';
  if (curr < prev) return 'down';
  return 'neutral';
}

// ── Score a single indicator ──────────────────────────────────────
function scoreIndicator(trendDir, positiveDir = 'up') {
  if (trendDir === positiveDir) return 1;
  if (trendDir === 'neutral') return 0;
  return -1;
}

// ── Map score to label ────────────────────────────────────────────
function scoreLabel(score) {
  switch (score) {
    case 3:  return 'Strong USD';
    case 2:  return 'BUY signal';
    case 1:  return 'Weak USD strengthening';
    case 0:  return 'Neutral';
    case -1: return 'Weak MYR strengthening';
    case -2: return 'SELL signal';
    case -3: return 'Strong MYR';
    default: return 'Neutral';
  }
}

// ── Compute recommendation ────────────────────────────────────────
function recommendation(score) {
  if (score >= 2) return 'BUY USD';
  if (score <= -2) return 'SELL USD';
  return 'HOLD';
}

// ── Main compute function ─────────────────────────────────────────
// Requires current snapshot + previous snapshot for trend calculation.
//
// prevData & currData shape: { fxRate, oilPrice, dxy }
//
function computeSignal(prevData, currData) {
  const fxTrend  = trend(prevData.fxRate,   currData.fxRate);
  const oilTrend = trend(prevData.oilPrice, currData.oilPrice);
  const dxyTrend = trend(prevData.dxy,      currData.dxy);

  // FX rising (USD stronger vs MYR)  → +1
  const fxScore  = scoreIndicator(fxTrend, 'up');
  // Oil rising → MYR weakens more    → -1
  const oilScore = scoreIndicator(oilTrend, 'down'); // 'down' is positive
  // DXY rising → USD stronger        → +1
  const dxyScore = scoreIndicator(dxyTrend, 'up');

  const totalScore = fxScore + oilScore + dxyScore;

  return {
    fxTrend,
    oilTrend,
    dxyTrend,
    fxScore,
    oilScore,
    dxyScore,
    totalScore,
    scoreLabel: scoreLabel(totalScore),
    recommendation: recommendation(totalScore),
    // estimated move based on FX delta
    estimatedMovePct: prevData.fxRate > 0
      ? (Math.abs(currData.fxRate - prevData.fxRate) / prevData.fxRate) * 100
      : 0,
  };
}

// ── Helper: get previous snapshot from history ────────────────────
function getPreviousSnapshot() {
  const history = readHistory();
  if (history.length === 0) return null;
  const prev = history[0]; // newest entry is index 0
  return {
    fxRate:   prev.fxRate,
    oilPrice: prev.oilPrice,
    dxy:      prev.dxy,
  };
}

module.exports = { computeSignal, getPreviousSnapshot, trend, recommendation };
