import { NextRequest, NextResponse } from 'next/server';
import { runGeminiCoach } from '@/lib/gemini/coach';
import { geminiCoachRequestSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = geminiCoachRequestSchema.safeParse(json);

    const mode = validated.success ? validated.data.mode : (json.mode || 'crew');
    const message = validated.success ? validated.data.message : (json.message || '');
    const crewId = validated.success ? validated.data.crewId : json.crewId;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const result = await runGeminiCoach({
      mode,
      message,
      crewId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error('Gemini Coach API Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to get advice from Financial Coach right now.',
      },
      { status: 500 }
    );
  }
}
