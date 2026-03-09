// ─────────────────────────────────────────────────────────────────────────────
// wiseFeeModel.js
// Calculates whether an FX signal is worth acting on after factoring in
// Wise's conversion fee.
//
// Net advantage = estimatedMovePct - wiseFeePercent
// Only act when net advantage > 0.
// ─────────────────────────────────────────────────────────────────────────────

const { readSettings } = require('../storage');

/**
 * @param {number} estimatedMovePct  — absolute % move expected in FX rate
 * @param {number|null} overrideFee  — optional override fee %; uses settings if null
 * @returns {{
 *   wiseFeePercent: number,
 *   estimatedMovePct: number,
 *   netAdvantage: number,
 *   isWorthActing: boolean
 * }}
 */
function calculateNetAdvantage(estimatedMovePct, overrideFee = null) {
  const settings = readSettings();
  const wiseFeePercent = overrideFee !== null ? overrideFee : settings.wiseFeePercent;
  const netAdvantage = parseFloat((estimatedMovePct - wiseFeePercent).toFixed(4));

  return {
    wiseFeePercent,
    estimatedMovePct: parseFloat(estimatedMovePct.toFixed(4)),
    netAdvantage,
    isWorthActing: netAdvantage > 0,
  };
}

module.exports = { calculateNetAdvantage };
