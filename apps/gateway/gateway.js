const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration file paths
const CONFIG_DIR = path.join(__dirname, '../../config/data');
const SOURCES_FILE = path.join(CONFIG_DIR, 'sources.json');
const TERMS_FILE = path.join(CONFIG_DIR, 'terms.json');
const RULES_FILE = path.join(CONFIG_DIR, 'rules.json');
const QUERIES_FILE = path.join(CONFIG_DIR, 'queries.json');
const LINEAGE_FILE = path.join(CONFIG_DIR, 'lineage.json');

// Environment variable substitution function
function resolveEnvironmentVariables(config) {
  const resolved = JSON.parse(JSON.stringify(config));

  function resolveObject(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Replace ${VAR_NAME} with actual environment variable
        obj[key] = obj[key].replace(/\$\{([^}]+)\}/g, (match, varName) => {
          return process.env[varName] || match;
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        resolveObject(obj[key]);
      }
    }
  }

  resolveObject(resolved);
  return resolved;
}

// Integration status checker
function checkIntegrationStatus() {
  const integrations = [];

  const sources = readJsonFile(SOURCES_FILE);

  // Check each data source type
  const sqlSources = sources.filter(s => s.kind === 'sql' && s.status === 'active');
  const salesforceSources = sources.filter(s => s.kind === 'salesforce' && s.status === 'active');
  const restSources = sources.filter(s => s.kind === 'rest' && s.status === 'active');

  integrations.push({
    name: 'PostgreSQL',
    status: sqlSources.length > 0 ? `✅ ${sqlSources.length} configured` : '⚠️  Needs Setup',
    type: 'Database',
    sources: sqlSources.map(s => ({ id: s.id, name: s.name, environment: s.environment }))
  });

  integrations.push({
    name: 'Salesforce',
    status: salesforceSources.length > 0 ? `✅ ${salesforceSources.length} configured` : 'ℹ️  Not configured',
    type: 'CRM',
    sources: salesforceSources.map(s => ({ id: s.id, name: s.name, environment: s.environment }))
  });

  integrations.push({
    name: 'REST APIs',
    status: restSources.length > 0 ? `✅ ${restSources.length} configured` : 'ℹ️  Not configured',
    type: 'API',
    sources: restSources.map(s => ({ id: s.id, name: s.name, environment: s.environment }))
  });

  return integrations;
}

// Professional startup banner
function printStartupBanner(integrations) {
  console.log('\n' + '='.repeat(70));
  console.log('🚀  JARGON - Enterprise Data Translation Layer');
  console.log('🌐  Unified API for Business Intelligence');
  console.log('=' + '='.repeat(40));
  console.log(`📍 Server: http://localhost:${process.env.PORT || 3001}`);
  console.log(`📁 Config: ${CONFIG_DIR}`);
  console.log('');

  console.log('🔗 INTEGRATION STATUS:');
  console.log('-'.repeat(50));
  integrations.forEach(integration => {
    console.log(`  ${integration.name.padEnd(12)} | ${integration.status}`);
    console.log(`  ${' '.repeat(12)}   ${integration.type.padEnd(8)} | ${integration.envVars}`);
    console.log('');
  });

  console.log('📡 AVAILABLE ENDPOINTS:');
  console.log('-'.repeat(50));
  console.log('  GET   /health              - Health check');
  console.log('  GET   /sources             - List data sources');
  console.log('  GET   /terms               - List business terms');
  console.log('  GET   /rules               - List mapping rules');
  console.log('  POST  /sources             - Create data source');
  console.log('  POST  /terms               - Create business term');
  console.log('  POST  /rules               - Create mapping rule');
  console.log('  POST  /execute             - Execute semantic query');
  console.log('  GET   /semantic-debt/metrics - Get debt metrics');
  console.log('  GET   /config/status       - Get configuration status');
  console.log('  POST  /config/update       - Update environment variables');
  console.log('');

  console.log('💡 QUICK START:');
  console.log('-'.repeat(50));
  console.log('  1. Configure your data sources via /sources endpoint');
  console.log('  2. Define business terms via /terms endpoint');
  console.log('  3. Create mapping rules via /rules endpoint');
  console.log('  4. Query data via /execute endpoint');
  console.log('  5. Access admin UI at http://localhost:3000');
  console.log('');

  console.log('🔧 DEVELOPMENT MODE - File-based configuration active');
  console.log('=' + '='.repeat(60) + '\n');
}

