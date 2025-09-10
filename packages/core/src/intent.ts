import { CanonicalQuery } from './types';

/**
 * Parse a natural language input or a JSON payload into a
 * CanonicalQuery.  This stub supports either direct JSON or a
 * simple fallback for demonstration.  In a real system you would
 * replace this with an NL parser or intent recognition model.
 */
export function parseIntent(input: string): CanonicalQuery {
  try {
    return JSON.parse(input);
  } catch {
    // Trivial fallback: interpret common phrases
    const lower = input.toLowerCase();
    if (lower.includes('recent opportunities')) {
      return {
        object: 'Opportunity',
        select: ['Id', 'Name', 'StageName', 'Amount'],
        where: [{ field: 'CreatedDate', op: '>', value: 'LAST_N_DAYS:30' }],
        orderBy: { field: 'CreatedDate', direction: 'DESC' },
        limit: 20
      };
    }
    throw new Error('Could not parse input');
  }
}