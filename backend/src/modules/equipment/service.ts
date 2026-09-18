import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as bookingsRepo from "../bookings/repository";
import * as equipmentRepo from "./repository";
import type { CreateEquipmentInput, ListEquipmentQuery, UpdateEquipmentInput } from "./schema";

const CHECK_VIOLATION = "23514";
const FOREIGN_KEY_VIOLATION = "23503";

function dbErrorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null ? (err as { code?: string }).code : undefined;
}

export async function createEquipment(input: CreateEquipmentInput, actorId: string) {
  let equipment;
  try {
    equipment = await equipmentRepo.insertEquipment(input);
  } catch (err) {
    if (dbErrorCode(err) === FOREIGN_KEY_VIOLATION) {
      throw AppError.badRequest("That supplier does not exist", { supplierId: "not found" });
    }
    throw err;
  }
  await recordAudit({ userId: actorId, action: "equipment.create", entityType: "equipment", entityId: equipment.id });
  return equipment;
}

export async function listEquipment(filters: ListEquipmentQuery) {
  return equipmentRepo.listEquipment(filters);
}

export async function getEquipment(id: string) {
  const equipment = await equipmentRepo.getEquipmentById(id);
  if (!equipment) {
    throw AppError.notFound("Equipment not found");
  }
  return equipment;
}

export async function getEquipmentDetail(id: string) {
  const equipment = await getEquipment(id);
  const assignments = await equipmentRepo.listAssignmentsForEquipment(id);
  return { equipment, assignments };
}

export async function updateEquipment(id: string, input: UpdateEquipmentInput, actorId: string) {
  await getEquipment(id);

  let updated;
  try {
    updated = await equipmentRepo.updateEquipment(id, input);
  } catch (err) {
    const code = dbErrorCode(err);
    if (code === CHECK_VIOLATION) {
      throw AppError.badRequest(
        "Total quantity can't be lower than the quantity currently assigned out",
        { quantityTotal: "below assigned quantity" }
      );
    }
    if (code === FOREIGN_KEY_VIOLATION) {
      throw AppError.badRequest("That supplier does not exist", { supplierId: "not found" });
    }
    throw err;
  }

  await recordAudit({ userId: actorId, action: "equipment.update", entityType: "equipment", entityId: id });
  return updated;
}

export async function archiveEquipment(id: string, actorId: string, reason?: string) {
  await getEquipment(id);
  const archived = await equipmentRepo.archiveEquipment(id);
  await recordAudit({ userId: actorId, action: "equipment.archive", entityType: "equipment", entityId: id });
  await recordArchive({ entityType: "equipment", entityId: id, reason, archivedBy: actorId });
  return archived;
}

export async function assignEquipment(
  equipmentId: string,
  input: { bookingId: string; quantity: number },
  actorId: string
) {
  await getEquipment(equipmentId);
  const booking = await bookingsRepo.getBookingById(input.bookingId);
  if (!booking) {
    throw AppError.notFound("Booking not found");
  }

  let assignment;
  try {
    assignment = await equipmentRepo.insertAssignment({
      equipmentId,
      bookingId: input.bookingId,
      quantity: input.quantity,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_QUANTITY") {
      throw AppError.conflict("Not enough of this equipment is available to assign that quantity");
    }
    if (err instanceof Error && err.message === "EQUIPMENT_NOT_FOUND") {
      throw AppError.notFound("Equipment not found");
    }
    throw err;
  }

  await recordAudit({
    userId: actorId,
    action: "equipment.assign",
    entityType: "equipment",
    entityId: equipmentId,
    metadata: { bookingId: input.bookingId, quantity: input.quantity },
  });

  return assignment;
}

export async function returnAssignment(assignmentId: string, actorId: string) {
  const assignment = await equipmentRepo.getAssignmentById(assignmentId);
  if (!assignment) {
    throw AppError.notFound("Equipment assignment not found");
  }
  if (assignment.returned_at) {
    throw AppError.badRequest("This equipment has already been returned");
  }

  const updated = await equipmentRepo.markAssignmentReturned(
    assignmentId,
    assignment.quantity,
    assignment.equipment_id
  );

  await recordAudit({
    userId: actorId,
    action: "equipment.return",
    entityType: "equipment",
    entityId: assignment.equipment_id,
    metadata: { assignmentId, bookingId: assignment.booking_id },
  });

  return updated;
}