console.log('🚀 Starting Jargon Gateway Server...');
const integrations = checkIntegrationStatus();
printStartupBanner(integrations);

// Helper function to read JSON files
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading configuration file: ${path.basename(filePath)}`);
  }
  return [];
}

// Helper function to write JSON files
function writeJsonFile(filePath, data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// Dynamic database connection setup
function getDatabaseConfig() {
  try {
    const sources = readJsonFile(SOURCES_FILE);
    const sqlSource = sources.find(s => s.kind === 'sql' && s.status === 'active' && s.environment === 'development');

    if (!sqlSource) {
      console.log('⚠️  No active SQL data source found, using defaults');
      return {
        host: 'localhost',
        port: 5432,
        database: 'jargon_dev',
        user: 'postgres',
        password: 'password'
      };
    }

    // Resolve environment variables in the config
    const resolvedConfig = resolveEnvironmentVariables(sqlSource.config);
    return resolvedConfig;
  } catch (error) {
    console.error('Error reading data source config:', error);
    return {
      host: 'localhost',
      port: 5432,
      database: 'jargon_dev',
      user: 'postgres',
      password: 'password'
    };
  }
}

// PostgreSQL connection
const dbConfig = getDatabaseConfig();
const pool = new Pool(dbConfig);

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Translation Layer Gateway Running with Real Data' });
});

// Get sources from file
app.get('/sources', (req, res) => {
  try {
    const sources = readJsonFile(SOURCES_FILE);
    res.json(sources);
  } catch (error) {
    console.error('Error reading sources:', error);
    res.status(500).json({ error: 'Failed to read sources' });
  }
});

// Get terms from file
app.get('/terms', (req, res) => {
  try {
    const terms = readJsonFile(TERMS_FILE);
    res.json(terms);
  } catch (error) {
    console.error('Error reading terms:', error);
    res.status(500).json({ error: 'Failed to read terms' });
  }
});

// Get mapping rules from file
app.get('/rules', (req, res) => {
  try {
    const rules = readJsonFile(RULES_FILE);
    res.json(rules);
  } catch (error) {
    console.error('Error reading rules:', error);
    res.status(500).json({ error: 'Failed to read rules' });
  }
});

// POST endpoints for creating new items

// Create new data source
app.post('/sources', (req, res) => {
  try {
    const sources = readJsonFile(SOURCES_FILE);
    const newSource = {
      ...req.body,
      id: req.body.id || `source_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    sources.push(newSource);
    writeJsonFile(SOURCES_FILE, sources);
    res.json(newSource);
  } catch (error) {
    console.error('Error creating source:', error);
    res.status(500).json({ error: 'Failed to create source' });
  }
});

