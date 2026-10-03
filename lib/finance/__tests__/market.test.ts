import test from 'node:test';
import assert from 'node:assert/strict';
import { getMarketConfig, getDemoQuote, getMarketQuotes, DEFAULT_TICKERS } from '@/lib/market/client';

test('Market Data Client - Configuration', () => {
  const config = getMarketConfig();
  assert.ok(config, 'Config should exist');
  assert.ok(['finnhub', 'polygon', 'alphavantage', 'demo'].includes(config.provider), 'Provider should be recognized');
});

test('Market Data Client - Demo Quotes Math & Invariants', () => {
  for (const sym of DEFAULT_TICKERS) {
    const quote = getDemoQuote(sym);
    assert.equal(quote.symbol, sym);
    assert.ok(quote.price > 0, `Price for ${sym} must be positive`);
    assert.ok(typeof quote.change === 'number', 'Change must be number');
    assert.ok(typeof quote.changePercent === 'number', 'ChangePercent must be number');
    assert.ok(quote.high >= quote.low, `High (${quote.high}) must be >= low (${quote.low})`);
    assert.equal(quote.source, 'demo-feed');
  }
});

test('Market Data Client - getMarketQuotes array resolution', async () => {
  const quotes = await getMarketQuotes(['SPY', 'NVDA', 'BND']);
  assert.equal(quotes.length, 3);
  assert.equal(quotes[0].symbol, 'SPY');
  assert.equal(quotes[1].symbol, 'NVDA');
  assert.equal(quotes[2].symbol, 'BND');

  for (const q of quotes) {
    assert.ok(q.price > 0);
    assert.ok(q.updatedAt.length > 0);
  }
});
