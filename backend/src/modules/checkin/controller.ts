import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as checkinService from "./service";
import type { ScanInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function scan(req: Request, res: Response) {
  const { token } = req.body as ScanInput;
  const outcome = await checkinService.scanByToken(token, requireActor(req), false);
  res.status(200).json({ data: outcome });
}

export async function override(req: Request, res: Response) {
  const { token } = req.body as ScanInput;
  const outcome = await checkinService.scanByToken(token, requireActor(req), true);
  res.status(200).json({ data: outcome });
}

export async function checkinByGuestId(req: Request, res: Response) {
  const outcome = await checkinService.checkinByGuestId(req.params.guestId as string, requireActor(req), false);
  res.status(200).json({ data: outcome });
}

export async function listCheckinsForEvent(req: Request, res: Response) {
  const checkins = await checkinService.listCheckinsForEvent(req.params.eventId as string);
  res.status(200).json({ data: checkins });
}
