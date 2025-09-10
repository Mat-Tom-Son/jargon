import { Connector } from './base';
import { makeStep } from '@translation/core/src/lineage';

/**
 * Generic REST connector.  Supports discovery by sampling endpoints and
 * simple query execution by building query parameters.  The API is
 * assumed to return JSON.  This connector is intentionally naive.
 */
export class RestConnector implements Connector {
  id: string;
  kind = 'rest' as const;
  baseUrl: string;
  manifest?: { endpoints: string[] };
  constructor(id: string, cfg: { baseUrl: string; manifest?: { endpoints: string[] } }) {
    this.id = id;
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
    this.manifest = cfg.manifest;
  }
  async listEndpoints() {
    if (this.manifest) return this.manifest.endpoints;
    return ['/items', '/records', '/users'];
  }
  async sample(endpoint: string, n = 25) {
    const url = `${this.baseUrl}${endpoint}?limit=${n}`;
    // const res = await fetch(url);
    // const json = await res.json();
    const json = [{ id: 1, name: 'stub', region: 'US' }];
    return Array.isArray(json) ? json : [json];
  }
  async execute(nativeQuery: any) {
    const url = this.buildUrl(nativeQuery);
    // const res = await fetch(url);
    // const json = await res.json();
    const json = [{ id: 1, name: 'ACME', status: 'active' }];
    const rows = Array.isArray(json) ? json : [json];
    return { rows, step: makeStep(this.id, { ...nativeQuery, sourceId: this.id, fields: nativeQuery.select, operators: [] } as any) };
  }
  private buildUrl(q: any) {
    const params: string[] = [];
    if (q.limit) params.push(`limit=${q.limit}`);
    (q.where ?? []).forEach((w: any, i: number) => {
      params.push(`filter[${i}][${w.field}]=${w.op}:${w.value}`);
    });
    const endpoint = q.endpoint || `/${q.object.toLowerCase()}s`;
    return `${this.baseUrl}${endpoint}?${params.join('&')}`;
  }
}