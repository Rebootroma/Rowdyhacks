import { NextRequest, NextResponse } from 'next/server';
import { getMarketQuotes, getMarketConfig, DEFAULT_TICKERS } from '@/lib/market/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');

    const symbols = symbolsParam
      ? symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_TICKERS;

    const { provider } = getMarketConfig();
    const quotes = await getMarketQuotes(symbols);

    return NextResponse.json({
      success: true,
      provider,
      data: quotes,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Market quotes route error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to fetch market quotes',
      },
      { status: 500 }
    );
  }
}
