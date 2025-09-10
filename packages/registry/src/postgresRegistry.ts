import { PrismaClient } from '@prisma/client';
import { Registry } from './registry';
import { DataSourceRef, SemanticContract, Term, MappingRule } from '@translation/core/src/types';

/**
 * PostgresRegistry is a stub illustrating how a persistent registry
 * might be implemented using Prisma.  The actual methods are left
 * unimplemented for brevity.  In your own project you would
 * generate the Prisma client using a schema similar to the one
 * described in the documentation.
 */
export class PostgresRegistry implements Registry {
  private prisma = new PrismaClient();
  async getSources(): Promise<DataSourceRef[]> { return []; }
  async upsertSource(_s: DataSourceRef): Promise<void> { /* TODO */ }
  async getContract(_id: string): Promise<SemanticContract | null> { return null; }
  async setContract(_c: SemanticContract): Promise<void> { /* TODO */ }
  async listTerms(): Promise<Term[]> { return []; }
  async upsertTerm(_t: Term): Promise<void> { /* TODO */ }
  async listRules(): Promise<MappingRule[]> { return []; }
  async upsertRule(_r: MappingRule): Promise<void> { /* TODO */ }
}