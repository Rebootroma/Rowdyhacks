/**
 * CrewCash V2 Money Utilities
 * Rule: All application money must strictly be represented as integer cents.
 * Never use floating-point numbers for money storage or transactions.
 */

export function formatCents(amountCents: number): string {
  const safeCents = Math.round(amountCents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeCents / 100);
}

export function parseCents(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error('Invalid number for cents');
    return Math.round(input);
  }

  if (typeof input !== 'string') {
    throw new Error('Input must be a string or number');
  }

  // Strip dollar sign, commas, spaces
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!cleaned) return 0;

  const parsed = Number(cleaned);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw new Error(`Cannot parse invalid monetary amount: ${input}`);
  }

  // Convert decimal to integer cents safely (e.g. "42.50" -> 4250)
  return Math.round(parsed * 100);
}

export function isValidCents(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0;
}

export function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100;
}

export function decimalToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
