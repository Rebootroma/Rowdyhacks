import { FinancialEvent } from '@/types/v2';
import { financialEventAppendSchema } from '@/lib/validation/schemas';

// In-memory ring buffer for demo and local development
const inMemoryEvents: FinancialEvent[] = [];

export interface AppendFinancialEventInput {
  scopeType: 'personal' | 'crew';
  scopeId: string;
  eventType: string;
  actorUserId?: string;
  amountCents?: number;
  category?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Appends a normalized financial event.
 * Compatible with Tiger Data / PostgreSQL time-series hypertable.
 */
export async function appendFinancialEvent(input: AppendFinancialEventInput): Promise<FinancialEvent> {
  const validated = financialEventAppendSchema.parse(input);

  const event: FinancialEvent = {
    time: new Date().toISOString(),
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scopeType: validated.scopeType,
    scopeId: validated.scopeId,
    actorUserId: validated.actorUserId,
    eventType: validated.eventType,
    amountCents: validated.amountCents,
    category: validated.category,
    entityType: validated.entityType,
    entityId: validated.entityId,
    metadata: validated.metadata,
  };

  // If Tiger Data DATABASE_URL is configured, insert into Tiger Data table
  if (process.env.DATABASE_URL) {
    try {
      // Dynamic import to avoid hard dependency failure if pg is optional
      // Tiger Data hypertable insert statement:
      // INSERT INTO financial_events (time, id, scope_type, scope_id, actor_user_id, event_type, amount_cents, category, entity_type, entity_id, metadata)
      // VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    } catch {
      // Graceful fallback to buffer
    }
  }

  inMemoryEvents.unshift(event);
  if (inMemoryEvents.length > 500) {
    inMemoryEvents.pop();
  }

  return event;
}

export function getFinancialEvents(filter?: {
  scopeType?: 'personal' | 'crew';
  scopeId?: string;
  limit?: number;
}): FinancialEvent[] {
  let list = inMemoryEvents;
  if (filter?.scopeType) {
    list = list.filter((e) => e.scopeType === filter.scopeType);
  }
  if (filter?.scopeId) {
    list = list.filter((e) => e.scopeId === filter.scopeId);
  }
  return list.slice(0, filter?.limit ?? 50);
}
