import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as bookingRequestsService from "./service";
import type {
  ConvertBookingRequestInput,
  CreateBookingRequestInput,
  ListBookingRequestsQuery,
  RejectBookingRequestInput,
} from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createBookingRequest(req: Request, res: Response) {
  const request = await bookingRequestsService.createBookingRequest(
    req.body as CreateBookingRequestInput,
    requireActor(req)
  );
  res.status(201).json({ data: request });
}

export async function listBookingRequests(req: Request, res: Response) {
  const filters = req.query as unknown as ListBookingRequestsQuery;
  const { rows, total } = await bookingRequestsService.listBookingRequests(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getBookingRequest(req: Request, res: Response) {
  const request = await bookingRequestsService.getBookingRequest(req.params.id as string);
  res.status(200).json({ data: request });
}

export async function approveBookingRequest(req: Request, res: Response) {
  const request = await bookingRequestsService.approveBookingRequest(req.params.id as string, requireActor(req));
  res.status(200).json({ data: request });
}

export async function rejectBookingRequest(req: Request, res: Response) {
  const { reason } = req.body as RejectBookingRequestInput;
  const request = await bookingRequestsService.rejectBookingRequest(
    req.params.id as string,
    requireActor(req),
    reason
  );
  res.status(200).json({ data: request });
}

export async function cancelBookingRequest(req: Request, res: Response) {
  const request = await bookingRequestsService.cancelBookingRequest(req.params.id as string, requireActor(req));
  res.status(200).json({ data: request });
}

export async function convertBookingRequest(req: Request, res: Response) {
  const booking = await bookingRequestsService.convertBookingRequest(
    req.params.id as string,
    req.body as ConvertBookingRequestInput,
    requireActor(req)
  );
  res.status(201).json({ data: booking });
}
