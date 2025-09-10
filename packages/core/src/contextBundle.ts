import { SemanticContract, DiscoverySummary } from './types';

/**
 * Build an LLM‑ready context bundle summarising the semantic contract
 * and optionally discovered objects/fields.  The bundle can be
 * injected into system prompts to give language models awareness of
 * business terms and safety rules.
 */
export function buildContext(contract: SemanticContract, discovery?: DiscoverySummary) {
  const terms = contract.terms.map(t => ({ name: t.name, description: t.description ?? '' }));
  const objects = discovery?.objects?.map(o => ({
    name: o.name,
    fields: o.fields.map(f => ({ name: f.name, type: f.type }))
  })) ?? [];
  return {
    purpose: 'Translation layer guidance',
    terms,
    objects,
    rules: contract.rules.map(r => ({ termId: r.termId, object: r.object, fields: r.fields, expression: r.expression })),
    safety: {
      readOnly: true,
      allowedOperators: ['=', 'IN', 'LIKE', '>', '<', '>=', '<='],
      lineageRequired: true
    }
  };
}