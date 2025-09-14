# Authentication Setup

## Quick Start (5 minutes)

### 1. Install JWT dependency
```bash
cd apps/gateway
npm install jsonwebtoken
```

### 2. Set JWT secret
```bash
export JWT_SECRET="your-secret-key-here"
```

### 3. Add auth to your routes
```javascript
const auth = require('./src/middleware/auth');

// Optional auth (existing endpoints work unchanged)
app.use('/api/execute', auth.optional, executeQuery);

// Required auth (protect admin endpoints)  
app.use('/admin', auth.required, adminRoutes);
```

### 4. Get a token
```bash
curl -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### 5. Use the token
```bash
curl localhost:3001/api/execute \
  -H "Authorization: Bearer <your-token>" \
  -d '{"term":"active_customers"}'
```

## Configuration

- `JWT_SECRET` - Secret key for signing tokens (required)
- `JWT_EXPIRES_IN` - Token expiration (default: "24h")

## Default Credentials

**Change in production:**
- Username: `admin`
- Password: `admin`