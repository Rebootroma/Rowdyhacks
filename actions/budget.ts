'use server';

import { setBudgetSchema } from '@/lib/validation/schemas';
import { updateBudget } from '@/lib/demo/demo-store';
import { revalidatePath } from 'next/cache';

export async function updateBudgetAction(formData: {
  crewId: string;
  month: string;
  amountCents: number;
  approvalThresholdCents: number;
}) {
  try {
    const validated = setBudgetSchema.parse(formData);
    const updated = updateBudget(validated.amountCents, validated.approvalThresholdCents);

    revalidatePath('/dashboard');
    revalidatePath(`/crew/${formData.crewId}`);

    return { success: true, budget: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update vault budget' };
  }
}
