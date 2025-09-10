import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler.  Ensures that unhandled exceptions are
 * returned as JSON with a 500 status code.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: err?.message || 'internal_error' });
}