import { Request, Response, NextFunction } from 'express';

/**
 * Minimal admin auth using an API key header. In production, require
 * ADMIN_API_TOKEN to be set and matched via `x-api-key` header.
 * In development (NODE_ENV !== 'production'), allow if no token set.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = process.env.ADMIN_API_TOKEN;
  const provided = (req.headers['x-api-key'] || req.headers['x-api-token'] || '') as string;

  if (process.env.NODE_ENV === 'production') {
    if (!token) return res.status(403).json({ error: 'admin_token_not_configured' });
    if (provided !== token) return res.status(401).json({ error: 'unauthorized' });
    return next();
  }

  // Development: if token set, enforce; otherwise allow
  if (token && provided !== token) return res.status(401).json({ error: 'unauthorized' });
  return next();
}

/**
 * Guard an endpoint to development only (or if explicitly allowed via ALLOW_CONFIG_UPDATE=true).
 */
export function devOnly(_req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_CONFIG_UPDATE !== 'true') {
    return res.status(403).json({ error: 'disabled_in_production' });
  }
  next();
}