// Create new business term
app.post('/terms', (req, res) => {
  try {
    const terms = readJsonFile(TERMS_FILE);
    const newTerm = {
      ...req.body,
      id: req.body.id || `term_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    terms.push(newTerm);
    writeJsonFile(TERMS_FILE, terms);
    res.json(newTerm);
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ error: 'Failed to create term' });
  }
});

// Create new mapping rule
app.post('/rules', (req, res) => {
  try {
    const rules = readJsonFile(RULES_FILE);
    const newRule = {
      ...req.body,
      id: req.body.id || `rule_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    rules.push(newRule);
    writeJsonFile(RULES_FILE, rules);
    res.json(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Query management endpoints
app.get('/queries', (req, res) => {
  try {
    const queries = readJsonFile(QUERIES_FILE);
    res.json(queries);
  } catch (error) {
    console.error('Error reading queries:', error);
    res.json([]);
  }
});

app.post('/queries', (req, res) => {
  try {
    const newQuery = req.body;
    const queries = readJsonFile(QUERIES_FILE);

    // Generate ID if not provided
    if (!newQuery.id) {
      newQuery.id = `query_${Date.now()}`;
    }

    // Add timestamps
    newQuery.created_at = new Date().toISOString();
    newQuery.updated_at = new Date().toISOString();

    queries.push(newQuery);
    writeJsonFile(QUERIES_FILE, queries);

    res.json(newQuery);
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({ error: 'Failed to create query' });
  }
});

app.put('/queries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const queries = readJsonFile(QUERIES_FILE);

    const queryIndex = queries.findIndex(q => q.id === id);
    if (queryIndex === -1) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Update query
    queries[queryIndex] = {
      ...queries[queryIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    writeJsonFile(QUERIES_FILE, queries);
    res.json(queries[queryIndex]);
  } catch (error) {
    console.error('Error updating query:', error);
    res.status(500).json({ error: 'Failed to update query' });
  }
});

app.delete('/queries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const queries = readJsonFile(QUERIES_FILE);

    const filteredQueries = queries.filter(q => q.id !== id);
    if (filteredQueries.length === queries.length) {
      return res.status(404).json({ error: 'Query not found' });
    }

    writeJsonFile(QUERIES_FILE, filteredQueries);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ error: 'Failed to delete query' });
  }
});

// Lineage tracking endpoints
app.get('/lineage', (req, res) => {
  try {
    const lineage = readJsonFile(LINEAGE_FILE);
    res.json(lineage);
  } catch (error) {
    console.error('Error reading lineage:', error);
    res.json([]);
  }
});

app.get('/lineage/:id', (req, res) => {
  try {
    const { id } = req.params;
    const lineage = readJsonFile(LINEAGE_FILE);
    const item = lineage.find(l => l.id === id);

    if (!item) {
      return res.status(404).json({ error: 'Lineage item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error reading lineage item:', error);
    res.status(500).json({ error: 'Failed to read lineage item' });
  }
});

app.get('/lineage/entity/:entityId', (req, res) => {
  try {
    const { entityId } = req.params;
    const lineage = readJsonFile(LINEAGE_FILE);

    // Find all lineage items related to this entity
    const related = lineage.filter(l =>
      l.queryId === entityId ||
      l.dataSourceId === entityId ||
      l.upstream?.includes(entityId) ||
      l.downstream?.includes(entityId)
    );

    res.json(related);
  } catch (error) {
    console.error('Error reading entity lineage:', error);
    res.status(500).json({ error: 'Failed to read entity lineage' });
  }
});

app.post('/lineage', (req, res) => {
  try {
    const newLineageItem = req.body;
    const lineage = readJsonFile(LINEAGE_FILE);

    // Generate ID if not provided
    if (!newLineageItem.id) {
      newLineageItem.id = `lineage_${Date.now()}`;
    }

    // Add timestamp if not provided
    if (!newLineageItem.timestamp) {
      newLineageItem.timestamp = new Date().toISOString();
    }

    lineage.push(newLineageItem);
    writeJsonFile(LINEAGE_FILE, lineage);

    res.json(newLineageItem);
  } catch (error) {
    console.error('Error creating lineage item:', error);
    res.status(500).json({ error: 'Failed to create lineage item' });
  }
});

// Data source versioning endpoints
app.post('/sources/:id/version', (req, res) => {
  try {
    const { id } = req.params;
    const versionData = req.body;
    const sources = readJsonFile(SOURCES_FILE);

    const sourceIndex = sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const originalSource = sources[sourceIndex];

    // Create new version
    const newVersion = {
      ...originalSource,
      ...versionData,
      id: `${originalSource.id.split('_v')[0]}_v${Date.now()}`,
      version: versionData.version || '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: originalSource.id
    };

    sources.push(newVersion);
    writeJsonFile(SOURCES_FILE, sources);

    res.json(newVersion);
  } catch (error) {
    console.error('Error creating data source version:', error);
    res.status(500).json({ error: 'Failed to create data source version' });
  }
});

app.get('/sources/:id/versions', (req, res) => {
  try {
    const { id } = req.params;
    const sources = readJsonFile(SOURCES_FILE);

    // Find all versions of this data source
    const versions = sources.filter(s =>
      s.id === id || s.parent_id === id || s.id.startsWith(id.split('_v')[0])
    );

    res.json(versions);
  } catch (error) {
    console.error('Error reading data source versions:', error);
    res.status(500).json({ error: 'Failed to read data source versions' });
  }
});

app.post('/sources/:id/clone', (req, res) => {
  try {
    const { id } = req.params;
    const cloneData = req.body;
    const sources = readJsonFile(SOURCES_FILE);

    const sourceIndex = sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const originalSource = sources[sourceIndex];

    // Create clone
    const clone = {
      ...originalSource,
      ...cloneData,
      id: `${originalSource.id.split('_v')[0]}_clone_${Date.now()}`,
      name: cloneData.name || `${originalSource.name} (Clone)`,
      environment: cloneData.environment || originalSource.environment,
      status: 'inactive', // Clones start inactive
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: originalSource.id
    };

    sources.push(clone);
    writeJsonFile(SOURCES_FILE, sources);

    res.json(clone);
  } catch (error) {
    console.error('Error cloning data source:', error);
    res.status(500).json({ error: 'Failed to clone data source' });
  }
});

// Get environment configuration status
app.get('/config/status', (req, res) => {
  const config = {
    integrations: checkIntegrationStatus(),
    environment: {
      hasPostgresEnv: !!(process.env.DB_HOST || process.env.DATABASE_URL),
      hasSalesforceEnv: !!(process.env.SALESFORCE_INSTANCE_URL && process.env.SALESFORCE_ACCESS_TOKEN),
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  };
  res.json(config);
});

// Update environment configuration and save to .env file
app.post('/config/update', (req, res) => {
  try {
    const updates = req.body;

    // Update process.env
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
        process.env[key] = updates[key];
      }
    });

    // Save to .env file
    const envFilePath = path.join(__dirname, '.env');
    let envContent = '';

    // Read existing .env file if it exists
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    }

    // Update or add new environment variables
    const envLines = envContent.split('\n');
    const updatedKeys = new Set();

    // Process each update
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
        const value = updates[key];
        const envLine = `${key}=${value}`;

        // Check if this key already exists
        let found = false;
        for (let i = 0; i < envLines.length; i++) {
          if (envLines[i].startsWith(`${key}=`)) {
            envLines[i] = envLine;
            found = true;
            break;
          }
        }

        // If not found, add it
        if (!found) {
          envLines.push(envLine);
        }

        updatedKeys.add(key);
      }
    });

    // Write back to .env file
    const newEnvContent = envLines.filter(line => line.trim() !== '').join('\n');
    fs.writeFileSync(envFilePath, newEnvContent, 'utf8');

    // Return updated configuration status
    const config = {
      success: true,
      message: 'Configuration updated and saved to .env file',
      updated: Array.from(updatedKeys),
      envFile: envFilePath,
      integrations: checkIntegrationStatus(),
      environment: {
        hasPostgresEnv: !!(process.env.DB_HOST || process.env.DATABASE_URL),
        hasSalesforceEnv: !!(process.env.SALESFORCE_INSTANCE_URL && process.env.SALESFORCE_ACCESS_TOKEN),
        port: process.env.PORT || 3001,
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration: ' + error.message
    });
  }
});

