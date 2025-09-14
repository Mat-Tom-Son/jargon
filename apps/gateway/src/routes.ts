import { Router } from 'express';
import { Engine } from '@translation/core/src/engine';
import { parseIntent } from '@translation/core/src/intent';
import { buildContext } from '@translation/core/src/contextBundle';
import { discover } from '@translation/core/src/discovery';
import { profileFields } from '@translation/core/src/profiling';
import { buildOpenAPI } from '@translation/codegen/src/openapiBuilder';
import { checkPolicy } from '@translation/policy/src/opaClient';
import { RestConnector } from '@translation/connectors/src/rest';
import { SqlConnector } from '@translation/connectors/src/sql';
import { SemanticDebtAssessor } from '@translation/semantic-debt/src/assessment';
import { SemanticDebtCalculator } from '@translation/semantic-debt/src/semanticDebtCalculator';
import fs from 'fs';
import path from 'path';
import { requireAdmin, devOnly } from './middleware/auth';

/**
 * Construct an Express router exposing the translation API.  This
 * function performs all bootstrapping of connectors and the semantic
 * contract.  In a real deployment you would load these from a
 * registry or configuration store.
 */
export function makeRouter() {
  const r = Router();

  // Initialize connectors and sources from environment and config files only
  const connectors: Record<string, any> = {};
  const sources: Record<string, { id: string; kind: 'salesforce' | 'rest' | 'sql'; name: string; config: any }>= {};

  // Optionally register built-in SQL/SF connectors only if env vars are present
  if (process.env.DATABASE_URL || process.env.DB_HOST) {
    connectors['postgres'] = new SqlConnector('postgres', {
      client: 'pg',
      connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'jargon_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      }
    });
    sources['postgres'] = {
      id: 'postgres',
      kind: 'sql',
      name: 'PostgreSQL Database',
      config: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'jargon_dev'
      }
    };
  }
  // Salesforce removed per current project scope

  // Start with an empty contract; load real terms/rules from config files.
  const contract = {
    id: 'contract_v1',
    name: 'Default Contract',
    terms: [] as any[],
    rules: [] as any[],
    constraints: { defaultLimit: 50, maxLimit: 200 }
  } as any;

  // Merge in file-configured sources, terms, and rules to avoid hardcoding
  try {
    // Locate the monorepo config/data directory robustly regardless of cwd
    const findDataDir = (): string => {
      const candidates = [
        path.resolve(process.cwd(), 'config', 'data'),
        path.resolve(process.cwd(), '..', 'config', 'data'),
        path.resolve(process.cwd(), '..', '..', 'config', 'data'),
        path.resolve(__dirname, '..', '..', '..', 'config', 'data')
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
      return candidates[0];
    };
    const dataDir = findDataDir();
    const readJson = (file: string) => {
      const p = path.join(dataDir, file);
      if (!fs.existsSync(p)) return null;
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw);
    };
    const envSubstitute = (obj: any): any => {
      if (obj == null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(envSubstitute);
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          out[k] = v.replace(/\$\{([^}]+)\}/g, (_m, name) => process.env[String(name)] ?? '');
        } else {
          out[k] = envSubstitute(v);
        }
      }
      return out;
    };

    const fileSources = readJson('sources.json') as any[] | null;
    if (fileSources?.length) {
      for (const s of fileSources) {
        const src = envSubstitute(s);
        // Register source ref for /sources
        (sources as any)[src.id] = { id: src.id, kind: src.kind, name: src.name, config: src.config };
        // Register connector for engine from config file entries
        if (src.kind === 'rest' && src.config?.baseUrl) {
          (connectors as any)[src.id] = new RestConnector(src.id, {
            baseUrl: src.config.baseUrl,
            manifest: src.metadata?.endpoints ? { endpoints: src.metadata.endpoints } : undefined,
            headers: src.config?.headers,
            resultPath: src.config?.resultPath
          });
        } else if (src.kind === 'sql' && src.config) {
          (connectors as any)[src.id] = new SqlConnector(src.id, { client: 'pg' as any, connection: src.config });
        }
      }
    }

    const fileTerms = readJson('terms.json') as any[] | null;
    if (fileTerms?.length) {
      for (const t of fileTerms) {
        if (!(contract.terms as any[]).some((et: any) => et.id === t.id)) {
          (contract.terms as any[]).push(t);
        }
      }
    }

    const fileRules = readJson('rules.json') as any[] | null;
    if (fileRules?.length) {
      for (const r0 of fileRules) {
        if (!(contract.rules as any[]).some((er: any) => er.id === r0.id)) {
          (contract.rules as any[]).push(r0);
        }
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('File-config merge skipped:', e);
  }

  const engine = new Engine(connectors as any, sources as any, contract);

  const reinitConnector = (src: { id: string; kind: 'rest' | 'salesforce' | 'sql'; name: string; config: any; metadata?: any }) => {
    try {
      if (src.kind === 'rest' && src.config?.baseUrl) {
        (connectors as any)[src.id] = new RestConnector(src.id, {
          baseUrl: src.config.baseUrl,
          manifest: src.metadata?.endpoints ? { endpoints: src.metadata.endpoints } : undefined,
          headers: src.config?.headers,
          resultPath: src.config?.resultPath
        });
      } else if (src.kind === 'sql' && src.config) {
        (connectors as any)[src.id] = new SqlConnector(src.id, { client: 'pg' as any, connection: src.config });
      }
    } catch (_e) {
      // ignore reinit errors
    }
  };

  // Health endpoint
  r.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // OpenAPI spec endpoint for the translated API
  r.get('/openapi.json', (_req, res) => {
    const spec = buildOpenAPI();
    res.json(spec);
  });

  // Context bundle endpoint.  Returns an LLM‑ready bundle of term
  // definitions and schema hints.  If a sourceId is provided we
  // perform discovery on that connector; otherwise pick any describable.
  r.get('/context', async (req, res) => {
    const srcId = (req.query.sourceId as string) || undefined;
    let discovery: any = undefined;
    try {
      if (srcId && (connectors as any)[srcId]) {
        const conn = (connectors as any)[srcId];
        if (typeof conn.describe === 'function') {
          discovery = await conn.describe();
        } else {
          // Try generic discovery for REST via sampling
          discovery = await discover(conn);
        }
      } else {
        const conn = Object.values(connectors as any).find((c: any) => typeof c?.describe === 'function');
        discovery = await (conn as any)?.describe?.();
      }
    } catch {
      discovery = undefined;
    }
    const context = buildContext(contract, discovery as any);
    res.json(context);
  });

  // Expose raw sources and management endpoints for the admin UI
  r.get('/sources', (_req, res) => {
    try {
      const file = path.join(resolveDataDir(), 'sources.json');
      const fileArr = readJsonSafe(file);
      const memArr = Object.values(sources) as any[];
      const byId = new Map<string, any>();
      (fileArr as any[]).forEach((s: any) => byId.set(String(s.id), s));
      memArr.forEach((s: any) => {
        const existing = byId.get(String(s.id)) || {};
        byId.set(String(s.id), { ...existing, ...s });
      });
      return res.json(Array.from(byId.values()));
    } catch {
      return res.json(Object.values(sources));
    }
  });
  r.get('/sources/:id', (req, res) => {
    const id = req.params.id;
    const src = (sources as any)[id];
    if (src) return res.json(src);
    try {
      const file = path.join(resolveDataDir(), 'sources.json');
      const arr = readJsonSafe(file);
      const found = arr.find((s: any) => s.id === id);
      if (found) return res.json(found);
    } catch { /* ignore */ }
    return res.status(404).json({ error: 'not_found' });
  });
  // Discovery: infer objects/fields for a connector
  r.get('/sources/:id/discover', async (req, res) => {
    const id = req.params.id;
    const conn = (connectors as any)[id];
    if (!conn) return res.status(404).json({ error: 'not_found' });
    try {
      if (typeof conn.describe === 'function') {
        const out = await conn.describe();
        return res.json(out || { objects: [] });
      }
      const out = await discover(conn);
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'discover_failed' });
    }
  });
  // Sample: return up to n rows from a REST endpoint
  r.get('/sources/:id/sample', async (req, res) => {
    const id = req.params.id;
    const endpoint = String(req.query.endpoint || '');
    const n = parseInt(String(req.query.n || '25')) || 25;
    const conn = (connectors as any)[id];
    if (!conn) return res.status(404).json({ error: 'not_found' });
    if (!endpoint) return res.status(400).json({ error: 'endpoint_required' });
    try {
      const rows = await conn.sample?.(endpoint, n);
      res.json(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'sample_failed' });
    }
  });
  // Profile: compute simple field profiles from a sample
  r.get('/sources/:id/profile', async (req, res) => {
    const id = req.params.id;
    const endpoint = String(req.query.endpoint || '');
    const n = parseInt(String(req.query.n || '50')) || 50;
    const conn = (connectors as any)[id];
    if (!conn) return res.status(404).json({ error: 'not_found' });
    if (!endpoint) return res.status(400).json({ error: 'endpoint_required' });
    try {
      const rows = await conn.sample?.(endpoint, n);
      const profiles = profileFields(Array.isArray(rows) ? rows : []);
      res.json(profiles);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'profile_failed' });
    }
  });
  r.put('/sources/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const existing = (sources as any)[id];
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const updated = {
      ...existing,
      ...body,
      config: { ...(existing.config || {}), ...(body.config || {}) },
      metadata: { ...(existing.metadata || {}), ...(body.metadata || {}) }
    };
    (sources as any)[id] = updated;
    reinitConnector(updated as any);
    // Persist to file config if present
    try {
      const file = path.join(resolveDataDir(), 'sources.json');
      const arr = readJsonSafe(file);
      const idx = arr.findIndex((s: any) => s.id === id);
      if (idx !== -1) {
        arr[idx] = { ...arr[idx], ...updated };
        fs.writeFileSync(file, JSON.stringify(arr, null, 2));
      }
    } catch { /* ignore */ }
    res.json(updated);
  });
  r.get('/sources/:id/endpoints', async (req, res) => {
    const id = req.params.id;
    const conn = (connectors as any)[id];
    if (!conn) return res.status(404).json({ error: 'not_found' });
    try {
      const endpoints = await conn.listEndpoints?.();
      res.json(endpoints || []);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed_list_endpoints' });
    }
  });
  r.post('/sources/:id/endpoints', requireAdmin, (req, res) => {
    const id = req.params.id;
    const src = (sources as any)[id];
    if (!src) return res.status(404).json({ error: 'not_found' });
    const body = req.body || {};
    const toAdd: string[] = Array.isArray(body.endpoints)
      ? body.endpoints
      : (body.endpoint ? [String(body.endpoint)] : []);
    if (!toAdd.length) return res.status(400).json({ error: 'endpoint_required' });
    const current: string[] = src.metadata?.endpoints ? [...src.metadata.endpoints] : [];
    const set = new Set(current);
    for (const ep of toAdd) {
      if (typeof ep === 'string' && ep.trim()) set.add(ep.trim().startsWith('/') ? ep.trim() : `/${ep.trim()}`);
    }
    const updated = {
      ...src,
      metadata: { ...(src.metadata || {}), endpoints: Array.from(set) }
    };
    (sources as any)[id] = updated;
    reinitConnector(updated as any);
    res.status(201).json(updated.metadata.endpoints);
  });
  r.delete('/sources/:id/endpoints', requireAdmin, (req, res) => {
    const id = req.params.id;
    const src = (sources as any)[id];
    if (!src) return res.status(404).json({ error: 'not_found' });
    const body = req.body || {};
    const target: string = String(body.endpoint || '').trim();
    if (!target) return res.status(400).json({ error: 'endpoint_required' });
    const current: string[] = src.metadata?.endpoints ? [...src.metadata.endpoints] : [];
    const filtered = current.filter((e: string) => e !== target);
    const updated = { ...src, metadata: { ...(src.metadata || {}), endpoints: filtered } };
    (sources as any)[id] = updated;
    reinitConnector(updated as any);
    res.json(updated.metadata.endpoints);
  });
  // Delete a source entirely
  r.delete('/sources/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    if (!(sources as any)[id]) return res.status(404).json({ error: 'not_found' });
    delete (sources as any)[id];
    try {
      const file = path.join(resolveDataDir(), 'sources.json');
      const arr = readJsonSafe(file);
      const next = arr.filter((s: any) => s.id !== id);
      fs.writeFileSync(file, JSON.stringify(next, null, 2));
    } catch { /* ignore */ }
    res.json({ success: true });
  });
  r.post('/sources', requireAdmin, (req, res) => {
    const body = req.body || {};
    const id = body.id || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now();
    const kind = body.kind as ('rest' | 'sql');
    if (!kind) return res.status(400).json({ error: 'kind_required' });
    const name = body.name || id;
    const config = body.config || {};
    (sources as any)[id] = { id, kind, name, config };
    // Create connector instance if possible
    try {
      if (kind === 'rest' && config.baseUrl) {
        (connectors as any)[id] = new RestConnector(id, { baseUrl: config.baseUrl, manifest: undefined, resultPath: config?.resultPath });
      } else if (kind === 'sql' && config) {
        (connectors as any)[id] = new SqlConnector(id, { client: 'pg' as any, connection: config });
      }
    } catch (_) {
      // ignore connector init errors; source is still created
    }
    // Persist to file-based config
    try {
      const dataDir = resolveDataDir();
      const file = path.join(dataDir, 'sources.json');
      const arr = readJsonSafe(file);
      arr.push({ id, name, kind, status: 'active', environment: 'development', config });
      fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    } catch {
      // ignore file write errors in dev
    }
    res.status(201).json((sources as any)[id]);
  });
  r.get('/terms', (_req, res) => res.json(contract.terms));
  // Minimal create term (append to file + in-memory)
  r.post('/terms', (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `term_${Date.now()}`;
      const term = {
        id,
        name: body.name || id,
        description: body.description || '',
        owner: body.owner || 'Unassigned',
        category: body.category || 'General',
        tags: Array.isArray(body.tags) ? body.tags : []
      };
      // Update in-memory terms
      (contract.terms as any[]).push(term);
      // Persist to file
      const file = path.join(resolveDataDir(), 'terms.json');
      const arr = readJsonSafe(file);
      arr.push(term);
      fs.writeFileSync(file, JSON.stringify(arr, null, 2));
      res.status(201).json(term);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });
  r.get('/rules', (_req, res) => res.json(contract.rules));
  r.get('/rules/:id', (_req, res) => {
    const id = _req.params.id;
    const found = (contract.rules as any[]).find(r => r.id === id);
    if (!found) return res.status(404).json({ error: 'not_found' });
    res.json(found);
  });

  // Query persistence (file-backed)
  const resolveDataDir = (): string => {
    const candidates = [
      path.resolve(process.cwd(), 'config', 'data'),
      path.resolve(process.cwd(), '..', 'config', 'data'),
      path.resolve(process.cwd(), '..', '..', 'config', 'data'),
      path.resolve(__dirname, '..', '..', '..', 'config', 'data')
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return candidates[0];
  };
  const readJsonSafe = (file: string): any[] => {
    try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []; } catch { return []; }
  };

  // Persist a new mapping rule (append to file and in-memory contract)
  r.post('/rules', requireAdmin, (req, res) => {
    try {
      const body = req.body || {};
      const rule = {
        id: body.id || `rule_${Date.now()}`,
        termId: body.termId,
        sourceId: body.sourceId,
        object: body.object,
        expression: body.expression || '',
        fields: Array.isArray(body.fields) ? body.fields : [],
        fieldMappings: body.fieldMappings || {},
        created_at: new Date().toISOString()
      };
      if (!rule.termId || !rule.sourceId || !rule.object || !rule.fields.length) {
        return res.status(400).json({ error: 'invalid_rule' });
      }
      // Update in-memory contract
      (contract.rules as any[]).push(rule);
      // Append to file
      const file = path.join(resolveDataDir(), 'rules.json');
      const arr = readJsonSafe(file);
      arr.push(rule);
      fs.writeFileSync(file, JSON.stringify(arr, null, 2));
      res.status(201).json(rule);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // Update an existing mapping rule
  r.put('/rules/:id', requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const body = req.body || {};
      const file = path.join(resolveDataDir(), 'rules.json');
      const arr = readJsonSafe(file);
      const idx = arr.findIndex((x: any) => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not_found' });

      const updated = {
        ...arr[idx],
        termId: body.termId ?? arr[idx].termId,
        sourceId: body.sourceId ?? arr[idx].sourceId,
        object: body.object ?? arr[idx].object,
        expression: body.expression ?? arr[idx].expression ?? '',
        fields: Array.isArray(body.fields) ? body.fields : (arr[idx].fields || []),
        fieldMappings: body.fieldMappings ?? arr[idx].fieldMappings ?? {},
        updated_at: new Date().toISOString()
      };
      arr[idx] = updated;
      fs.writeFileSync(file, JSON.stringify(arr, null, 2));

      // Update in-memory contract
      const memIdx = (contract.rules as any[]).findIndex(r => r.id === id);
      if (memIdx !== -1) (contract.rules as any[])[memIdx] = updated;

      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // Delete a mapping rule
  r.delete('/rules/:id', requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const file = path.join(resolveDataDir(), 'rules.json');
      const arr = readJsonSafe(file);
      const next = arr.filter((x: any) => x.id !== id);
      if (next.length === arr.length) return res.status(404).json({ error: 'not_found' });
      fs.writeFileSync(file, JSON.stringify(next, null, 2));
      // Update in-memory contract
      contract.rules = (contract.rules as any[]).filter(r => r.id !== id) as any;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  r.get('/queries', (_req, res) => {
    const file = path.join(resolveDataDir(), 'queries.json');
    res.json(readJsonSafe(file));
  });
  r.get('/queries/:id', (req, res) => {
    const file = path.join(resolveDataDir(), 'queries.json');
    const arr = readJsonSafe(file);
    const q = arr.find((x: any) => x.id === req.params.id);
    if (!q) return res.status(404).json({ error: 'not_found' });
    res.json(q);
  });
  r.post('/queries', (req, res) => {
    const file = path.join(resolveDataDir(), 'queries.json');
    const arr = readJsonSafe(file);
    const body = req.body || {};
    const id = body.id || `query_${Date.now()}`;
    const now = new Date().toISOString();
    const rec = { ...body, id, termIds: Array.isArray(body.termIds) ? body.termIds : [], created_at: now, updated_at: now };
    arr.push(rec);
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    res.status(201).json(rec);
  });
  r.put('/queries/:id', (req, res) => {
    const file = path.join(resolveDataDir(), 'queries.json');
    const arr = readJsonSafe(file);
    const idx = arr.findIndex((x: any) => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not_found' });
    const body = req.body || {};
    arr[idx] = { ...arr[idx], ...body, termIds: Array.isArray(body.termIds) ? body.termIds : (arr[idx].termIds || []), id: req.params.id, updated_at: new Date().toISOString() };
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    res.json(arr[idx]);
  });
  r.delete('/queries/:id', (req, res) => {
    const file = path.join(resolveDataDir(), 'queries.json');
    const arr = readJsonSafe(file);
    const next = arr.filter((x: any) => x.id !== req.params.id);
    fs.writeFileSync(file, JSON.stringify(next, null, 2));
    res.json({ success: true });
  });

  // Semantic debt assessment endpoints
  r.get('/semantic-debt/metrics', async (_req, res, next) => {
    try {
      const dir = resolveDataDir();
      const terms: any[] = readJsonSafe(path.join(dir, 'terms.json')) as any;
      const rules: any[] = readJsonSafe(path.join(dir, 'rules.json')) as any;
      const queries: any[] = readJsonSafe(path.join(dir, 'queries.json')) as any;

      const totalTerms = terms.length || 0;
      const definedTerms = terms.filter(t => (t?.description || '').toString().trim().length > 0).length;
      const termCoverage = totalTerms ? Math.round((definedTerms / totalTerms) * 100) : 0;

      const published = queries.filter(q => !!q?.is_favorite);
      const publishedTermIds = new Set<string>();
      published.forEach(q => (Array.isArray(q.termIds) ? q.termIds : []).forEach((id: string) => publishedTermIds.add(id)));
      let publishedDefined = 0;
      if (publishedTermIds.size) {
        for (const tid of Array.from(publishedTermIds)) {
          const t = terms.find(tt => tt.id === tid);
          if (t && (t.description || '').toString().trim().length > 0) publishedDefined++;
        }
      }
      const publishedCoverage = publishedTermIds.size ? Math.round((publishedDefined / publishedTermIds.size) * 100) : 0;

      const withHistory = queries.filter(q => Array.isArray(q.history) && q.history.length > 0).length;
      const lineageCompleteness = queries.length ? Math.round((withHistory / queries.length) * 100) : 0;
      const publishedWithHistory = published.filter(q => Array.isArray(q.history) && q.history.length > 0).length;
      const lineageCompletenessPublished = published.length ? Math.round((publishedWithHistory / published.length) * 100) : 0;

      const rulesWithMappings = rules.filter(r => r && r.fieldMappings && Object.keys(r.fieldMappings).length > 0 && (r.expression || '').toString().trim().length > 0).length;
      const ruleCompleteness = rules.length ? Math.round((rulesWithMappings / rules.length) * 100) : 0;
      const rulesWithIssues = rules.length - rulesWithMappings;

      const avgFieldsPerRule = rules.length ? Math.round((rules.reduce((s, r) => s + ((Array.isArray(r.fields) ? r.fields.length : 0)), 0) / rules.length)) : 0;
      const wranglingMinutes = Math.max(5, Math.min(120, 10 + (2 * avgFieldsPerRule)));

      const publishedNoHistory = published.length - publishedWithHistory;
      const reworkTickets = Math.max(0, rulesWithIssues + publishedNoHistory);

      // Composite score (overall)
      const overallScore = Math.round(
        (termCoverage * 0.3) +
        (lineageCompleteness * 0.3) +
        (ruleCompleteness * 0.2) +
        (Math.max(0, 100 - wranglingMinutes) * 0.2)
      );

      const monthlyWaste = (reworkTickets * 1500) + (wranglingMinutes * 50 * Math.max(1, published.length));
      const annualWaste = monthlyWaste * 12;

      res.json({
        counts: {
          terms: totalTerms,
          rules: rules.length,
          savedQueries: queries.length,
          publishedQueries: published.length
        },
        termCoverage,
        termCoveragePublished: publishedCoverage,
        lineageCompleteness,
        lineageCompletenessPublished,
        ruleCompleteness,
        wranglingMinutes,
        reworkTickets,
        monthlyWaste,
        annualWaste,
        overallScore
      });
    } catch (err) {
      next(err);
    }
  });

  r.post('/semantic-debt/assess', async (req, res, next) => {
    try {
      const input = req.body;
      const calculator = new SemanticDebtCalculator();
      const assessment = calculator.calculate(input);
      res.json(assessment);
    } catch (err) {
      next(err);
    }
  });

  

  // Who Am I endpoint (for sanity checks)
  r.get('/whoami', (_req, res) => {
    res.json({ server: 'ts-gateway', version: '0.1.0', pid: process.pid });
  });

  // Configuration status (mirrors file-backed server summary)
  r.get('/config/status', (_req, res) => {
    const env = {
      hasPostgresEnv: !!(process.env.DB_HOST || process.env.DATABASE_URL),
      hasSalesforceEnv: false,
      port: Number(process.env.PORT || 3001),
      nodeEnv: process.env.NODE_ENV || 'development'
    };
    const getFile = (name: string) => {
      try {
        const p = path.join((() => {
          const candidates = [
            path.resolve(process.cwd(), 'config', 'data'),
            path.resolve(process.cwd(), '..', 'config', 'data'),
            path.resolve(process.cwd(), '..', '..', 'config', 'data'),
            path.resolve(__dirname, '..', '..', '..', 'config', 'data')
          ];
          for (const c of candidates) if (fs.existsSync(c)) return c;
          return candidates[0];
        })(), name);
        if (!fs.existsSync(p)) return [];
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {
        return [];
      }
    };
    const sourcesArr = getFile('sources.json');
    const sqlSources = sourcesArr.filter((s: any) => s.kind === 'sql' && s.status === 'active');
    const sfSources: any[] = [];
    const restSources = sourcesArr.filter((s: any) => s.kind === 'rest' && s.status === 'active');
    const integrations = [
      { name: 'PostgreSQL', status: sqlSources.length ? `✅ ${sqlSources.length} configured` : '⚠️  Needs Setup', type: 'Database', envVars: 'DATABASE_URL / DB_*' },
      { name: 'REST APIs', status: restSources.length ? `✅ ${restSources.length} configured` : 'ℹ️  Not configured', type: 'API', envVars: 'file-config' }
    ];
    res.json({ integrations, environment: env });
  });

  // Update environment configuration (dev only + admin)
  r.post('/config/update', devOnly, requireAdmin, (req, res) => {
    try {
      const updates = req.body || {};
      Object.keys(updates).forEach(k => {
        const v = updates[k];
        if (v !== undefined && v !== null && v !== '') (process.env as any)[k] = String(v);
      });
      const envPath = path.resolve(__dirname, '.env');
      let lines: string[] = [];
      if (fs.existsSync(envPath)) lines = fs.readFileSync(envPath, 'utf8').split('\n');
      const map = new Map(lines.filter(l => l.includes('=')).map(l => [l.split('=')[0], l] as const));
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === null || v === '') continue;
        map.set(k, `${k}=${v}`);
      }
      const out = Array.from(map.values()).filter(l => l.trim().length).join('\n');
      fs.writeFileSync(envPath, out, 'utf8');
      res.json({ success: true, updated: Object.keys(updates), envFile: envPath });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'failed' });
    }
  });

  // Main execution endpoint.  Accepts either a CanonicalQuery JSON
  // payload or a stringified intent.  We compile to concrete plans,
  // run per-plan policy checks, then execute and merge results.
  r.post('/execute', async (req, res, next) => {
    try {
      const body = req.body;
      const q = typeof body === 'string' ? parseIntent(body) : body;
      let plans;
      try {
        plans = engine.compile(q);
      } catch (e: any) {
        // Fallback: allow direct REST execution when a mapping rule is not present
        const sid = (q && (q as any).sourceId) as string | undefined;
        const conn = sid ? (connectors as any)[sid] : undefined;
        if (sid && conn && conn.kind === 'rest') {
          const operators = Array.from(new Set(((q.where || []) as any[]).map((w: any) => w.op))).filter(Boolean);
          const fields = Array.isArray(q.select) ? q.select : [];
          plans = [{ sourceId: sid, nativeQuery: { object: q.object, select: fields, where: q.where, limit: q.limit, params: (q as any).params }, operators, fields }];
        } else {
          throw e;
        }
      }
      const opaUrl = process.env.OPA_URL; // Enforce only if provided
      if (opaUrl) {
        const inputs = plans.map(p => ({
          object: (p.nativeQuery as any).object,
          fields: p.fields,
          operators: p.operators,
          pii_requested: false,
          tenant: 'default',
          role: 'analyst'
        }));
        const oks = await Promise.all(inputs.map(i => checkPolicy(opaUrl, i)));
        if (oks.some(ok => !ok)) return res.status(403).json({ error: 'policy_denied' });
      }
      const out = await engine.executePlans(plans);
      // Optionally append run history to queries.json if queryId provided
      try {
        const qid = (req.body && (req.body as any).queryId) as string | undefined;
        if (qid) {
          const file = path.join(resolveDataDir(), 'queries.json');
          const arr = readJsonSafe(file);
          const idx = arr.findIndex((x: any) => x.id === qid);
          if (idx !== -1) {
            const hist = Array.isArray(arr[idx].history) ? arr[idx].history : [];
            hist.unshift({ id: out.lineage.runId, timestamp: out.lineage.timestamp, object: (req.body as any).object, select: (req.body as any).select, limit: (req.body as any).limit, recordCount: Array.isArray(out.data) ? out.data.length : 0 });
            arr[idx].history = hist.slice(0, 20);
            arr[idx].last_executed = out.lineage.timestamp;
            arr[idx].execution_count = (arr[idx].execution_count || 0) + 1;
            fs.writeFileSync(file, JSON.stringify(arr, null, 2));

            // Merge associated term definitions
            try {
              const termsFile = path.join(resolveDataDir(), 'terms.json');
              const terms = readJsonSafe(termsFile);
              const termIds: string[] = Array.isArray(arr[idx].termIds) ? arr[idx].termIds : [];
              if (termIds.length) {
                const addDefs: Record<string, string> = {};
                termIds.forEach(tid => {
                  const t = terms.find((tt: any) => tt.id === tid);
                  if (t) addDefs[t.name || t.id] = t.description || '';
                });
                out.definitions = { ...(out.definitions || {}), ...addDefs };
              }
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore history failures */ }
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  return r;
}
