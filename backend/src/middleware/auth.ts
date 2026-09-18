import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/AppError";
import { verifyAccessToken } from "../lib/tokens";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized());
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
    return next();
  } catch {
    return next(AppError.unauthorized("Invalid or expired access token"));
  }
}