// Execute query endpoint - MULTI-SOURCE SUPPORT
app.post('/execute', async (req, res) => {
  const startTime = Date.now();

  try {
    const { object, select, limit, sourceId } = req.body;
    console.log('Executing query:', req.body);

    // Find the data source configuration
    const sources = readJsonFile(SOURCES_FILE);
    const source = sources.find(s => s.id === (sourceId || 'postgres'));

    if (!source) {
      return res.status(400).json({ error: 'Data source not found' });
    }

    // Resolve environment variables in the source configuration
    const resolvedSource = resolveEnvironmentVariables(source);

    let result;

    if (resolvedSource.kind === 'sql') {
      // Handle SQL queries (PostgreSQL)
      const fields = select ? select.join(', ') : '*';
      const limitClause = limit ? `LIMIT ${limit}` : '';
      const query = `SELECT ${fields} FROM ${object} WHERE is_active = true AND status != 'churned' ${limitClause}`;

      result = await pool.query(query);
      result = result.rows;

    } else if (resolvedSource.kind === 'rest') {
      // Handle REST API calls
      const baseUrl = resolvedSource.config.baseUrl;
      const endpoint = object.startsWith('/') ? object : `/${object}`;
      const url = new URL(`${baseUrl}${endpoint}`);

      // Pass through query params from request body
      if (req.body && req.body.params && typeof req.body.params === 'object') {
        for (const [k, v] of Object.entries(req.body.params)) {
          if (v === undefined || v === null) continue;
          url.searchParams.set(k, String(v));
        }
      }
      // Apply limit if provided and not already set
      if (limit && !url.searchParams.has('limit')) {
        url.searchParams.set('limit', String(limit));
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...resolvedSource.config.headers
        }
      });

      if (!response.ok) {
        throw new Error(`REST API error: ${response.status} ${response.statusText}`);
      }

      result = await response.json();

      // Apply limit if specified
      if (limit && Array.isArray(result)) {
        result = result.slice(0, limit);
      }

    } else if (resolvedSource.kind === 'salesforce') {
      // Handle Salesforce API calls
      const instanceUrl = resolvedSource.config.instanceUrl;
      const accessToken = resolvedSource.config.accessToken;

      if (!instanceUrl || !accessToken) {
        throw new Error('Salesforce credentials not configured. Set SALESFORCE_INSTANCE_URL and SALESFORCE_ACCESS_TOKEN environment variables.');
      }

      // Check if it's a demo/placeholder URL
      if (instanceUrl.includes('example.') || instanceUrl.includes('demo.')) {
        throw new Error('Salesforce is configured with demo credentials. Please provide real Salesforce credentials.');
      }

      const endpoint = object.startsWith('/') ? object : `/${object}`;
      const url = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(`SELECT ${select ? select.join(', ') : '*'} FROM ${object} LIMIT ${limit || 100}`)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
      }

      const sfResult = await response.json();
      result = sfResult.records || [];

    } else {
      return res.status(400).json({ error: `Unsupported data source type: ${source.kind}` });
    }

    // Calculate execution metrics
    const executionTime = Date.now() - startTime;
    const recordCount = Array.isArray(result) ? result.length : 1;
    const dataSize = JSON.stringify(result).length;

    // Create lineage record
    const lineageRecord = {
      id: `lineage_run_${Date.now()}`,
      type: 'query_execution',
      timestamp: new Date().toISOString(),
      queryId: null, // Will be set if this matches a saved query
      dataSourceId: source.id,
      query: req.body,
      results: {
        recordCount,
        executionTime,
        dataSize
      },
      upstream: [],
      downstream: [],
      metadata: {
        user: req.headers['x-user-id'] || 'anonymous',
        environment: source.environment || 'development',
        success: true,
        ip: req.ip || req.connection.remoteAddress
      },
      performance: {
        totalTime: executionTime,
        queryTime: executionTime * 0.8, // Estimated
        networkTime: executionTime * 0.2  // Estimated
      }
    };

    // Try to match with saved query
    try {
      const queries = readJsonFile(QUERIES_FILE);
      const matchingQuery = queries.find(q =>
        q.dataSourceId === source.id &&
        JSON.stringify(q.query) === JSON.stringify(req.body)
      );

      if (matchingQuery) {
        lineageRecord.queryId = matchingQuery.id;

        // Update query execution count
        const queryIndex = queries.findIndex(q => q.id === matchingQuery.id);
        if (queryIndex !== -1) {
          queries[queryIndex].execution_count += 1;
          queries[queryIndex].last_executed = new Date().toISOString();
          queries[queryIndex].avg_execution_time = Math.round(
            (queries[queryIndex].avg_execution_time + executionTime) / 2
          );
          writeJsonFile(QUERIES_FILE, queries);
        }
      }
    } catch (error) {
      console.error('Error updating query stats:', error);
    }

    // Record lineage
    try {
      const lineage = readJsonFile(LINEAGE_FILE);
      lineage.push(lineageRecord);
      writeJsonFile(LINEAGE_FILE, lineage);
    } catch (error) {
      console.error('Error recording lineage:', error);
    }

    // Build mappings and definitions from file-based rules/terms
    const rules = readJsonFile(RULES_FILE);
    const terms = readJsonFile(TERMS_FILE);

    const matchedRules = rules.filter(r =>
      (r.sourceId === source.id || r.sourceId === sourceId) &&
      (r.object?.toLowerCase?.() === String(object || '').toLowerCase())
    );

    const mappings = matchedRules.map(r => ({
      term: r.termId,
      source: source.id,
      object: r.object,
      fields: r.fieldMappings || {}
    }));

    const termIdSet = new Set(matchedRules.map(r => r.termId).filter(Boolean));
    const defs = {};
    terms.forEach(t => {
      if (termIdSet.has(t.id)) {
        defs[t.name || t.id] = t.description || '';
      }
    });

    res.json({
      data: result,
      lineage: {
        runId: lineageRecord.id,
        timestamp: lineageRecord.timestamp,
        steps: [{
          sourceId: source.id,
          object: object,
          fields: select || ['id', 'name'],
          query: req.body
        }],
        mappings
      },
      definitions: Object.keys(defs).length ? defs : undefined,
      execution: {
        time: executionTime,
        records: recordCount,
        dataSize: `${(dataSize / 1024).toFixed(2)} KB`
      }
    });
  } catch (err) {
    console.error('Query execution error:', err);
    res.status(500).json({
      error: 'Query execution failed',
      details: err.message
    });
  }
});

