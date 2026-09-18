import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../lib/AppError";

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const [key, schema] of Object.entries(schemas) as [keyof Schemas, ZodTypeAny][]) {
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fields[issue.path.join(".") || key] = issue.message;
        }
        return next(AppError.badRequest("Validation failed", fields));
      }
      req[key] = result.data;
    }
    return next();
  };
}
