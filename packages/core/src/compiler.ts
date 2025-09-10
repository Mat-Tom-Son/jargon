import { CanonicalQuery, SemanticContract, SafePlan } from './types';

/**
 * The compiler translates a semantic CanonicalQuery into concrete SafePlan
 * objects.  Each rule matching the semantic object produces a plan, so
 * the caller can fan out to multiple sources.  Field mappings are
 * resolved using MappingRule.fieldMappings.  Expressions may be
 * arbitrary strings that the connector will interpret.
 */
export class Compiler {
  constructor(private contract: SemanticContract) {}

  compile(q: CanonicalQuery): SafePlan[] {
    const rules = this.contract.rules.filter(r => r.object.toLowerCase().includes(q.object.toLowerCase()));
    if (!rules.length) throw new Error(`No mapping rule for '${q.object}'`);

    return rules.map(rule => {
      // Map each selected semantic field to a concrete expression
      const select = q.select.map(sf => {
        const mapping = rule.fieldMappings[sf];
        if (!mapping) throw new Error(`Missing mapping for '${sf}' on ${rule.object}`);
        return mapping;
      });
      // Map where clauses
      const where = (q.where ?? []).map(w => {
        const mapping = rule.fieldMappings[w.field];
        if (!mapping) throw new Error(`Missing mapping for '${w.field}' on ${rule.object}`);
        return { field: mapping, op: w.op, value: w.value };
      });
      // Respect contract limits
      const limit = Math.min(
        q.limit ?? (this.contract.constraints?.defaultLimit ?? 50),
        this.contract.constraints?.maxLimit ?? 200
      );
      const nativeQuery = {
        object: rule.object,
        select,
        where,
        orderBy: q.orderBy ?? { field: select[0], direction: 'ASC' as const },
        limit
      };
      const operators = Array.from(new Set(where.map(w => w.op)));
      const concreteFields = this.extractFieldsFromMappings(Object.values(rule.fieldMappings));
      return { sourceId: rule.sourceId, nativeQuery, operators, fields: concreteFields };
    });
  }

  private extractFieldsFromMappings(mappings: string[]): string[] {
    const rx = /[A-Za-z_][A-Za-z0-9_.]*/g;
    const s = new Set<string>();
    for (const m of mappings) {
      (m.match(rx) || []).forEach(f => s.add(f));
    }
    return Array.from(s);
  }
}