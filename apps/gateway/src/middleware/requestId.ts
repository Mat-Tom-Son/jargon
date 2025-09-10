import { Request, Response, NextFunction } from 'express';

/**
 * Attach a unique request identifier to every incoming request.  This
 * makes it easier to correlate logs across the system.  If the
 * client already provided an X‑Request‑Id header it will be used,
 * otherwise a new one is generated.
 */
export function requestId(req: Request, _res: Response, next: NextFunction) {
  const existing = req.headers['x-request-id'];
  (req as any).rid = existing || `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  next();
}