import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const explanation = await aiService.explainBudget(body);
    return NextResponse.json({ success: true, explanation });
  } catch (err: any) {
    console.error('Insights API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to generate budget insights at this time.',
      },
      { status: 500 }
    );
  }
}
