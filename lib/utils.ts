import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer cents into USD currency string.
 * Example: 4257 => "$42.57"
 */
export function formatCents(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((amountCents || 0) / 100);
}

/**
 * Parses user input dollars into integer cents.
 * Handles strings like "$42.57", "42.57", "100" => 4257, 10000
 */
export function parseDollarsToCents(val: string | number): number {
  if (typeof val === 'number') {
    return Math.round(val * 100);
  }
  const clean = val.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Format date string into readable user friendly format.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Generate a standard Vault invite code e.g. VAULT-7X9K2P
 */
export function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VAULT-${code}`;
}
