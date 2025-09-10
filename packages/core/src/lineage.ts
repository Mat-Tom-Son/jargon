import { Lineage, SafePlan } from './types';

/**
 * Build a lineage step.  Connectors should use this helper when
 * creating steps for the lineage envelope.
 */
export function makeStep(sourceId: string, plan: SafePlan): Lineage['steps'][number] {
  const nq: any = plan.nativeQuery;
  return {
    sourceId,
    object: nq.object ?? 'unknown',
    fields: plan.fields,
    filter: nq.where ?? null,
    query: typeof nq === 'string' ? nq : nq
  };
}