const axios = require('axios');
const { getLatest } = require('../storage');

// ─────────────────────────────────────────────────────────────────────────────
// dataFetcher.js
// Fetches live market data from three external APIs:
//   1. USD/MYR exchange rate  → ExchangeRate-API
//   2. Brent crude oil price  → U.S. EIA Open Data API
//   3. USD Index (DXY)        → Twelve Data (UUP ETF proxy)
//
// Rate limit fallback: if any API fails, the last known value from history
// is reused so the scheduler cycle continues uninterrupted.
// ─────────────────────────────────────────────────────────────────────────────

// ── Get last saved values as fallback ────────────────────────────
function getLastKnown() {
  const history = getLatest(1);
  if (history.length === 0) return null;
  return {
    fxRate:   history[0].fxRate,
    oilPrice: history[0].oilPrice,
    dxy:      history[0].dxy,
  };
}

// ── 1. USD/MYR FX rate ───────────────────────────────────────────
async function fetchFxRate() {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  const url = `https://v6.exchangerate-api.com/v6/${key}/pair/USD/MYR`;
  const { data } = await axios.get(url, { timeout: 8000 });
  if (data.result !== 'success') throw new Error('FX API error: ' + data['error-type']);
  return parseFloat(data.conversion_rate);
}

// ── 2. Brent crude oil (USD per barrel) ──────────────────────────
async function fetchOilPrice() {
  const key = process.env.EIA_API_KEY;
  const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${key}&frequency=daily&data[0]=value&facets[series][]=${encodeURIComponent('RBRTE')}&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`;
  const { data } = await axios.get(url, { timeout: 8000 });
  const rows = data?.response?.data;
  if (!rows || rows.length === 0) throw new Error('EIA API returned no data');
  return parseFloat(rows[0].value);
}

// ── 3. USD Index / DXY via Twelve Data (UUP ETF proxy) ───────────
// Free tier: 800 requests/day — safe for 15-min cron (96 req/day)
async function fetchDxy() {
  const key = process.env.TWELVE_DATA_API_KEY;
  const url = `https://api.twelvedata.com/price?symbol=UUP&apikey=${key}`;
  const { data } = await axios.get(url, { timeout: 8000 });
  if (data.code && data.code !== 200) throw new Error('Twelve Data error: ' + data.message);
  if (!data.price) throw new Error('Twelve Data returned no price for UUP');
  return parseFloat(data.price);
}

// ── Aggregate fetch with per-field fallback ───────────────────────
// If one API fails, use last known value instead of killing the cycle.
async function fetchAllMarketData() {
  const last = getLastKnown();
  const fallbackUsed = [];

  const settle = (promise, fallback, label) =>
    promise.catch((err) => {
      if (fallback !== null && fallback !== undefined) {
        console.warn(`⚠️  ${label} failed (${err.message}) — using last known value: ${fallback}`);
        fallbackUsed.push(label);
        return fallback;
      }
      throw err; // no fallback available (first ever run), propagate
    });

  const [fxRate, oilPrice, dxy] = await Promise.all([
    settle(fetchFxRate(),   last?.fxRate,   'FX Rate'),
    settle(fetchOilPrice(), last?.oilPrice, 'Oil Price'),
    settle(fetchDxy(),      last?.dxy,      'DXY'),
  ]);

  return {
    fxRate,
    oilPrice,
    dxy,
    fetchedAt: new Date().toISOString(),
    usingFallback: fallbackUsed.length > 0,
    fallbackFields: fallbackUsed,
  };
}

module.exports = { fetchFxRate, fetchOilPrice, fetchDxy, fetchAllMarketData };
