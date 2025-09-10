import { Registry } from './registry';
import { DataSourceRef, SemanticContract, Term, MappingRule } from '@translation/core/src/types';

/**
 * In‑memory implementation of the Registry interface.  Useful for
 * development and testing.  In a real deployment you would replace
 * this with a persistent implementation backed by a database.
 */
export class MemoryRegistry implements Registry {
  private sources: Record<string, DataSourceRef> = {};
  private contract: SemanticContract | null = null;
  private terms: Record<string, Term> = {};
  private rules: Record<string, MappingRule> = {};

  async getSources(): Promise<DataSourceRef[]> {
    return Object.values(this.sources);
  }
  async upsertSource(s: DataSourceRef): Promise<void> {
    this.sources[s.id] = s;
  }
  async getContract(): Promise<SemanticContract | null> {
    return this.contract;
  }
  async setContract(c: SemanticContract): Promise<void> {
    this.contract = c;
  }
  async listTerms(): Promise<Term[]> {
    return Object.values(this.terms);
  }
  async upsertTerm(t: Term): Promise<void> {
    this.terms[t.id] = t;
  }
  async listRules(): Promise<MappingRule[]> {
    return Object.values(this.rules);
  }
  async upsertRule(r: MappingRule): Promise<void> {
    this.rules[r.id] = r;
  }
}