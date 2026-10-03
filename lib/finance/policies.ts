import { ApprovalPolicy, PolicyEvaluationResult } from '@/types/v2';
import { Role } from '@/types/domain';
import { formatCents } from './money';

export const DEFAULT_APPROVAL_POLICIES: ApprovalPolicy[] = [
  {
    minCents: 0,
    maxCents: 4999, // < $50.00
    requiredApprovals: 0,
    requiredRoles: [],
    autoApprove: true,
    priority: 10,
  },
  {
    minCents: 5000, // $50.00 - $199.99
    maxCents: 19999,
    requiredApprovals: 1,
    requiredRoles: ['member', 'treasurer', 'owner'],
    autoApprove: false,
    priority: 20,
  },
  {
    minCents: 20000, // $200.00 - $499.99
    maxCents: 49999,
    requiredApprovals: 2,
    requiredRoles: ['member', 'treasurer', 'owner'],
    autoApprove: false,
    priority: 30,
  },
  {
    minCents: 50000, // $500.00+
    maxCents: null,
    requiredApprovals: 2,
    requiredRoles: ['owner', 'treasurer'],
    autoApprove: false,
    priority: 40,
  },
];

/**
 * Evaluates an expense against Crew approval policies.
 */
export function evaluateApprovalPolicy(
  amountCents: number,
  policies: ApprovalPolicy[] = DEFAULT_APPROVAL_POLICIES
): PolicyEvaluationResult {
  // Sort policies by priority descending, then by minCents descending
  const sorted = [...policies].sort((a, b) => {
    if ((b.priority ?? 0) !== (a.priority ?? 0)) {
      return (b.priority ?? 0) - (a.priority ?? 0);
    }
    return b.minCents - a.minCents;
  });

  const matched = sorted.find((p) => {
    if (amountCents < p.minCents) return false;
    if (p.maxCents !== null && p.maxCents !== undefined && amountCents > p.maxCents) return false;
    return true;
  });

  if (!matched) {
    // Default fallback: require 1 approval
    return {
      autoApprove: false,
      requiredApprovals: 1,
      requiredRoles: ['member', 'treasurer', 'owner'],
      ruleExplanation: `Standard governance: expenses of ${formatCents(amountCents)} require 1 approval.`,
    };
  }

  if (matched.autoApprove || matched.requiredApprovals === 0) {
    return {
      autoApprove: true,
      requiredApprovals: 0,
      requiredRoles: [],
      matchedPolicyId: matched.id,
      ruleExplanation: `Auto-approved: expense under ${matched.maxCents ? formatCents(matched.maxCents + 1) : 'threshold'} does not require manual review.`,
    };
  }

  const roleText = matched.requiredRoles.length > 0
    ? ` from ${matched.requiredRoles.join('/')}`
    : '';

  return {
    autoApprove: false,
    requiredApprovals: matched.requiredApprovals,
    requiredRoles: matched.requiredRoles,
    matchedPolicyId: matched.id,
    ruleExplanation: `Tier policy: ${matched.requiredApprovals} approval(s)${roleText} required for purchases of ${formatCents(amountCents)}.`,
  };
}

/**
 * Checks whether an expense's approval decisions satisfy the policy.
 */
export function canFinalizeApproval(
  policy: PolicyEvaluationResult,
  approvals: Array<{ userId: string; role: Role; decision: 'approved' | 'rejected' }>
): {
  finalized: boolean;
  status: 'approved' | 'rejected' | 'pending';
  missingRoles: string[];
  approvalsCount: number;
  rejectionsCount: number;
} {
  const rejections = approvals.filter((a) => a.decision === 'rejected');
  if (rejections.length > 0) {
    return {
      finalized: true,
      status: 'rejected',
      missingRoles: [],
      approvalsCount: approvals.filter((a) => a.decision === 'approved').length,
      rejectionsCount: rejections.length,
    };
  }

  if (policy.autoApprove) {
    return {
      finalized: true,
      status: 'approved',
      missingRoles: [],
      approvalsCount: 0,
      rejectionsCount: 0,
    };
  }

  const validApprovals = approvals.filter((a) => a.decision === 'approved');
  const approverRoles = new Set(validApprovals.map((a) => a.role));

  // Check required roles
  const missingRoles: string[] = [];
  if (policy.requiredRoles.length > 0) {
    if (policy.requiredRoles.includes('member')) {
      // Any valid member role (member, treasurer, owner) fulfills 'member'
      if (approverRoles.size === 0) {
        missingRoles.push('member');
      }
    } else {
      // Specific designated roles required (e.g. ['owner', 'treasurer'])
      for (const reqRole of policy.requiredRoles) {
        if (!approverRoles.has(reqRole as Role)) {
          missingRoles.push(reqRole);
        }
      }
    }
  }

  const hasEnoughApprovals = validApprovals.length >= policy.requiredApprovals;
  const satisfiesRoles = missingRoles.length === 0;

  if (hasEnoughApprovals && satisfiesRoles) {
    return {
      finalized: true,
      status: 'approved',
      missingRoles: [],
      approvalsCount: validApprovals.length,
      rejectionsCount: 0,
    };
  }

  return {
    finalized: false,
    status: 'pending',
    missingRoles,
    approvalsCount: validApprovals.length,
    rejectionsCount: 0,
  };
}
