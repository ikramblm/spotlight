import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import { toCsv } from "../../lib/csv";
import { parseGuestsCsv } from "./csvImport";
import * as guestsRepo from "./repository";
import type { CreateGuestInput, ImportGuestsInput, ListGuestsQuery, UpdateGuestInput } from "./schema";

export async function createGuest(eventId: string, input: CreateGuestInput, actorId: string) {
  const guest = await guestsRepo.insertGuest(eventId, input);
  await recordAudit({ userId: actorId, action: "guest.create", entityType: "guest", entityId: guest.id });
  return guest;
}

export async function importGuests(eventId: string, input: ImportGuestsInput, actorId: string) {
  const rows = parseGuestsCsv(input.csv);
  const inserted = await guestsRepo.bulkInsertGuests(eventId, rows);
  await recordAudit({
    userId: actorId,
    action: "guest.import",
    entityType: "event",
    entityId: eventId,
    metadata: { count: inserted },
  });
  return { imported: inserted };
}

export async function listGuests(eventId: string, filters: ListGuestsQuery) {
  return guestsRepo.listGuestsByEvent(eventId, filters);
}

export async function getGuest(id: string) {
  const guest = await guestsRepo.getGuestById(id);
  if (!guest) {
    throw AppError.notFound("Guest not found");
  }
  return guest;
}

export async function updateGuest(id: string, input: UpdateGuestInput, actorId: string) {
  await getGuest(id);
  const updated = await guestsRepo.updateGuest(id, input);
  await recordAudit({ userId: actorId, action: "guest.update", entityType: "guest", entityId: id });
  return updated;
}

export async function getAttendanceStats(eventId: string) {
  return guestsRepo.getAttendanceStats(eventId);
}

export async function exportGuestsCsv(eventId: string): Promise<string> {
  const rows = await guestsRepo.listGuestsForExport(eventId);
  return toCsv(rows, [
    { header: "Name", value: (r) => r.full_name },
    { header: "Phone", value: (r) => r.phone },
    { header: "Email", value: (r) => r.email },
    { header: "RSVP status", value: (r) => r.rsvp_status ?? "not invited" },
    { header: "Checked in", value: (r) => (r.checked_in ? "yes" : "no") },
    { header: "Notes", value: (r) => r.notes },
  ]);
}
