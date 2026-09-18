import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as dashboardService from "./service";

export async function getDashboard(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  const summary = await dashboardService.getDashboard(req.user.permissions);
  res.status(200).json({ data: summary });
}
