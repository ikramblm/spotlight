import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as caterersService from "./service";
import type {
  ArchiveCatererInput,
  AssignBookingInput,
  CreateCatererInput,
  ListCaterersQuery,
  UpdateCatererInput,
} from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createCaterer(req: Request, res: Response) {
  const caterer = await caterersService.createCaterer(req.body as CreateCatererInput, requireActor(req));
  res.status(201).json({ data: caterer });
}

export async function listCaterers(req: Request, res: Response) {
  const filters = req.query as unknown as ListCaterersQuery;
  const { rows, total } = await caterersService.listCaterers(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getCaterer(req: Request, res: Response) {
  const { caterer, assignedBookings } = await caterersService.getCatererDetail(req.params.id as string);
  res.status(200).json({ data: { ...caterer, assignedBookings } });
}

export async function updateCaterer(req: Request, res: Response) {
  const caterer = await caterersService.updateCaterer(
    req.params.id as string,
    req.body as UpdateCatererInput,
    requireActor(req)
  );
  res.status(200).json({ data: caterer });
}

export async function archiveCaterer(req: Request, res: Response) {
  const { reason } = req.body as ArchiveCatererInput;
  const caterer = await caterersService.archiveCaterer(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: caterer });
}

export async function assignToBooking(req: Request, res: Response) {
  const { bookingId } = req.body as AssignBookingInput;
  await caterersService.assignToBooking(req.params.id as string, bookingId, requireActor(req));
  res.status(204).send();
}

export async function unassignFromBooking(req: Request, res: Response) {
  await caterersService.unassignFromBooking(
    req.params.id as string,
    req.params.bookingId as string,
    requireActor(req)
  );
  res.status(204).send();
}
