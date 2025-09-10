const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Mock data
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
    expression: 'Status = "Active"',
    fields: ['Id', 'Name', 'Status'],
    fieldMappings: {
      id: 'Id',
      name: 'Name',
      status: 'Status'
    }
  }
];

// Mock semantic debt metrics
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
  res.json({ status: 'ok' });
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

app.post('/execute', (req, res) => {
  // Mock query execution
  res.json({
    data: [
      { id: '001', name: 'ACME Corp', status: 'Active' },
      { id: '002', name: 'TechStart Inc', status: 'Active' }
    ],
    lineage: {
      runId: `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
      steps: [{
        sourceId: 'sf',
        object: 'Account',
        fields: ['Id', 'Name', 'Status'],
        filter: 'Status = "Active"'
      }]
    }
  });
});

app.listen(PORT, () => {
  console.log(`Mock Translation Layer API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /terms');
  console.log('  GET  /sources');
  console.log('  GET  /rules');
  console.log('  GET  /semantic-debt/metrics');
  console.log('  GET  /semantic-debt/dashboard');
  console.log('  POST /execute');
});
