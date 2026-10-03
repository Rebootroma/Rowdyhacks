import { ReceiptIntegrityChecks } from '@/types/v2';
import { formatCents } from './money';

export interface RawExtractionReceipt {
  subtotal_cents?: number | null;
  tax_cents?: number | null;
  tip_cents?: number | null;
  total_cents: number;
  items?: Array<{ name: string; quantity?: number; amount_cents: number }>;
}

/**
 * Deterministic arithmetic integrity verification for receipt extractions.
 * CrewCash calculates — Gemini explains.
 */
export function verifyReceiptIntegrity(receipt: RawExtractionReceipt): ReceiptIntegrityChecks {
  const items = receipt.items ?? [];
  const itemSumCents = items.reduce((sum, item) => sum + item.amount_cents, 0);

  const subtotalCents = receipt.subtotal_cents ?? itemSumCents;
  const subtotalDifferenceCents = Math.abs(itemSumCents - subtotalCents);

  const taxCents = receipt.tax_cents ?? 0;
  const tipCents = receipt.tip_cents ?? 0;
  const computedTotalCents = subtotalCents + taxCents + tipCents;

  const printedTotalCents = receipt.total_cents;
  const printedTotalDifferenceCents = Math.abs(printedTotalCents - computedTotalCents);

  // Allow 1 cent tolerance for rounding if multiple items had partial cents
  const isConsistent = subtotalDifferenceCents <= 1 && printedTotalDifferenceCents <= 1;

  let notes: string;
  if (isConsistent) {
    notes = `Arithmetic verified: line items sum to ${formatCents(itemSumCents)}, tax/fees of ${formatCents(taxCents + tipCents)}, matching total of ${formatCents(printedTotalCents)}.`;
  } else {
    notes = `Arithmetic discrepancy flagged: computed total (${formatCents(computedTotalCents)}) differs from printed total (${formatCents(printedTotalCents)}) by ${formatCents(printedTotalDifferenceCents)}. Manual review recommended.`;
  }

  return {
    itemSumCents,
    subtotalCents,
    subtotalDifferenceCents,
    taxCents,
    tipCents,
    computedTotalCents,
    printedTotalCents,
    printedTotalDifferenceCents,
    isConsistent,
    notes,
  };
}
