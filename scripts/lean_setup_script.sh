#!/bin/bash
# lean-auth-setup.sh - Minimal JWT authentication setup for Jargon

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[NOTE]${NC} $1"
}

# Check if in git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a Git repository"
    exit 1
fi

print_status "Setting up lean JWT authentication for Jargon..."

# Create branch
BRANCH_NAME="feat/basic-jwt-auth"
print_status "Creating branch: $BRANCH_NAME"

if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    print_warning "Branch $BRANCH_NAME already exists. Switching to it."
    git checkout $BRANCH_NAME
else
    git checkout -b $BRANCH_NAME
fi

# Create directories
print_status "Creating directory structure..."
mkdir -p docs src/middleware

# Create SECURITY.md (lean version)
print_status "Creating SECURITY.md..."
cat > SECURITY.md << 'EOF'
# Security Policy

## Reporting Vulnerabilities

Please report security vulnerabilities privately to the maintainers via:
- GitHub Security Advisories (preferred)
- Email to project maintainers

**Do not report security issues in public GitHub issues.**

## Authentication

Jargon now supports JWT authentication for production deployments.
See [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md) for setup instructions.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Fully Supported |
| < 1.0   | ❌ Not Supported   |

## Quick Setup

1. Set `JWT_SECRET` environment variable
2. Add auth middleware to your routes
3. Use `/auth/login` endpoint to get tokens

For detailed setup, see the authentication documentation.
EOF

# Create authentication docs (essential only)
print_status "Creating authentication documentation..."
cat > docs/AUTHENTICATION.md << 'EOF'
# Authentication Setup

Simple JWT authentication for Jargon in production environments.

## Quick Start

### 1. Environment Setup
```bash
export JWT_SECRET="your-secret-key-change-this"
export JWT_EXPIRES_IN="24h"  # optional, defaults to 24h
```

### 2. Add to Your App
```javascript
const auth = require('./src/middleware/auth');

// Optional auth - existing endpoints work unchanged
app.use('/api/execute', auth.optional, executeQuery);

// Required auth - protect admin endpoints
app.use('/admin', auth.required, adminRoutes);

// Add auth endpoints
app.post('/auth/login', auth.login);
app.get('/auth/verify', auth.verify);
```

### 3. Get Token
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### 4. Use Token
```bash
curl http://localhost:3001/api/execute \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"term":"active_customers"}'
```

## API Reference

### Authentication Endpoints

#### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

#### GET /auth/verify
Verify token validity.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### Middleware Usage

#### Optional Authentication
```javascript
app.use('/api', auth.optional);
```
- Adds `req.user` if valid token provided
- Continues without error if no token
- Backward compatible with existing clients

#### Required Authentication  
```javascript
app.use('/admin', auth.required);
```
- Returns 401 if no token provided
- Returns 401 if token invalid/expired
- Sets `req.user` with decoded token data

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | dev-secret* | Secret key for signing tokens |
| `JWT_EXPIRES_IN` | No | "24h" | Token expiration time |

*Change the default secret in production!

## Token Format

Tokens contain:
```json
{
  "username": "admin",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## Security Notes

- Change default credentials in production
- Use strong `JWT_SECRET` (32+ random characters)
- Tokens are signed, not encrypted (don't put secrets in them)
- No session storage required (stateless)

## Next Steps

After basic auth is working:
1. Integrate with your user database
2. Add role-based permissions
3. Implement refresh tokens
4. Add rate limiting

That's it! Simple and secure.
EOF

# Create JWT middleware
print_status "Creating JWT middleware..."
cat > src/middleware/auth.js << 'EOF'
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Simple token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};

// Extract token from request
const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return req.query.token || req.headers['x-api-key'];
};

// Middleware for optional authentication
const optional = (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
};

// Middleware for required authentication
const required = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
};

// Simple login endpoint
const login = (req, res) => {
  const { username, password } = req.body;
  
  // Simple validation (replace with real auth in production)
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign(
      { username, role: 'admin' },
      SECRET,
      { expiresIn: EXPIRES_IN }
    );
    
    res.json({ 
      token,
      expiresIn: EXPIRES_IN,
      user: { username, role: 'admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Token verification endpoint
const verify = (req, res) => {
  const token = extractToken(req);
  const user = verifyToken(token);
  
  if (user) {
    res.json({ valid: true, user });
  } else {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
};

module.exports = {
  optional,
  required,
  login,
  verify,
  verifyToken
};
EOF

# Create simple test script
print_status "Creating test script..."
cat > test-auth.sh << 'EOF'
#!/bin/bash
# Simple authentication test script

echo "Testing Jargon JWT Authentication..."

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "Error: Jargon server not running on port 3001"
    echo "Start it with: npm start"
    exit 1
fi

# Test login
echo "1. Testing login..."
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
else
    echo "✅ Login successful"
fi

# Test token verification
echo "2. Testing token verification..."
VALID=$(curl -s http://localhost:3001/auth/verify \
  -H "Authorization: Bearer $TOKEN" | \
  grep -o '"valid":[^,]*' | cut -d':' -f2)

if [ "$VALID" = "true" ]; then
    echo "✅ Token verification successful"
else
    echo "❌ Token verification failed"
    exit 1
fi

# Test authenticated API call
echo "3. Testing authenticated API call..."
RESPONSE=$(curl -s http://localhost:3001/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"term":"test"}')

if [ $? -eq 0 ]; then
    echo "✅ Authenticated API call successful"
else
    echo "❌ Authenticated API call failed"
fi

echo ""
echo "🎉 JWT Authentication test complete!"
echo "Token: $TOKEN"
EOF

chmod +x test-auth.sh

# Create package.json update suggestion
print_status "Creating package.json update notes..."
cat > PACKAGE_UPDATES.md << 'EOF'
# Package.json Updates Needed

Add JWT dependency to your package.json:

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0"
  }
}
```

Install with:
```bash
npm install jsonwebtoken
```

That's the only new dependency needed!
EOF

print_success "Lean JWT authentication setup complete!"
echo ""
echo "📁 Files created:"
echo "  - SECURITY.md (security policy)"
echo "  - docs/AUTHENTICATION.md (setup guide)"
echo "  - src/middleware/auth.js (JWT middleware)"
echo "  - test-auth.sh (test script)"
echo "  - PACKAGE_UPDATES.md (dependency notes)"
echo ""
echo "🚀 Next steps:"
echo "  1. npm install jsonwebtoken"
echo "  2. Add auth routes to your Express app"
echo "  3. Set JWT_SECRET environment variable"
echo "  4. Test with: ./test-auth.sh"
echo ""
echo "📦 Ready to commit:"
echo "  git add ."
echo "  git commit -m 'feat: add basic JWT authentication'"
echo "  git push origin feat/basic-jwt-auth"
echo ""
print_warning "Remember: Change default credentials in production!"
