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

  // Boot data sources: PostgreSQL, Salesforce, and REST API
  // Replace configuration parameters with your real credentials
  const db = new SqlConnector('postgres', {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'jargon_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    }
  });

  const sf = new SalesforceConnector('sf', {
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || 'https://example.my.salesforce.com',
    accessToken: process.env.SALESFORCE_ACCESS_TOKEN || 'x'
  });

  const rest = new RestConnector('catalog', {
    baseUrl: process.env.REST_API_BASE_URL || 'https://jsonplaceholder.typicode.com',
    manifest: { endpoints: ['/users', '/posts'] }
  });
  const openfda = new RestConnector('openfda', {
    baseUrl: process.env.OPENFDA_BASE_URL || 'https://api.fda.gov',
    manifest: { endpoints: ['/drug/ndc.json', '/device/510k.json', '/drug/enforcement.json'] }
  });

  const connectors = { postgres: db, sf, catalog: rest, openfda } as const;
  const sources = {
    postgres: {
      id: 'postgres',
      kind: 'sql' as const,
      name: 'PostgreSQL Database',
      config: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'jargon_dev'
      }
    },
    sf: {
      id: 'sf',
      kind: 'salesforce' as const,
      name: 'Salesforce',
      config: { instanceUrl: process.env.SALESFORCE_INSTANCE_URL }
    },
    catalog: {
      id: 'catalog',
      kind: 'rest' as const,
      name: 'Catalog API',
      config: { baseUrl: process.env.REST_API_BASE_URL || 'https://jsonplaceholder.typicode.com' }
    },
    openfda: {
      id: 'openfda',
      kind: 'rest' as const,
      name: 'openFDA API',
      config: { baseUrl: process.env.OPENFDA_BASE_URL || 'https://api.fda.gov' }
    }
  } as const;

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
    const dataDir = path.resolve(process.cwd(), 'config', 'data');
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
        // Register connector for engine
        if (src.kind === 'rest') {
          (connectors as any)[src.id] = new RestConnector(src.id, { baseUrl: src.config.baseUrl, manifest: src.metadata?.endpoints ? { endpoints: src.metadata.endpoints } : undefined });
        } else if (src.kind === 'salesforce') {
          (connectors as any)[src.id] = new SalesforceConnector(src.id, { instanceUrl: src.config.instanceUrl, accessToken: src.config.accessToken || 'x' });
        } else if (src.kind === 'sql') {
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

  // Expose raw sources, terms and rules for the admin UI
  r.get('/sources', (_req, res) => res.json(Object.values(sources)));
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