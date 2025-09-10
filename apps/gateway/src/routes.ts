import { Router } from 'express';
import { Engine } from '@translation/core/src/engine';
import { parseIntent } from '@translation/core/src/intent';
import { buildContext } from '@translation/core/src/contextBundle';
import { buildOpenAPI } from '@translation/codegen/src/openapiBuilder';
import { checkPolicy } from '@translation/policy/src/opaClient';
import { SalesforceConnector } from '@translation/connectors/src/salesforce';
import { RestConnector } from '@translation/connectors/src/rest';
import { SemanticDebtAssessor } from '@translation/semantic-debt/src/assessment';
import { SemanticDebtCalculator } from '@translation/semantic-debt/src/semanticDebtCalculator';

/**
 * Construct an Express router exposing the translation API.  This
 * function performs all bootstrapping of connectors and the semantic
 * contract.  In a real deployment you would load these from a
 * registry or configuration store.
 */
export function makeRouter() {
  const r = Router();

  // Boot two sources: Salesforce and a generic REST API.  These
  // connectors are stubs; you should replace the configuration
  // parameters with real credentials and endpoints.
  const sf = new SalesforceConnector('sf', { instanceUrl: 'https://example.my.salesforce.com', accessToken: 'x' });
  const rest = new RestConnector('catalog', { baseUrl: 'https://api.example.com', manifest: { endpoints: ['/customers', '/orders'] } });

  const connectors = { sf, catalog: rest } as const;
  const sources = {
    sf: { id: 'sf', kind: 'salesforce', name: 'Salesforce', config: {} },
    catalog: { id: 'catalog', kind: 'rest', name: 'Catalog API', config: { baseUrl: 'https://api.example.com' } }
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
      }
    ],
    constraints: { defaultLimit: 50, maxLimit: 200 }
  } as any;

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