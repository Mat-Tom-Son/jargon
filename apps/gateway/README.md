# Jargon Gateway Server

The core API server for the Jargon Enterprise Data Translation Layer. This server provides a unified interface to query multiple data sources through a single semantic API.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Server will be available at http://localhost:3001
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in this directory:

```bash
# Database Configuration (for PostgreSQL/MySQL)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# OR individual settings:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password

# Salesforce Configuration
SALESFORCE_INSTANCE_URL=https://your-org.salesforce.com
SALESFORCE_ACCESS_TOKEN=your_access_token_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Data Sources Setup

The server supports multiple data source types:

#### PostgreSQL/MySQL Databases
- **Type**: `sql`
- **Required**: Database connection (env vars or DATABASE_URL)
- **Example Query**: `{"sourceId": "postgres", "object": "customers", "select": ["name", "email"]}`

#### Salesforce CRM
- **Type**: `salesforce`
- **Required**: Instance URL and Access Token
- **Example Query**: `{"sourceId": "salesforce", "object": "Account", "select": ["Name", "Industry"]}`

#### REST APIs
- **Type**: `rest`
- **Required**: Base URL (configured via sources.json)
- **Example Query**: `{"sourceId": "api_source", "object": "/users", "limit": 10}`

## 📡 API Endpoints

### Core Endpoints
- `GET /health` - Server health check
- `GET /sources` - List configured data sources
- `GET /terms` - List business terms
- `GET /rules` - List mapping rules
- `POST /execute` - Execute semantic queries

### Management Endpoints
- `POST /sources` - Create new data source
- `POST /terms` - Create new business term
- `POST /rules` - Create new mapping rule

### Configuration & Settings
- `GET /config/status` - Get current configuration and integration status
- `POST /config/update` - Update environment variables (development)

### Analytics
- `GET /semantic-debt/metrics` - Get semantic debt metrics

## 🔗 Integration Examples

### Adding a PostgreSQL Source
```bash
curl -X POST http://localhost:3001/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Database",
    "kind": "sql",
    "config": {
      "host": "prod-db.company.com",
      "database": "production",
      "user": "app_user",
      "password": "secure_password"
    }
  }'
```

### Adding a REST API Source
```bash
curl -X POST http://localhost:3001/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User API",
    "kind": "rest",
    "config": {
      "baseUrl": "https://api.company.com/v2",
      "headers": {
        "Authorization": "Bearer your_token"
      }
    }
  }'
```

### Executing Queries
```bash
# Query PostgreSQL
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "postgres",
    "object": "customers",
    "select": ["name", "email"],
    "limit": 10
  }'

# Query REST API
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "user_api",
    "object": "/users",
    "limit": 5
  }'
```

## 🏗️ Architecture

### File-Based Configuration
- **Sources**: `config/data/sources.json`
- **Terms**: `config/data/terms.json`
- **Rules**: `config/data/rules.json`

### Extensible Design
The server is designed to be easily extensible for new data source types:

1. Add new connector logic in the `/execute` endpoint
2. Update the integration status checker
3. Add appropriate environment variables
4. Document the new data source type

### Example: Adding a New Data Source Type
```javascript
} else if (source.kind === 'your_new_type') {
  // Your custom connector logic here
  const result = await yourCustomConnector.query(object, select, limit);
  // Process result...
}
```

## 🔍 Integration Status

On startup, the server will show:

```
🔗 INTEGRATION STATUS:
PostgreSQL    | ✅ Configured
Salesforce    | ⚠️  Needs Setup
REST APIs     | ✅ 2 configured
```

This helps developers quickly see what integrations are ready to use.

## 🎯 Development Workflow

1. **Setup**: Configure your data sources via environment variables and API calls
2. **Define**: Create business terms that represent your semantic concepts
3. **Map**: Create rules that connect terms to specific data source queries
4. **Query**: Use the `/execute` endpoint to query any data source through semantic terms
5. **Monitor**: Track performance and semantic debt metrics

## 🤝 Contributing

When adding new data source types:

1. Add connector logic to the `/execute` endpoint
2. Update the integration status checker
3. Add comprehensive error handling
4. Update this README with examples
5. Test with real data sources when possible

## 📊 Supported Data Sources

| Type | Status | Environment Variables | Notes |
|------|--------|----------------------|-------|
| PostgreSQL | ✅ Ready | `DATABASE_URL` or `DB_*` vars | Full SQL support |
| MySQL | ✅ Ready | `DATABASE_URL` or `DB_*` vars | Full SQL support |
| Salesforce | ✅ Ready | `SALESFORCE_*` vars | REST API integration |
| REST APIs | ✅ Ready | Configured via sources.json | Generic REST support |
| Custom | 🔄 Extensible | Varies by implementation | Add your own connectors |

---

**Jargon Gateway**: Your bridge between messy enterprise data and clean, semantic APIs! 🌉
