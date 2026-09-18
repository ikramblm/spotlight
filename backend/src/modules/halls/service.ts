import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as hallsRepo from "./repository";
import type { CreateHallInput, HallAvailabilityQuery, ListHallsQuery, UpdateHallInput } from "./schema";

export async function createHall(input: CreateHallInput, actorId: string) {
  const hall = await hallsRepo.insertHall(input);
  await recordAudit({ userId: actorId, action: "hall.create", entityType: "hall", entityId: hall.id });
  return hall;
}

export async function listHalls(filters: ListHallsQuery) {
  return hallsRepo.listHalls(filters);
}

export async function getHall(id: string) {
  const hall = await hallsRepo.getHallById(id);
  if (!hall) {
    throw AppError.notFound("Hall not found");
  }
  return hall;
}

export async function updateHall(id: string, input: UpdateHallInput, actorId: string) {
  await getHall(id);
  const updated = await hallsRepo.updateHall(id, input);
  await recordAudit({ userId: actorId, action: "hall.update", entityType: "hall", entityId: id });
  return updated;
}

export async function archiveHall(id: string, actorId: string, reason?: string) {
  await getHall(id);
  const archived = await hallsRepo.archiveHall(id);
  await recordAudit({ userId: actorId, action: "hall.archive", entityType: "hall", entityId: id });
  await recordArchive({ entityType: "hall", entityId: id, reason, archivedBy: actorId });
  return archived;
}

export async function getAvailability(id: string, range: HallAvailabilityQuery) {
  await getHall(id);
  const overlapping = await hallsRepo.findOverlappingBookings(id, range.from, range.to);
  return { isAvailable: overlapping.length === 0, conflictingBookings: overlapping };
}

export async function getUpcomingBookings(id: string) {
  await getHall(id);
  return hallsRepo.getUpcomingBookings(id);
}
