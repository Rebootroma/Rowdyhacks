'use server';

import { createExpenseSchema, recordApprovalSchema } from '@/lib/validation/schemas';
import {
  createExpense,
  recordApprovalDecision,
  saveSolanaAnchor,
} from '@/lib/demo/demo-store';
import { anchorApproval, toSolanaAnchorRecord } from '@/lib/solana';
import { revalidatePath } from 'next/cache';
import type { SolanaAnchor } from '@/types/v2';

export async function createExpenseAction(formData: {
  crewId: string;
  title: string;
  merchant?: string | null;
  description?: string | null;
  amountCents: number;
  category: any;
  expenseDate: string;
  memberIds: string[];
  receiptPath?: string | null;
}) {
  try {
    const validated = createExpenseSchema.parse({
      crewId: formData.crewId,
      title: formData.title,
      merchant: formData.merchant,
      description: formData.description,
      amountCents: formData.amountCents,
      category: formData.category,
      expenseDate: formData.expenseDate,
      receiptPath: formData.receiptPath,
      splits: formData.memberIds.map((userId) => ({ userId, amountCents: 0 })), // Amount will be calculated by equalSplit
    });

    const newExpense = createExpense({
      title: validated.title,
      merchant: validated.merchant,
      description: validated.description,
      amountCents: validated.amountCents,
      category: validated.category,
      expenseDate: validated.expenseDate,
      memberIds: formData.memberIds,
      receiptPath: validated.receiptPath,
    });

    revalidatePath('/dashboard');
    revalidatePath(`/crew/${formData.crewId}`);
    revalidatePath(`/crew/${formData.crewId}/expenses`);
    revalidatePath(`/crew/${formData.crewId}/approvals`);

    return { success: true, expense: newExpense };
  } catch (err: any) {
    console.error('Failed to create expense:', err);
    return { success: false, error: err.message || 'Failed to submit expense' };
  }
}

export async function recordApprovalAction(expenseId: string, decision: 'approved' | 'rejected') {
  try {
    const validated = recordApprovalSchema.parse({ expenseId, decision });
    const updated = recordApprovalDecision(validated.expenseId, validated.decision);

    let solanaAnchor: SolanaAnchor | null = null;
    let solanaError: string | null = null;

    // Tamper-evident Devnet digest when dual-approval finalizes a high-value expense
    if (updated.status === 'approved' && updated.approval_required) {
      try {
        const approvals = updated.approvals ?? [];
        const finalApproval = [...approvals].reverse().find((a) => a.decision === 'approved');
        const result = await anchorApproval({
          approvalId: finalApproval?.id ?? `finalize-${updated.id}`,
          expenseId: updated.id,
          amountCents: updated.amount_cents,
          finalizedAt: updated.updated_at,
          decisions: approvals.map((a) => ({
            userId: a.user_id,
            decision: a.decision,
            decidedAt: a.decided_at,
          })),
        });

        solanaAnchor = saveSolanaAnchor(toSolanaAnchorRecord(updated.id, result));

        if (result.skipped) {
          solanaError = result.skipReason ?? 'Solana anchoring skipped';
        }
      } catch (anchorErr: any) {
        // Demo reliability: never fail the approval if Devnet/RPC is unavailable
        console.error('Solana anchor failed (approval still recorded):', anchorErr);
        solanaError = anchorErr?.message || 'Solana anchoring failed';
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/approvals');
    revalidatePath('/crew');

    return { success: true, expense: updated, solanaAnchor, solanaError };
  } catch (err: any) {
    console.error('Failed to record approval:', err);
    return { success: false, error: err.message || 'Failed to record decision' };
  }
}
