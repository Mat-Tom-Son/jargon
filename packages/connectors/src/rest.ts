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
  constructor(id: string, cfg: { baseUrl: string; manifest?: { endpoints: string[] }; headers?: Record<string, string> }) {
    this.id = id;
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
    this.manifest = cfg.manifest;
    this.defaultHeaders = cfg.headers;
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
      const results = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
          ? json.results
          : Array.isArray(json?.data)
            ? json.data
            : json ? [json] : [];
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
      rows = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
          ? json.results
          : Array.isArray(json?.data)
            ? json.data
            : json ? [json] : [];
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
}