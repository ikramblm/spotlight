import Decimal from "decimal.js";
import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import * as hallsRepo from "../halls/repository";
import * as bookingsRepo from "./repository";
import type {
  CreateBookingInput,
  ListBookingsQuery,
  UpdateBookingInput,
  UpdatePaymentInput,
} from "./schema";

const EXCLUSION_VIOLATION = "23P01";

function isExclusionViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === EXCLUSION_VIOLATION;
}

async function assertHallAvailable(hallId: string, startTime: Date, endTime: Date, excludeBookingId?: string) {
  const overlapping = await hallsRepo.findOverlappingBookings(hallId, startTime, endTime, excludeBookingId);
  if (overlapping.length > 0) {
    const conflict = overlapping[0]!;
    throw AppError.conflict(
      `This hall is already booked from ${conflict.start_time.toISOString()} to ${conflict.end_time.toISOString()}`
    );
  }
}

function computePaymentStatus(totalAmount: string, advancePayment: string): "unpaid" | "partial" | "paid" {
  const total = new Decimal(totalAmount);
  const advance = new Decimal(advancePayment);
  if (advance.lessThanOrEqualTo(0)) return "unpaid";
  if (advance.greaterThanOrEqualTo(total)) return "paid";
  return "partial";
}

export async function createBooking(
  input: CreateBookingInput,
  actorId: string,
  sourceRequestId?: string
) {
  // Friendly pre-check first (readable 409 message); the DB's EXCLUDE constraint below is
  // the actual race-condition-proof guarantee (spec §30 rule #1).
  await assertHallAvailable(input.hallId, input.startTime, input.endTime);

  let booking;
  try {
    booking = await bookingsRepo.insertBooking({
      ...input,
      createdBy: actorId,
      sourceRequestId,
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw AppError.conflict("This hall was just booked for an overlapping time by someone else");
    }
    throw err;
  }

  const paymentStatus = computePaymentStatus(booking.total_amount, booking.advance_payment);
  if (paymentStatus !== booking.payment_status) {
    booking = await bookingsRepo.updatePayment(booking.id, Number(booking.advance_payment), paymentStatus);
  }

  await recordAudit({
    userId: actorId,
    action: "booking.create",
    entityType: "booking",
    entityId: booking.id,
    metadata: { hallId: input.hallId, customerId: input.customerId },
  });

  return booking;
}

export async function listBookings(filters: ListBookingsQuery) {
  return bookingsRepo.listBookings(filters);
}

export async function getBooking(id: string) {
  const booking = await bookingsRepo.getBookingById(id);
  if (!booking) {
    throw AppError.notFound("Booking not found");
  }
  const [services, eventId] = await Promise.all([
    bookingsRepo.getBookingServices(id),
    bookingsRepo.getLinkedEventId(id),
  ]);
  return { booking, services, eventId };
}

export async function updateBooking(id: string, input: UpdateBookingInput, actorId: string) {
  const existing = await bookingsRepo.getBookingById(id);
  if (!existing) {
    throw AppError.notFound("Booking not found");
  }
  if (existing.status !== "confirmed") {
    throw AppError.badRequest("Only confirmed bookings can be edited");
  }

  const newStart = input.startTime ?? existing.start_time;
  const newEnd = input.endTime ?? existing.end_time;
  if (input.startTime || input.endTime) {
    await assertHallAvailable(existing.hall_id, newStart, newEnd, id);
  }

  if (input.totalAmount !== undefined && new Decimal(input.totalAmount).lessThan(existing.advance_payment)) {
    throw AppError.badRequest("Total amount cannot be less than the advance payment already recorded", {
      totalAmount: "below advance payment",
    });
  }

  let updated;
  try {
    updated = await bookingsRepo.updateBookingFields(id, input);
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw AppError.conflict("This hall was just booked for an overlapping time by someone else");
    }
    throw err;
  }

  if (input.totalAmount !== undefined) {
    const paymentStatus = computePaymentStatus(updated.total_amount, updated.advance_payment);
    if (paymentStatus !== updated.payment_status) {
      updated = await bookingsRepo.updatePayment(id, Number(updated.advance_payment), paymentStatus);
    }
  }

  await bookingsRepo.recordHistory({
    bookingId: id,
    changedBy: actorId,
    changeType: "edit",
    beforeData: existing,
    afterData: updated,
  });
  await recordAudit({ userId: actorId, action: "booking.update", entityType: "booking", entityId: id });

  return updated;
}

export async function updatePayment(id: string, input: UpdatePaymentInput, actorId: string) {
  const existing = await bookingsRepo.getBookingById(id);
  if (!existing) {
    throw AppError.notFound("Booking not found");
  }

  const total = new Decimal(existing.total_amount);
  const newAdvance = new Decimal(input.advancePayment);
  if (newAdvance.greaterThan(total)) {
    throw AppError.badRequest("Advance payment cannot exceed the total amount", {
      advancePayment: "exceeds total amount",
    });
  }

  const paymentStatus = computePaymentStatus(existing.total_amount, input.advancePayment.toString());
  const updated = await bookingsRepo.updatePayment(id, input.advancePayment, paymentStatus);

  await bookingsRepo.recordHistory({
    bookingId: id,
    changedBy: actorId,
    changeType: "payment_update",
    beforeData: { advancePayment: existing.advance_payment, paymentStatus: existing.payment_status },
    afterData: { advancePayment: updated.advance_payment, paymentStatus: updated.payment_status },
  });
  await recordAudit({ userId: actorId, action: "booking.payment_update", entityType: "booking", entityId: id });

  return updated;
}

async function transitionStatus(
  id: string,
  from: "confirmed",
  to: "completed" | "canceled",
  actorId: string
) {
  const existing = await bookingsRepo.getBookingById(id);
  if (!existing) {
    throw AppError.notFound("Booking not found");
  }
  if (existing.status !== from) {
    throw AppError.badRequest(`Only ${from} bookings can be moved to ${to}`);
  }

  const updated = await bookingsRepo.updateStatus(id, to);
  await bookingsRepo.recordHistory({
    bookingId: id,
    changedBy: actorId,
    changeType: "status_change",
    beforeData: { status: existing.status },
    afterData: { status: to },
  });
  await recordAudit({ userId: actorId, action: `booking.${to}`, entityType: "booking", entityId: id });

  return updated;
}

export function cancelBooking(id: string, actorId: string) {
  return transitionStatus(id, "confirmed", "canceled", actorId);
}

export function completeBooking(id: string, actorId: string) {
  return transitionStatus(id, "confirmed", "completed", actorId);
}