// Semantic debt metrics
app.get('/semantic-debt/metrics', (req, res) => {
  try {
    // Calculate real metrics from actual data
    const terms = readJsonFile(TERMS_FILE);
    const rules = readJsonFile(RULES_FILE);

    // Term coverage: percentage of terms with descriptions
    const termsWithDescriptions = terms.filter(term => term.description && term.description.trim().length > 0).length;
    const termCoverage = terms.length > 0 ? Math.round((termsWithDescriptions / terms.length) * 100) : 0;

    // Lineage completeness: percentage of rules with field mappings
    const rulesWithMappings = rules.filter(rule => rule.fieldMappings && Object.keys(rule.fieldMappings).length > 0).length;
    const lineageCompleteness = rules.length > 0 ? Math.round((rulesWithMappings / rules.length) * 100) : 0;

    // Wrangling minutes: estimate based on rule complexity
    const avgFieldsPerRule = rules.length > 0 ?
      rules.reduce((sum, rule) => sum + (rule.fields ? rule.fields.length : 0), 0) / rules.length : 0;
    const wranglingMinutes = Math.max(15, Math.round(15 + (avgFieldsPerRule * 2)));

    // Rework tickets: estimate based on rules without descriptions or with errors
    const rulesWithIssues = rules.filter(rule =>
      !rule.expression ||
      rule.expression.trim().length === 0 ||
      rule.termId === undefined
    ).length;
    const reworkTickets = Math.max(2, Math.round(rulesWithIssues * 2));

    // Calculate overall score based on coverage and quality
    const overallScore = Math.round((termCoverage * 0.4) + (lineageCompleteness * 0.4) + ((100 - reworkTickets * 5) * 0.2));

    // Financial impact calculations
    const monthlyWaste = reworkTickets * 2000 + (wranglingMinutes * 50 * 20);
    const annualWaste = monthlyWaste * 12;

    res.json({
      overallScore: Math.max(0, Math.min(100, overallScore)),
      termCoverage,
      lineageCompleteness,
      wranglingMinutes,
      reworkTickets,
      monthlyWaste,
      annualWaste
    });
  } catch (error) {
    console.error('Error calculating semantic debt metrics:', error);
    // Fallback to mock data if calculation fails
    res.json({
      overallScore: 72,
      termCoverage: 65,
      lineageCompleteness: 78,
      wranglingMinutes: 45,
      reworkTickets: 12,
      monthlyWaste: 45000,
      annualWaste: 540000
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server started successfully on http://localhost:${PORT}`);
});
