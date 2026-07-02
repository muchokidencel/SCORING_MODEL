import type { NextFunction, Request, RequestHandler, Response } from "express";

/// Express 4 does not catch rejected promises from async route handlers on
/// its own; this forwards them to the error-handling middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
