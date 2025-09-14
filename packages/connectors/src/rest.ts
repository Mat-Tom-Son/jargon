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
  private defaultHeaders?: Record<string, string>;
  private resultPath?: string;
  constructor(id: string, cfg: { baseUrl: string; manifest?: { endpoints: string[] }; headers?: Record<string, string>; resultPath?: string }) {
    this.id = id;
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
    this.manifest = cfg.manifest;
    this.defaultHeaders = cfg.headers;
    this.resultPath = cfg.resultPath;
  }
  async listEndpoints() {
    if (this.manifest) return this.manifest.endpoints;
    return ['/items', '/records', '/users'];
  }
  async sample(endpoint: string, n = 25) {
    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${n}`;
    try {
      const res = await fetch(url, { headers: this.defaultHeaders });
      const json: any = await res.json();
      const results = this.extractResults(json);
      return results;
    } catch {
      return [];
    }
  }
  async execute(nativeQuery: any) {
    const url = this.buildUrl(nativeQuery);
    let rows: any[] = [];
    try {
      const res = await fetch(url, { headers: this.defaultHeaders });
      const json: any = await res.json();
      rows = this.extractResults(json);
    } catch {
      rows = [];
    }
    return { rows, step: makeStep(this.id, { ...nativeQuery, sourceId: this.id, fields: nativeQuery.select, operators: [] } as any) };
  }
  private buildUrl(q: any) {
    const params: string[] = [];
    if (q.limit) params.push(`limit=${encodeURIComponent(q.limit)}`);
    // Allow arbitrary pass-through params if provided
    if (q.params && typeof q.params === 'object') {
      for (const [k, v] of Object.entries(q.params)) {
        if (v === undefined || v === null) continue;
        params.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
    // Fallback naive where->filter mapping
    (q.where ?? []).forEach((w: any, i: number) => {
      params.push(`filter[${i}][${encodeURIComponent(w.field)}]=${encodeURIComponent(`${w.op}:${w.value}`)}`);
    });
    // Derive endpoint: prefer explicit endpoint; otherwise respect complex object paths
    let endpoint: string = q.endpoint;
    if (!endpoint) {
      const obj: string = String(q.object || '').replace(/^\/+/, '');
      if (obj.includes('/') || obj.endsWith('.json')) {
        endpoint = `/${obj}`;
      } else if (obj) {
        endpoint = `/${obj.toLowerCase()}s`;
      } else {
        endpoint = '/items';
      }
    }
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${this.baseUrl}${endpoint}${qs}`;
  }
  private extractResults(json: any): any[] {
    if (!json) return [];
    // Explicit result path wins
    if (this.resultPath) {
      const v = this.getByPath(json, this.resultPath);
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') return [v];
    }
    // Common envelopes
    const candidates = [
      (j: any) => (Array.isArray(j) ? j : null),
      (j: any) => (Array.isArray(j?.results) ? j.results : null),
      (j: any) => (Array.isArray(j?.data) ? j.data : null),
      (j: any) => (Array.isArray(j?.items) ? j.items : null),
      (j: any) => (Array.isArray(j?.records) ? j.records : null),
      (j: any) => (Array.isArray(j?.hits?.hits) ? j.hits.hits : null)
    ];
    for (const fn of candidates) {
      const out = fn(json);
      if (out) return out;
    }
    return [json];
  }
  private getByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }
}
