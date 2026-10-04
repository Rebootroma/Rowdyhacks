import { NextResponse } from 'next/server';
import { anchorApproval, toSolanaAnchorRecord } from '@/lib/solana/anchor';
import { getDemoState, saveSolanaAnchor } from '@/lib/demo/demo-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expenseId } = body;

    if (!expenseId) {
      return NextResponse.json({ error: 'expenseId is required' }, { status: 400 });
    }

    const state = getDemoState();
    const expense = state.expenses.find((e) => e.id === expenseId);
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const approvals = expense.approvals ?? [];
    const result = await anchorApproval({
      approvalId: `manual-anchor-${expense.id}`,
      expenseId: expense.id,
      amountCents: expense.amount_cents,
      finalizedAt: expense.updated_at || new Date().toISOString(),
      decisions: approvals.map((a) => ({
        userId: a.user_id,
        decision: a.decision,
        decidedAt: a.decided_at,
      })),
    });

    const anchorRecord = toSolanaAnchorRecord(expense.id, result);
    saveSolanaAnchor(anchorRecord);

    return NextResponse.json({
      success: true,
      anchor: anchorRecord,
      explorerUrl: result.explorerUrl,
      skipped: result.skipped,
      skipReason: result.skipReason,
    });
  } catch (error: any) {
    console.error('Failed to anchor expense to Solana:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to broadcast transaction to Solana Devnet' },
      { status: 500 }
    );
  }
}
