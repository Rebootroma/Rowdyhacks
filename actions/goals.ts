'use server';

import { contributeGoalSchema } from '@/lib/validation/schemas';
import { contributeToGoal } from '@/lib/demo/demo-store';
import { revalidatePath } from 'next/cache';

export async function contributeGoalAction(goalId: string, amountCents: number) {
  try {
    const validated = contributeGoalSchema.parse({ goalId, amountCents });
    const updated = contributeToGoal(validated.goalId, validated.amountCents);

    revalidatePath('/dashboard');
    revalidatePath('/crew');

    return { success: true, goal: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to contribute to goal' };
  }
}
