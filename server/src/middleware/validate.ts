import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

/// Validates req.body against a Zod schema and replaces it with the parsed,
/// typed result so downstream handlers never see unvalidated input.
export const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
