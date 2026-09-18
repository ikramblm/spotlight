import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as bookingsRepo from "../bookings/repository";
import * as caterersRepo from "./repository";
import type { CreateCatererInput, ListCaterersQuery, UpdateCatererInput } from "./schema";

export async function createCaterer(input: CreateCatererInput, actorId: string) {
  const caterer = await caterersRepo.insertCaterer(input);
  await recordAudit({ userId: actorId, action: "caterer.create", entityType: "caterer", entityId: caterer.id });
  return caterer;
}

export async function listCaterers(filters: ListCaterersQuery) {
  return caterersRepo.listCaterers(filters);
}

export async function getCaterer(id: string) {
  const caterer = await caterersRepo.getCatererById(id);
  if (!caterer) {
    throw AppError.notFound("Caterer not found");
  }
  return caterer;
}

export async function getCatererDetail(id: string) {
  const caterer = await getCaterer(id);
  const assignedBookings = await caterersRepo.getAssignedBookings(id);
  return { caterer, assignedBookings };
}

export async function updateCaterer(id: string, input: UpdateCatererInput, actorId: string) {
  await getCaterer(id);
  const updated = await caterersRepo.updateCaterer(id, input);
  await recordAudit({ userId: actorId, action: "caterer.update", entityType: "caterer", entityId: id });
  return updated;
}

export async function archiveCaterer(id: string, actorId: string, reason?: string) {
  await getCaterer(id);
  const archived = await caterersRepo.archiveCaterer(id);
  await recordAudit({ userId: actorId, action: "caterer.archive", entityType: "caterer", entityId: id });
  await recordArchive({ entityType: "caterer", entityId: id, reason, archivedBy: actorId });
  return archived;
}

export async function assignToBooking(catererId: string, bookingId: string, actorId: string) {
  await getCaterer(catererId);
  const booking = await bookingsRepo.getBookingById(bookingId);
  if (!booking) {
    throw AppError.notFound("Booking not found");
  }

  await caterersRepo.assignToBooking(catererId, bookingId);
  await recordAudit({
    userId: actorId,
    action: "caterer.assign",
    entityType: "caterer",
    entityId: catererId,
    metadata: { bookingId },
  });
}

export async function unassignFromBooking(catererId: string, bookingId: string, actorId: string) {
  await getCaterer(catererId);
  await caterersRepo.unassignFromBooking(catererId, bookingId);
  await recordAudit({
    userId: actorId,
    action: "caterer.unassign",
    entityType: "caterer",
    entityId: catererId,
    metadata: { bookingId },
  });
}
