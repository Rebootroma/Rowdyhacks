import { NextResponse } from 'next/server';
import {
  createSolanaConnection,
  isSolanaConfigured,
  loadSolanaKeypair,
  getSolanaRpcUrl,
} from '@/lib/solana/client';

export async function GET() {
  try {
    const configured = isSolanaConfigured();
    if (!configured) {
      return NextResponse.json({
        configured: false,
        message: 'SOLANA_PRIVATE_KEY not configured',
        network: 'devnet',
      });
    }

    const keypair = loadSolanaKeypair();
    const connection = createSolanaConnection();
    const balanceLamports = await connection.getBalance(keypair.publicKey);

    return NextResponse.json({
      configured: true,
      publicKey: keypair.publicKey.toBase58(),
      balanceSol: balanceLamports / 1e9,
      balanceLamports,
      network: 'devnet',
      rpcUrl: getSolanaRpcUrl(),
      explorerUrl: `https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet`,
    });
  } catch (error: any) {
    console.error('Failed to get Solana status:', error);
    return NextResponse.json(
      { configured: false, error: error.message || 'Solana RPC unavailable' },
      { status: 500 }
    );
  }
}
