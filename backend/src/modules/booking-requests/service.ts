import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import * as bookingsService from "../bookings/service";
import * as bookingRequestsRepo from "./repository";
import type {
  ConvertBookingRequestInput,
  CreateBookingRequestInput,
  ListBookingRequestsQuery,
} from "./schema";

export async function createBookingRequest(input: CreateBookingRequestInput, actorId: string) {
  const request = await bookingRequestsRepo.insertBookingRequest({ ...input, createdBy: actorId });
  await recordAudit({
    userId: actorId,
    action: "booking_request.create",
    entityType: "booking_request",
    entityId: request.id,
  });
  return request;
}

export async function listBookingRequests(filters: ListBookingRequestsQuery) {
  return bookingRequestsRepo.listBookingRequests(filters);
}

export async function getBookingRequest(id: string) {
  const request = await bookingRequestsRepo.getBookingRequestById(id);
  if (!request) {
    throw AppError.notFound("Booking request not found");
  }
  return request;
}

async function assertPending(id: string) {
  const request = await getBookingRequest(id);
  if (request.status !== "pending") {
    throw AppError.badRequest(`Only pending requests can be decided on (this one is ${request.status})`);
  }
  return request;
}

export async function approveBookingRequest(id: string, actorId: string) {
  await assertPending(id);
  const updated = await bookingRequestsRepo.setDecision(id, "approved", actorId);
  await recordAudit({
    userId: actorId,
    action: "booking_request.approve",
    entityType: "booking_request",
    entityId: id,
  });
  return updated;
}

export async function rejectBookingRequest(id: string, actorId: string, reason?: string) {
  await assertPending(id);
  const updated = await bookingRequestsRepo.setDecision(id, "rejected", actorId);
  await recordAudit({
    userId: actorId,
    action: "booking_request.reject",
    entityType: "booking_request",
    entityId: id,
    metadata: reason ? { reason } : undefined,
  });
  return updated;
}

export async function cancelBookingRequest(id: string, actorId: string) {
  const request = await getBookingRequest(id);
  if (request.status === "canceled") {
    throw AppError.badRequest("This request is already canceled");
  }
  const updated = await bookingRequestsRepo.setCanceled(id);
  await recordAudit({
    userId: actorId,
    action: "booking_request.cancel",
    entityType: "booking_request",
    entityId: id,
  });
  return updated;
}

export async function convertBookingRequest(
  id: string,
  input: ConvertBookingRequestInput,
  actorId: string
) {
  const request = await getBookingRequest(id);

  if (request.status !== "approved") {
    throw AppError.badRequest("Only approved requests can be converted into a booking");
  }
  if (await bookingRequestsRepo.hasLinkedBooking(id)) {
    throw AppError.conflict("This request has already been converted into a booking");
  }

  const booking = await bookingsService.createBooking(
    {
      customerId: request.customer_id,
      hallId: request.hall_id,
      eventType: request.event_type,
      startTime: request.start_time,
      endTime: request.end_time,
      guestCount: input.guestCount,
      totalAmount: input.totalAmount,
      advancePayment: input.advancePayment,
      services: input.services,
    },
    actorId,
    id
  );

  await recordAudit({
    userId: actorId,
    action: "booking_request.convert",
    entityType: "booking_request",
    entityId: id,
    metadata: { bookingId: booking.id },
  });

  return booking;
}
