import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import { generateKey, saveFile, readFile } from "../../lib/fileStorage";
import * as guestsRepo from "../guests/repository";
import { processConfiscationPhoto } from "./photo";
import * as confiscationsRepo from "./repository";
import type { CreateConfiscationInput, ListConfiscationsQuery, ReturnConfiscationInput } from "./schema";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION;
}

export async function createConfiscation(
  input: CreateConfiscationInput,
  actorId: string,
  photoBuffer?: Buffer
) {
  const guest = await guestsRepo.getGuestById(input.guestId);
  if (!guest) {
    throw AppError.notFound("Guest not found");
  }

  let photoKey: string | null = null;
  if (photoBuffer) {
    const jpeg = await processConfiscationPhoto(photoBuffer);
    photoKey = generateKey("jpg");
    await saveFile(photoKey, jpeg);
  }

  let confiscation;
  try {
    confiscation = await confiscationsRepo.insertConfiscation({
      guestId: input.guestId,
      eventId: guest.event_id,
      itemType: input.itemType,
      itemDescription: input.itemDescription,
      storageReference: input.storageReference,
      photoKey,
      depositedBy: actorId,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        `Storage tag "${input.storageReference}" is already in use for another item at this event`
      );
    }
    throw err;
  }

  await recordAudit({
    userId: actorId,
    action: "confiscation.create",
    entityType: "confiscation",
    entityId: confiscation.id,
    metadata: { guestId: input.guestId, itemType: input.itemType },
  });

  return confiscation;
}

export async function getConfiscation(id: string) {
  const confiscation = await confiscationsRepo.getConfiscationById(id);
  if (!confiscation) {
    throw AppError.notFound("Confiscation record not found");
  }
  return confiscation;
}

export async function getConfiscationDetail(id: string) {
  const confiscation = await getConfiscation(id);
  const restitution =
    confiscation.status === "returned"
      ? await confiscationsRepo.getRestitutionByConfiscationId(id)
      : null;
  return { confiscation, restitution };
}

export async function listConfiscations(filters: ListConfiscationsQuery) {
  return confiscationsRepo.listConfiscations(filters);
}

export async function getPhoto(id: string): Promise<Buffer> {
  const key = await confiscationsRepo.getPhotoKey(id);
  if (!key) {
    throw AppError.notFound("This item has no photo on file");
  }
  return readFile(key);
}

export async function returnConfiscation(id: string, input: ReturnConfiscationInput, actorId: string) {
  const confiscation = await getConfiscation(id);

  if (confiscation.status !== "holding") {
    throw AppError.badRequest("This item has already been returned");
  }

  let restitution;
  try {
    restitution = await confiscationsRepo.insertRestitution({
      confiscationId: id,
      returnedBy: actorId,
      returnedToNote: input.returnedToNote,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict("This item has already been returned");
    }
    throw err;
  }

  await recordAudit({
    userId: actorId,
    action: "confiscation.return",
    entityType: "confiscation",
    entityId: id,
    metadata: { guestId: confiscation.guest_id },
  });

  return { confiscation: await getConfiscation(id), restitution };
}
