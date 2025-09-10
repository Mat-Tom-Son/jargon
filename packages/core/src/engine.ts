import { Compiler } from './compiler';
import { DataSourceRef, CanonicalQuery, ResponseEnvelope, Lineage, SafePlan, SemanticContract } from './types';
import { Connector } from '@translation/connectors/src/base';
import { emitLineage } from '@translation/lineage/src/emitter';

/**
 * Engine coordinates the translation process.  It holds a set of
 * connectors and data source definitions and a semantic contract.
 * It can compile CanonicalQueries into SafePlans, execute a set of
 * plans, and merge the results while emitting lineage.
 */
export class Engine {
  constructor(
    private connectors: Record<string, Connector>,
    private sources: Record<string, DataSourceRef>,
    private contract: SemanticContract
  ) {}

  compile(q: CanonicalQuery): SafePlan[] {
    return new Compiler(this.contract).compile(q);
  }

  async executePlans(plans: SafePlan[]): Promise<ResponseEnvelope> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const lineage: Lineage = { runId, timestamp: new Date().toISOString(), steps: [] };
    const notes: string[] = [];
    const merged: any[] = [];
    for (const plan of plans) {
      const connector = this.connectors[plan.sourceId];
      if (!connector) throw new Error(`No connector for source ${plan.sourceId}`);
      const { rows, step } = await connector.execute(plan.nativeQuery);
      lineage.steps.push(step);
      merged.push(...rows.map(r => ({ ...r, __source: plan.sourceId })));
    }
    emitLineage(lineage).catch(() => notes.push('lineage_emit_failed'));
    const definitions = Object.fromEntries(this.contract.terms.map(t => [t.name, t.description ?? '']));
    return { data: merged, lineage, definitions, notes };
  }
}