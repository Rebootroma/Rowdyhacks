'use server';

import { createExpenseSchema, recordApprovalSchema } from '@/lib/validation/schemas';
import { createExpense, recordApprovalDecision } from '@/lib/demo/demo-store';
import { revalidatePath } from 'next/cache';

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

    revalidatePath('/dashboard');
    revalidatePath('/crew');

    return { success: true, expense: updated };
  } catch (err: any) {
    console.error('Failed to record approval:', err);
    return { success: false, error: err.message || 'Failed to record decision' };
  }
}
