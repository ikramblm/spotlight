import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/AppError";
import type { UserRole } from "../types";

/**
 * Server-side authorization gate. Every route that touches protected data declares the
 * permission code(s) it requires; the UI hiding a button is convenience only, never security
 * (spec §19/§30 rule #3: users can only access functionality permitted by their role).
 */
export function requirePermission(...permissionCodes: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    const hasPermission = permissionCodes.every((code) => req.user!.permissions.includes(code));
    if (!hasPermission) {
      return next(AppError.forbidden());
    }

    return next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden());
    }
    return next();
  };
}
