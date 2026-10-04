import { NextResponse } from 'next/server';
import { verifyOnChainDigest } from '@/lib/solana/anchor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signature, digest } = body;

    if (!signature || !digest) {
      return NextResponse.json(
        { ok: false, error: 'Both signature and digest are required' },
        { status: 400 }
      );
    }

    const verification = await verifyOnChainDigest({ signature, digest });
    return NextResponse.json(verification);
  } catch (error: any) {
    console.error('Failed to verify Solana digest:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Verification failed against Solana RPC' },
      { status: 500 }
    );
  }
}
