import { Router } from 'express';
import { Engine } from '@translation/core/src/engine';
import { parseIntent } from '@translation/core/src/intent';
import { buildContext } from '@translation/core/src/contextBundle';
import { buildOpenAPI } from '@translation/codegen/src/openapiBuilder';
import { checkPolicy } from '@translation/policy/src/opaClient';
import { SalesforceConnector } from '@translation/connectors/src/salesforce';
import { RestConnector } from '@translation/connectors/src/rest';
import { SqlConnector } from '@translation/connectors/src/sql';
import { SemanticDebtAssessor } from '@translation/semantic-debt/src/assessment';
import { SemanticDebtCalculator } from '@translation/semantic-debt/src/semanticDebtCalculator';
import fs from 'fs';
import path from 'path';

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
  if (process.env.SALESFORCE_INSTANCE_URL && process.env.SALESFORCE_ACCESS_TOKEN) {
    connectors['sf'] = new SalesforceConnector('sf', {
      instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
      accessToken: process.env.SALESFORCE_ACCESS_TOKEN
    });
    sources['sf'] = {
      id: 'sf',
      kind: 'salesforce',
      name: 'Salesforce',
      config: { instanceUrl: process.env.SALESFORCE_INSTANCE_URL }
    };
  }

  // Define a simple semantic contract.  In practice this would be
  // persisted in a registry and support many terms and rules.  Here
  // we map the term "Active Customer" to both Salesforce Accounts
  // and the Catalog API.
  const contract = {
    id: 'contract_v1',
    name: 'Default Contract',
    terms: [
      { id: 't_active', name: 'Active Customer', description: 'Customer with current subscription and not churned' }
    ],
    rules: [
      {
        id: 'r_db_customer',
        termId: 't_active',
        sourceId: 'postgres',
        object: 'customers',
        expression: 'is_active = true AND status != \'churned\'',
        fields: ['id', 'name', 'region', 'is_active'],
        fieldMappings: {
          id: 'id',
          name: 'name',
          region: 'region',
          is_active: 'is_active'
        }
      },
      {
        id: 'r_sf_customer',
        termId: 't_active',
        sourceId: 'sf',
        object: 'Account',
        expression: 'Active__c = true AND Status__c != \''Churned\'',
        fields: ['Id', 'Name', 'BillingCountry', 'Active__c'],
        fieldMappings: {
          id: 'Id',
          name: 'Name',
          region: 'BillingCountry',
          is_active: 'Active__c'
        }
      },
      {
        id: 'r_rest_customer',
        termId: 't_active',
        sourceId: 'catalog',
        object: 'Customer',
        expression: "status = 'active'",
        fields: ['id', 'name', 'region', 'status'],
        fieldMappings: {
          id: 'id',
          name: 'name',
          region: 'region',
          is_active: "status = 'active'"
        }
      },
      {
        id: 'r_openfda_ndc',
        termId: 't_active',
        sourceId: 'openfda',
        object: 'drug/ndc.json',
        expression: 'brand_name:*',
        fields: ['brand_name', 'generic_name', 'product_ndc', 'dosage_form', 'route'],
        fieldMappings: {
          id: 'product_ndc',
          name: 'brand_name',
          region: 'route[0]',
          is_active: 'true'
        }
      }
    ],
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
            headers: src.config?.headers
          });
        } else if (src.kind === 'salesforce' && src.config?.instanceUrl && src.config?.accessToken) {
          (connectors as any)[src.id] = new SalesforceConnector(src.id, { instanceUrl: src.config.instanceUrl, accessToken: src.config.accessToken });
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
          headers: src.config?.headers
        });
      } else if (src.kind === 'salesforce' && src.config?.instanceUrl && src.config?.accessToken) {
        (connectors as any)[src.id] = new SalesforceConnector(src.id, { instanceUrl: src.config.instanceUrl, accessToken: src.config.accessToken });
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
  // definitions and schema hints.  For demonstration we call
  // describe() on the Salesforce connector only.
  r.get('/context', async (_req, res) => {
    const discovery = await sf.describe?.();
    const context = buildContext(contract, discovery as any);
    res.json(context);
  });

  // Expose raw sources and management endpoints for the admin UI
  r.get('/sources', (_req, res) => res.json(Object.values(sources)));
  r.get('/sources/:id', (req, res) => {
    const id = req.params.id;
    const src = (sources as any)[id];
    if (!src) return res.status(404).json({ error: 'not_found' });
    res.json(src);
  });
  r.put('/sources/:id', (req, res) => {
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
  r.post('/sources/:id/endpoints', (req, res) => {
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
  r.delete('/sources/:id/endpoints', (req, res) => {
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
  r.post('/sources', (req, res) => {
    const body = req.body || {};
    const id = body.id || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now();
    const kind = body.kind as ('salesforce' | 'rest' | 'sql');
    if (!kind) return res.status(400).json({ error: 'kind_required' });
    const name = body.name || id;
    const config = body.config || {};
    (sources as any)[id] = { id, kind, name, config };
    // Create connector instance if possible
    try {
      if (kind === 'rest' && config.baseUrl) {
        (connectors as any)[id] = new RestConnector(id, { baseUrl: config.baseUrl, manifest: undefined });
      } else if (kind === 'salesforce' && config.instanceUrl && config.accessToken) {
        (connectors as any)[id] = new SalesforceConnector(id, { instanceUrl: config.instanceUrl, accessToken: config.accessToken });
      } else if (kind === 'sql' && config) {
        (connectors as any)[id] = new SqlConnector(id, { client: 'pg' as any, connection: config });
      }
    } catch (_) {
      // ignore connector init errors; source is still created
    }
    res.status(201).json((sources as any)[id]);
  });
  r.get('/terms', (_req, res) => res.json(contract.terms));
  r.get('/rules', (_req, res) => res.json(contract.rules));

  // Semantic debt assessment endpoints
  r.get('/semantic-debt/metrics', async (_req, res) => {
    try {
      const assessor = new SemanticDebtAssessor(contract, []);
      const metrics = {
        overallScore: 72, // Mock for now - would be calculated from real data
        termCoverage: 65,
        lineageCompleteness: 78,
        wranglingMinutes: 45,
        reworkTickets: 12,
        monthlyWaste: 45000,
        annualWaste: 540000
      };
      res.json(metrics);
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

  r.get('/semantic-debt/dashboard', async (_req, res, next) => {
    try {
      // Mock dashboard data - in production this would aggregate from real usage
      const dashboardData = {
        metrics: {
          overallScore: 72,
          termCoverage: 65,
          lineageCompleteness: 78,
          wranglingMinutes: 45,
          reworkTickets: 12
        },
        recentActivity: [
          { type: 'term_reviewed', term: 'Active Customer', timestamp: new Date().toISOString() },
          { type: 'drift_detected', source: 'Salesforce', severity: 'low', timestamp: new Date().toISOString() }
        ],
        recommendations: [
          {
            priority: 'high',
            category: 'governance',
            action: 'Define clear definitions for top 10 ambiguous terms',
            expectedSavings: 25000,
            effort: 'medium'
          }
        ]
      };
      res.json(dashboardData);
    } catch (err) {
      next(err);
    }
  });

  // Main execution endpoint.  Accepts either a CanonicalQuery JSON
  // payload or a stringified intent.  We compile to concrete plans,
  // run per-plan policy checks, then execute and merge results.
  r.post('/execute', async (req, res, next) => {
    try {
      const body = req.body;
      const q = typeof body === 'string' ? parseIntent(body) : body;
      const plans = engine.compile(q);
      const opaUrl = process.env.OPA_URL || 'http://localhost:8181/v1/data/translation/allow';
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
      const out = await engine.executePlans(plans);
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  return r;
}