# Demo Credentials

## Available Demo Users

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| `admin` | `admin` | admin | Full administrative access |
| `demo` | `demo` | user | Standard user for presentations |
| `guest` | `guest` | readonly | Read-only access for demos |

## Usage Examples

### Admin Login (Full Access)
```bash
curl -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Demo User Login (Standard Access)
```bash
curl -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo"}'
```

### Guest Login (Read-Only)
```bash
curl -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guest","password":"guest"}'
```

## ⚠️ Security Warning

**These are demo credentials for POC/presentation purposes only.**

- Passwords are intentionally simple for demo convenience
- All credentials are publicly documented
- No password complexity requirements
- No account lockout mechanisms

**Never use these credentials in production environments.**