import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rescue = await aiService.suggestBudgetRescue(body);
    return NextResponse.json({ success: true, rescue });
  } catch (err: any) {
    console.error('Rescue API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to calculate budget rescue options.',
      },
      { status: 500 }
    );
  }
}
