/**
 * Strict Financial Math & Integer Cents Equal Split Algorithm.
 * Guarantees that the sum of member splits equals totalCents exactly,
 * with zero lost cents due to rounding.
 */
export function calculateEqualSplit(
  totalCents: number,
  userIds: string[]
): Array<{ userId: string; amountCents: number }> {
  if (userIds.length === 0) return [];
  if (totalCents < 0) throw new Error('Total cents cannot be negative');

  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents % userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    amountCents: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Validates custom splits to ensure their sum equals totalCents exactly.
 */
export function validateCustomSplits(
  totalCents: number,
  splits: Array<{ userId: string; amountCents: number }>
): { valid: boolean; diffCents: number } {
  const sum = splits.reduce((acc, s) => acc + s.amountCents, 0);
  return {
    valid: sum === totalCents,
    diffCents: totalCents - sum,
  };
}
