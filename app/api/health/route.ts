import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbStatus = await checkDbConnection();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    demoMode,
    services: {
      tigerDataPostgres: {
        configured: Boolean(process.env.DATABASE_URL),
        connected: dbStatus.ok,
        details: dbStatus.message,
      },
      geminiAi: {
        configured: hasGemini,
        model: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-1.5-flash',
      },
    },
  });
}
