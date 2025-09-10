import { DiscoverySummary } from '@translation/core/src/types';
import { makeStep } from '@translation/core/src/lineage';

export interface ExecuteResult {
  rows: any[];
  step: ReturnType<typeof makeStep>;
}

export interface Connector {
  id: string;
  kind: 'salesforce' | 'rest' | 'sql';
  describe?(): Promise<DiscoverySummary>;
  listEndpoints?(): Promise<string[]>;
  sample?(endpoint: string, n: number): Promise<any[]>;
  execute(nativeQuery: any): Promise<ExecuteResult>;
}