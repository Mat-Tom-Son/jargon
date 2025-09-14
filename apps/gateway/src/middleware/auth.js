const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POC ONLY - Default users (change in production)
const users = {
  admin: { password: 'admin', role: 'admin' }, // POC ONLY - Change in production
  demo: { password: 'demo', role: 'user' },    // Demo user for presentations
  guest: { password: 'guest', role: 'readonly' } // Read-only access
};

// Security warning for production environments
if (process.env.NODE_ENV === 'production') {
  console.warn('🚨 WARNING: Using default credentials in production environment');
  console.warn('🚨 This auth system is for POC/Demo purposes only');
}

// Login endpoint
const login = (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  res.json({ token, user: { username, role: user.role } });
};

// Token verification
const verify = (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware (doesn't block if no token)
const optional = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Invalid token, but continue without user
    }
  }
  
  next();
};

// Required auth middleware (blocks if no valid token)
const required = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { login, verify, optional, required };