import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_RPC = 'https://api.devnet.solana.com';
const DEFAULT_KEYPAIR_PATH = resolve(process.cwd(), 'keys/solana-devnet-keypair.json');

export function getSolanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL?.trim() || DEFAULT_RPC;
}

function resolvePrivateKeyRaw(): string | null {
  const fromEnv = process.env.SOLANA_PRIVATE_KEY?.trim();
  if (fromEnv) return fromEnv;

  const keypairPath =
    process.env.SOLANA_KEYPAIR_PATH?.trim() ||
    (existsSync(DEFAULT_KEYPAIR_PATH) ? DEFAULT_KEYPAIR_PATH : null);

  if (keypairPath && existsSync(keypairPath)) {
    return readFileSync(keypairPath, 'utf8').trim();
  }

  return null;
}

export function isSolanaConfigured(): boolean {
  return Boolean(resolvePrivateKeyRaw());
}

/**
 * Load a Solana CLI-compatible keypair from SOLANA_PRIVATE_KEY
 * (or keys/solana-devnet-keypair.json / SOLANA_KEYPAIR_PATH).
 * Supports:
 * - JSON byte array (Solana CLI `id.json` format): [1,2,...]
 * - Base58-encoded secret key
 */
export function loadSolanaKeypair(): Keypair {
  const raw = resolvePrivateKeyRaw();
  if (!raw) {
    throw new Error(
      'SOLANA_PRIVATE_KEY is not set (and no local Solana CLI keypair file was found)'
    );
  }

  try {
    if (raw.startsWith('[')) {
      const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
      return Keypair.fromSecretKey(bytes);
    }

    const decoded = bs58.decode(raw);
    return Keypair.fromSecretKey(decoded);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Invalid SOLANA_PRIVATE_KEY (expected Solana CLI JSON array or base58): ${message}`
    );
  }
}

export function createSolanaConnection(): Connection {
  return new Connection(getSolanaRpcUrl(), {
    commitment: 'confirmed',
  });
}
