# Mock Translation Layer API Server

A development server that simulates the Translation Layer API for frontend development and testing. Provides realistic mock data and API responses without requiring the full backend infrastructure.

## 🎯 **Purpose**

This mock server enables:

- **Frontend Development**: Build and test UI without backend setup
- **API Integration Testing**: Verify frontend API calls work correctly
- **Demo Environments**: Showcase functionality with realistic data
- **CI/CD Testing**: Automated testing without database dependencies

## 🚀 **Quick Start**

### **Installation**
```bash
# No installation needed - uses existing Node.js
node mock-server.js
```

### **Access the API**
```
Base URL: http://localhost:3001
Health Check: http://localhost:3001/health
```

## 📡 **API Endpoints**

### **Core Endpoints**
```bash
GET  /health              # Server health check
GET  /terms               # List business terms
GET  /sources             # List data sources
GET  /rules               # List mapping rules
POST /execute             # Execute semantic queries
```

### **Semantic Debt Endpoints**
```bash
GET  /semantic-debt/metrics       # Current debt scores
GET  /semantic-debt/dashboard     # Full assessment data
POST /semantic-debt/assess        # Run debt assessment
```

## 📊 **Mock Data Structure**

### **Business Terms**
```json
[
  {
    "id": "active_customer",
    "name": "Active Customer",
    "description": "A customer with a paid subscription in the last 90 days who has not churned"
  },
  {
    "id": "revenue",
    "name": "Revenue",
    "description": "Recognized revenue from customer subscriptions and services"
  }
]
```

### **Data Sources**
```json
[
  {
    "id": "sf",
    "name": "Salesforce",
    "kind": "salesforce"
  },
  {
    "id": "postgres",
    "name": "Customer Database",
    "kind": "sql"
  }
]
```

### **Mapping Rules**
```json
[
  {
    "id": "r1",
    "termId": "active_customer",
    "sourceId": "sf",
    "object": "Account",
    "expression": "Status__c = 'Active'",
    "fields": ["Id", "Name", "Status"],
    "fieldMappings": {
      "id": "Id",
      "name": "Name",
      "status": "Status__c"
    }
  }
]
```

### **Semantic Debt Metrics**
```json
{
  "overallScore": 72,
  "termCoverage": 65,
  "lineageCompleteness": 78,
  "wranglingMinutes": 45,
  "reworkTickets": 12,
  "monthlyWaste": 45000,
  "annualWaste": 540000
}
```

## 🔧 **Customization**

### **Modify Mock Data**
```javascript
// Edit the mock data objects at the top of mock-server.js
const mockTerms = [
  // Add your custom terms here
];

const mockSources = [
  // Add your custom sources here
];
```

### **Add New Endpoints**
```javascript
// Add new route handlers
app.get('/custom-endpoint', (req, res) => {
  res.json({ custom: 'data' });
});
```

### **Change Response Times**
```javascript
// Simulate API latency
app.use((req, res, next) => {
  setTimeout(next, Math.random() * 500); // 0-500ms delay
});
```

## 🧪 **Testing with Mock Server**

### **Frontend Integration Testing**
```bash
# Start mock server
node mock-server.js

# In another terminal, start frontend
cd frontend && npm run dev

# Test API calls in browser dev tools
fetch('http://localhost:3001/semantic-debt/metrics')
  .then(res => res.json())
  .then(data => console.log(data))
```

### **API Response Validation**
```bash
# Test all endpoints
curl -s http://localhost:3001/health
curl -s http://localhost:3001/terms | jq '.'
curl -s http://localhost:3001/semantic-debt/metrics | jq '.'
```

### **Load Testing**
```bash
# Simple load test
for i in {1..100}; do
  curl -s http://localhost:3001/semantic-debt/metrics > /dev/null &
done
```

## 🔄 **Transition to Real Backend**

### **1. Update API URLs**
```typescript
// Change from mock to real backend
const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://your-api.com'
  : 'http://localhost:3001'; // Keep for development
```

### **2. Handle Authentication**
```javascript
// Add auth headers to mock server
app.use((req, res, next) => {
  // Simulate auth middleware
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### **3. Add Data Persistence**
```javascript
// Simulate database operations
const fs = require('fs');

app.post('/terms', (req, res) => {
  const newTerm = req.body;
  // In real app: save to database
  // For mock: save to JSON file
  fs.writeFileSync('./mock-data/terms.json', JSON.stringify([...mockTerms, newTerm]));
  res.json(newTerm);
});
```

## 📊 **Mock Data Scenarios**

### **Healthy System**
```json
{
  "overallScore": 85,
  "termCoverage": 90,
  "lineageCompleteness": 95,
  "wranglingMinutes": 25,
  "reworkTickets": 3
}
```

### **Problematic System**
```json
{
  "overallScore": 35,
  "termCoverage": 40,
  "lineageCompleteness": 45,
  "wranglingMinutes": 120,
  "reworkTickets": 25
}
```

### **Custom Scenarios**
```javascript
// Switch between scenarios
const SCENARIO = process.env.MOCK_SCENARIO || 'normal';

if (SCENARIO === 'healthy') {
  mockMetrics.overallScore = 85;
} else if (SCENARIO === 'problematic') {
  mockMetrics.overallScore = 35;
}
```

## 🚀 **Advanced Features**

### **Real-time Updates**
```javascript
// Simulate WebSocket for real-time updates
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3002 });

wss.on('connection', (ws) => {
  // Send periodic updates
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'semantic-debt-update',
      data: mockMetrics
    }));
  }, 5000);
});
```

### **Error Simulation**
```javascript
// Simulate API errors for testing
app.get('/unreliable-endpoint', (req, res) => {
  if (Math.random() > 0.8) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  res.json({ success: true });
});
```

### **Request Logging**
```javascript
// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

## 🔧 **Environment Variables**

```bash
# Mock server configuration
PORT=3001
MOCK_SCENARIO=normal  # normal, healthy, problematic
ENABLE_WEBSOCKET=true
LOG_LEVEL=info
```

## 🤝 **Contributing**

When updating the mock server:

1. **Keep it simple** - Focus on API contract, not complex logic
2. **Realistic data** - Use plausible values and relationships
3. **Documentation** - Update this README for new endpoints
4. **Error handling** - Include appropriate error responses
5. **Performance** - Keep response times reasonable

## 📋 **Migration Checklist**

- [ ] Update frontend API base URLs
- [ ] Add authentication headers
- [ ] Handle rate limiting
- [ ] Implement error boundaries
- [ ] Add request/response logging
- [ ] Update environment variables
- [ ] Test all user flows
- [ ] Update documentation

---

**This mock server accelerates development while maintaining API compatibility.** 🚀
