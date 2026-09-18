import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as bookingsService from "./service";
import type {
  CreateBookingInput,
  ListBookingsQuery,
  UpdateBookingInput,
  UpdatePaymentInput,
} from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createBooking(req: Request, res: Response) {
  const booking = await bookingsService.createBooking(req.body as CreateBookingInput, requireActor(req));
  res.status(201).json({ data: booking });
}

export async function listBookings(req: Request, res: Response) {
  const filters = req.query as unknown as ListBookingsQuery;
  const { rows, total } = await bookingsService.listBookings(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getBooking(req: Request, res: Response) {
  const { booking, services, eventId } = await bookingsService.getBooking(req.params.id as string);
  res.status(200).json({ data: { ...booking, services, eventId } });
}

export async function updateBooking(req: Request, res: Response) {
  const booking = await bookingsService.updateBooking(
    req.params.id as string,
    req.body as UpdateBookingInput,
    requireActor(req)
  );
  res.status(200).json({ data: booking });
}

export async function updatePayment(req: Request, res: Response) {
  const booking = await bookingsService.updatePayment(
    req.params.id as string,
    req.body as UpdatePaymentInput,
    requireActor(req)
  );
  res.status(200).json({ data: booking });
}

export async function cancelBooking(req: Request, res: Response) {
  const booking = await bookingsService.cancelBooking(req.params.id as string, requireActor(req));
  res.status(200).json({ data: booking });
}

export async function completeBooking(req: Request, res: Response) {
  const booking = await bookingsService.completeBooking(req.params.id as string, requireActor(req));
  res.status(200).json({ data: booking });
}
