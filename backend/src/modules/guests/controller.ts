import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as guestsService from "./service";
import type { CreateGuestInput, ImportGuestsInput, ListGuestsQuery, UpdateGuestInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createGuest(req: Request, res: Response) {
  const guest = await guestsService.createGuest(
    req.params.eventId as string,
    req.body as CreateGuestInput,
    requireActor(req)
  );
  res.status(201).json({ data: guest });
}

export async function importGuests(req: Request, res: Response) {
  const result = await guestsService.importGuests(
    req.params.eventId as string,
    req.body as ImportGuestsInput,
    requireActor(req)
  );
  res.status(201).json({ data: result });
}

export async function listGuests(req: Request, res: Response) {
  const filters = req.query as unknown as ListGuestsQuery;
  const { rows, total } = await guestsService.listGuests(req.params.eventId as string, filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getAttendanceStats(req: Request, res: Response) {
  const stats = await guestsService.getAttendanceStats(req.params.eventId as string);
  res.status(200).json({ data: stats });
}

export async function exportCsv(req: Request, res: Response) {
  const csv = await guestsService.exportGuestsCsv(req.params.eventId as string);
  res
    .status(200)
    .set("Content-Type", "text/csv; charset=utf-8")
    .set("Content-Disposition", `attachment; filename="guests.csv"`)
    .send(csv);
}

export async function getGuest(req: Request, res: Response) {
  const guest = await guestsService.getGuest(req.params.id as string);
  res.status(200).json({ data: guest });
}

export async function updateGuest(req: Request, res: Response) {
  const guest = await guestsService.updateGuest(req.params.id as string, req.body as UpdateGuestInput, requireActor(req));
  res.status(200).json({ data: guest });
}
