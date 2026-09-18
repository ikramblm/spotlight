import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as hallsService from "./service";
import type {
  ArchiveHallInput,
  CreateHallInput,
  HallAvailabilityQuery,
  ListHallsQuery,
  UpdateHallInput,
} from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createHall(req: Request, res: Response) {
  const hall = await hallsService.createHall(req.body as CreateHallInput, requireActor(req));
  res.status(201).json({ data: hall });
}

export async function listHalls(req: Request, res: Response) {
  const filters = req.query as unknown as ListHallsQuery;
  const { rows, total } = await hallsService.listHalls(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getHall(req: Request, res: Response) {
  const hall = await hallsService.getHall(req.params.id as string);
  res.status(200).json({ data: hall });
}

export async function updateHall(req: Request, res: Response) {
  const hall = await hallsService.updateHall(req.params.id as string, req.body as UpdateHallInput, requireActor(req));
  res.status(200).json({ data: hall });
}

export async function archiveHall(req: Request, res: Response) {
  const { reason } = req.body as ArchiveHallInput;
  const hall = await hallsService.archiveHall(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: hall });
}

export async function getAvailability(req: Request, res: Response) {
  const range = req.query as unknown as HallAvailabilityQuery;
  const result = await hallsService.getAvailability(req.params.id as string, range);
  res.status(200).json({ data: result });
}

export async function getUpcomingBookings(req: Request, res: Response) {
  const bookings = await hallsService.getUpcomingBookings(req.params.id as string);
  res.status(200).json({ data: bookings });
}
