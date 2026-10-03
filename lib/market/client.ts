import { MarketQuote } from '@/types/v2';
import { queryDb } from '@/lib/db/client';

export const DEFAULT_TICKERS = ['SPY', 'VTI', 'VXUS', 'BND', 'AAPL', 'MSFT', 'NVDA'];

export interface MarketDataProviderConfig {
  provider: 'finnhub' | 'polygon' | 'alphavantage' | 'demo';
  apiKey?: string;
}

export function getMarketConfig(): MarketDataProviderConfig {
  const rawKey = process.env.MARKET_DATA_API_KEY || process.env.FINNHUB_API_KEY || process.env.POLYGON_API_KEY;
  const apiKey = rawKey ? rawKey.trim() : undefined;
  const rawProvider = (process.env.MARKET_DATA_PROVIDER || 'finnhub').toLowerCase();

  let provider: 'finnhub' | 'polygon' | 'alphavantage' | 'demo' = 'demo';
  if (apiKey) {
    if (rawProvider.includes('poly')) provider = 'polygon';
    else if (rawProvider.includes('alpha')) provider = 'alphavantage';
    else provider = 'finnhub';
  }

  return { provider, apiKey };
}

// Baseline demo prices for standard educational tickers
const BASELINE_PRICES: Record<string, { price: number; change: number; changePercent: number; name: string }> = {
  SPY: { price: 574.82, change: 2.34, changePercent: 0.41, name: 'SPDR S&P 500 ETF Trust' },
  VTI: { price: 281.45, change: 1.12, changePercent: 0.40, name: 'Vanguard Total Stock Market ETF' },
  VXUS: { price: 62.18, change: -0.15, changePercent: -0.24, name: 'Vanguard Total International Stock' },
  BND: { price: 73.25, change: 0.08, changePercent: 0.11, name: 'Vanguard Total Bond Market ETF' },
  AAPL: { price: 227.63, change: 1.85, changePercent: 0.82, name: 'Apple Inc.' },
  MSFT: { price: 418.90, change: -0.65, changePercent: -0.15, name: 'Microsoft Corporation' },
  NVDA: { price: 124.92, change: 3.42, changePercent: 2.81, name: 'NVIDIA Corporation' },
};

/**
 * Fetches quote for a single symbol using Finnhub API
 */
async function fetchFinnhubQuote(symbol: string, apiKey: string): Promise<MarketQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Finnhub error (${res.status}): ${res.statusText}`);
  }

  const d = await res.json();
  // Finnhub returns { c: current, d: change, dp: percent, h: high, l: low, o: open, pc: prevClose }
  if (typeof d.c !== 'number' || d.c === 0) {
    throw new Error(`Invalid Finnhub quote data for ${symbol}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    price: Math.round(d.c * 100) / 100,
    change: Math.round((d.d ?? 0) * 100) / 100,
    changePercent: Math.round((d.dp ?? 0) * 100) / 100,
    high: Math.round((d.h ?? d.c) * 100) / 100,
    low: Math.round((d.l ?? d.c) * 100) / 100,
    open: Math.round((d.o ?? d.c) * 100) / 100,
    previousClose: Math.round((d.pc ?? d.c) * 100) / 100,
    source: 'finnhub',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetches quote for a single symbol using Polygon API
 */
async function fetchPolygonQuote(symbol: string, apiKey: string): Promise<MarketQuote> {
  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Polygon error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const result = data.results?.[0];
  if (!result || typeof result.c !== 'number') {
    throw new Error(`Invalid Polygon quote data for ${symbol}`);
  }

  const prevClose = result.o ?? result.c;
  const change = result.c - prevClose;
  const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    price: Math.round(result.c * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: Math.round(result.h * 100) / 100,
    low: Math.round(result.l * 100) / 100,
    open: Math.round(result.o * 100) / 100,
    previousClose: Math.round(prevClose * 100) / 100,
    source: 'polygon',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetches quote for a single symbol using AlphaVantage API
 */
async function fetchAlphaVantageQuote(symbol: string, apiKey: string): Promise<MarketQuote> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`AlphaVantage error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const q = data['Global Quote'];
  if (!q || !q['05. price']) {
    throw new Error(`Invalid AlphaVantage quote data for ${symbol}`);
  }

  const price = parseFloat(q['05. price']);
  const change = parseFloat(q['09. change'] ?? '0');
  const changePercentStr = (q['10. change percent'] ?? '0%').replace('%', '');
  const changePercent = parseFloat(changePercentStr);

  return {
    symbol: symbol.toUpperCase(),
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: Math.round(parseFloat(q['03. high'] ?? price.toString()) * 100) / 100,
    low: Math.round(parseFloat(q['04. low'] ?? price.toString()) * 100) / 100,
    open: Math.round(parseFloat(q['02. open'] ?? price.toString()) * 100) / 100,
    previousClose: Math.round(parseFloat(q['08. previous close'] ?? price.toString()) * 100) / 100,
    source: 'alphavantage',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * High-reliability seed quote fallback with micro-variations
 */
export function getDemoQuote(symbol: string): MarketQuote {
  const upper = symbol.toUpperCase();
  const base = BASELINE_PRICES[upper] || {
    price: 150.00,
    change: 0.75,
    changePercent: 0.50,
    name: upper,
  };

  return {
    symbol: upper,
    price: base.price,
    change: base.change,
    changePercent: base.changePercent,
    high: Math.round((base.price + Math.abs(base.change) * 1.2) * 100) / 100,
    low: Math.round((base.price - Math.abs(base.change) * 0.8) * 100) / 100,
    open: Math.round((base.price - base.change) * 100) / 100,
    previousClose: Math.round((base.price - base.change) * 100) / 100,
    source: 'demo-feed',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Asynchronously record market price into Tiger Data Timescale hypertable
 */
async function recordPriceInTigerData(quote: MarketQuote): Promise<void> {
  try {
    await queryDb(
      `INSERT INTO market_prices (time, symbol, price, volume, source)
       VALUES (NOW(), $1, $2, $3, $4)
       ON CONFLICT (time, symbol, source) DO NOTHING`,
      [quote.symbol, quote.price, 1000000, quote.source]
    );
  } catch {
    // Non-blocking: background telemetry only
  }
}

/**
 * Fetches quotes for an array of ticker symbols.
 * Falls back gracefully to resilient demo quotes on any API error or rate-limit.
 */
export async function getMarketQuotes(symbols: string[] = DEFAULT_TICKERS): Promise<MarketQuote[]> {
  const { provider, apiKey } = getMarketConfig();

  const fetchSingle = async (sym: string): Promise<MarketQuote> => {
    if (!apiKey || provider === 'demo') {
      return getDemoQuote(sym);
    }

    try {
      let quote: MarketQuote;
      if (provider === 'finnhub') {
        quote = await fetchFinnhubQuote(sym, apiKey);
      } else if (provider === 'polygon') {
        quote = await fetchPolygonQuote(sym, apiKey);
      } else if (provider === 'alphavantage') {
        quote = await fetchAlphaVantageQuote(sym, apiKey);
      } else {
        quote = getDemoQuote(sym);
      }

      // Record to Tiger Data
      recordPriceInTigerData(quote).catch(() => {});
      return quote;
    } catch (err) {
      console.warn(`Market API (${provider}) failed for ${sym}, falling back to demo feed:`, err);
      return getDemoQuote(sym);
    }
  };

  return Promise.all(symbols.map((s) => fetchSingle(s)));
}
