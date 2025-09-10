import { DataSourceRef, SemanticContract, Term, MappingRule } from '@translation/core/src/types';

/**
 * Registry defines the interface for storing and retrieving semantic
 * configuration.  Implementations may persist to memory, a database,
 * or another service.  The registry is responsible for sourcing
 * definitions of data sources, terms and mapping rules, and for
 * storing the active semantic contract.
 */
export interface Registry {
  getSources(): Promise<DataSourceRef[]>;
  upsertSource(source: DataSourceRef): Promise<void>;

  getContract(id: string): Promise<SemanticContract | null>;
  setContract(contract: SemanticContract): Promise<void>;

  listTerms(): Promise<Term[]>;
  upsertTerm(term: Term): Promise<void>;
  listRules(): Promise<MappingRule[]>;
  upsertRule(rule: MappingRule): Promise<void>;
}