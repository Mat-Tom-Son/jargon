const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data that mimics what the full Translation Layer would provide
const mockTerms = [
  {
    id: 'active_customer',
    name: 'Active Customer',
    description: 'A customer with a paid subscription in the last 90 days who has not churned'
  },
  {
    id: 'revenue',
    name: 'Revenue',
    description: 'Recognized revenue from customer subscriptions and services'
  }
];

const mockSources = [
  {
    id: 'sf',
    name: 'Salesforce',
    kind: 'salesforce'
  },
  {
    id: 'postgres',
    name: 'Customer Database',
    kind: 'sql'
  }
];

const mockRules = [
  {
    id: 'r1',
    termId: 'active_customer',
    sourceId: 'sf',
    object: 'Account',
    expression: 'Status__c = "Active"',
    fields: ['Id', 'Name', 'Status'],
    fieldMappings: {
      id: 'Id',
      name: 'Name',
      status: 'Status__c'
    }
  }
];

// Semantic debt assessment data
const mockMetrics = {
  overallScore: 72,
  termCoverage: 65,
  lineageCompleteness: 78,
  wranglingMinutes: 45,
  reworkTickets: 12,
  monthlyWaste: 45000,
  annualWaste: 540000
};

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Translation Layer Gateway Running' });
});

app.get('/terms', (req, res) => {
  res.json(mockTerms);
});

app.get('/sources', (req, res) => {
  res.json(mockSources);
});

app.get('/rules', (req, res) => {
  res.json(mockRules);
});

// Semantic debt endpoints
app.get('/semantic-debt/metrics', (req, res) => {
  res.json(mockMetrics);
});

app.get('/semantic-debt/dashboard', (req, res) => {
  res.json({
    metrics: mockMetrics,
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
  });
});

app.post('/semantic-debt/assess', (req, res) => {
  const input = req.body;
  // Simple assessment calculation
  const score = Math.min(100, Math.max(0, 50 + (input.businessTerms - input.definedTerms) * 2));

  res.json({
    overallScore: score,
    semanticDebtLevel: score >= 80 ? 'low' : score >= 60 ? 'moderate' : 'high',
    metrics: {
      termCoverage: Math.round((input.definedTerms / input.businessTerms) * 100),
      lineageCompleteness: 78,
      wranglingEfficiency: Math.max(0, 100 - (input.avgTimeToAnswer || 45)),
      reworkFrequency: Math.max(0, 100 - (input.monthlyReworkTickets || 12) * 5)
    },
    estimatedCosts: {
      monthlyWaste: (input.avgTimeToAnswer || 45) * 50 * 20,
      annualWaste: (input.avgTimeToAnswer || 45) * 50 * 20 * 12
    },
    recommendations: [
      {
        priority: 'high',
        category: 'governance',
        action: 'Define clear definitions for top 10 ambiguous terms',
        expectedSavings: 25000,
        effort: 'medium',
        timeframe: '1-3 months'
      }
    ]
  });
});

// Query execution endpoint
app.post('/execute', (req, res) => {
  const query = req.body;
  console.log('Executing query:', query);

  // Mock query execution with lineage
  res.json({
    data: [
      { id: '001', name: 'ACME Corp', status: 'Active', region: 'North America' },
      { id: '002', name: 'TechStart Inc', status: 'Active', region: 'Europe' },
      { id: '003', name: 'GlobalTech Ltd', status: 'Active', region: 'Asia' }
    ],
    lineage: {
      runId: `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
      steps: [{
        sourceId: 'sf',
        object: query.object || 'Account',
        fields: query.select || ['id', 'name', 'status'],
        filter: query.where ? JSON.stringify(query.where) : null,
        query: query
      }]
    },
    definitions: {
      'Active Customer': 'A customer with a paid subscription in the last 90 days who has not churned',
      'id': 'Unique identifier for the customer',
      'name': 'Customer name',
      'status': 'Current customer status'
    }
  });
});

// Context endpoint for LLM integration
app.get('/context', (req, res) => {
  res.json({
    purpose: 'Translation layer guidance for LLMs',
    terms: mockTerms.map(t => ({ name: t.name, description: t.description })),
    objects: [
      {
        name: 'Account',
        fields: [
          { name: 'Id', type: 'id', nullable: false },
          { name: 'Name', type: 'string', nullable: false },
          { name: 'Status__c', type: 'string', nullable: true }
        ]
      }
    ],
    rules: mockRules.map(r => ({
      termId: r.termId,
      object: r.object,
      fields: r.fields,
      expression: r.expression
    })),
    safety: {
      readOnly: true,
      allowedOperators: ['=', 'IN', 'LIKE', '>', '<', '>=', '<='],
      lineageRequired: true
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Translation Layer Gateway running on http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /terms');
  console.log('  GET  /sources');
  console.log('  GET  /rules');
  console.log('  GET  /semantic-debt/metrics');
  console.log('  GET  /semantic-debt/dashboard');
  console.log('  POST /semantic-debt/assess');
  console.log('  POST /execute');
  console.log('  GET  /context');
  console.log('');
  console.log('💡 This gateway provides mock data for development.');
  console.log('💡 Use the mock-server.js for simpler testing.');
});
