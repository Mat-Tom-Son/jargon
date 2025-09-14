# Enhanced Security Implementation Guide

## Quick Security Hardening (30 minutes)

### 1. Secure Authentication
```bash
# Install security dependencies
pnpm add bcrypt helmet express-rate-limit csurf

# Update auth middleware
cp apps/gateway/src/middleware/auth.js apps/gateway/src/middleware/auth.js.backup
```

### 2. Essential Security Middleware
```javascript
// apps/gateway/gateway.js - Add after line 10
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 3. Input Validation
```javascript
// Add to all route handlers
const validator = require('validator');

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return validator.escape(input);
};
```

### 4. Secure Configuration
```bash
# Set secure environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export NODE_ENV=production
export SECURE_COOKIES=true
```

## Production Security Checklist

- [ ] Replace all hardcoded credentials
- [ ] Add input validation to all endpoints  
- [ ] Implement CSRF protection
- [ ] Add rate limiting
- [ ] Secure CORS policy
- [ ] Enable HTTPS only
- [ ] Add security headers
- [ ] Implement proper error handling
- [ ] Add audit logging
- [ ] Regular security scans