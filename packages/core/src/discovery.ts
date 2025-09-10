import { Connector } from '@translation/connectors/src/base';
import { DiscoverySummary } from './types';

/**
 * Discover metadata from a connector.  For connectors that support
 * describe() we simply call it; otherwise we fall back to sampling
 * endpoints and inferring field names and types.
 */
export async function discover(connector: Connector): Promise<DiscoverySummary> {
  if (connector.describe) {
    return connector.describe();
  }
  if (!connector.listEndpoints) {
    throw new Error('Connector does not support discovery');
  }
  const endpoints = await connector.listEndpoints();
  const objects: any[] = [];
  for (const ep of endpoints) {
    try {
      const sample = await connector.sample?.(ep, 25);
      const inferred = inferFields(sample || []);
      objects.push({ name: ep, fields: inferred, hints: {} });
    } catch {
      // ignore endpoints that fail sampling
    }
  }
  return { objects };
}

function inferFields(rows: any[]): any[] {
  if (!rows.length) return [];
  const names = new Set<string>();
  rows.slice(0, 10).forEach(r => Object.keys(r).forEach(k => names.add(k)));
  return Array.from(names).map(name => ({ name, type: guessType(rows.map(r => r[name])), nullable: true }));
}

function guessType(values: any[]): string {
  const sample = values.find(v => v !== null && v !== undefined);
  if (typeof sample === 'number') return 'number';
  if (typeof sample === 'boolean') return 'boolean';
  if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) return 'timestamp';
  return 'string';
}