import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const extraction = await aiService.extractReceipt(image, mimeType);
    return NextResponse.json({ success: true, extraction });
  } catch (err: any) {
    console.error('Receipt extraction API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't analyze this automatically. You can still enter the information manually.",
      },
      { status: 500 }
    );
  }
}
