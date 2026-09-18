import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import * as checkinRepo from "./repository";
import type { ResolvedInvitation } from "./repository";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION;
}

export interface CheckinOutcome {
  guestName: string;
  accessResult: string;
  checkedInAt: Date;
}

async function performCheckin(
  invitation: ResolvedInvitation,
  actorId: string,
  allowOverride: boolean
): Promise<CheckinOutcome> {
  let accessResult: string;

  if (!invitation.is_today || invitation.booking_status === "canceled") {
    accessResult = "denied_wrong_event";
  } else if (invitation.rsvp_status !== "accepted") {
    accessResult = "denied_no_rsvp";
  } else {
    const alreadyGranted = await checkinRepo.hasGrantedCheckin(invitation.invitation_id);
    if (alreadyGranted && !allowOverride) {
      throw AppError.conflict(`${invitation.guest_name} has already been checked in`);
    }
    accessResult = alreadyGranted ? "override" : "granted";
  }

  let checkin;
  try {
    checkin = await checkinRepo.insertCheckin({
      invitationId: invitation.invitation_id,
      guestId: invitation.guest_id,
      eventId: invitation.event_id,
      checkedInBy: actorId,
      accessResult,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(`${invitation.guest_name} has already been checked in`);
    }
    throw err;
  }

  await recordAudit({
    userId: actorId,
    action: `checkin.${accessResult}`,
    entityType: "guest",
    entityId: invitation.guest_id,
    metadata: { eventId: invitation.event_id, invitationId: invitation.invitation_id },
  });

  return { guestName: invitation.guest_name, accessResult, checkedInAt: checkin.checked_in_at };
}

export async function scanByToken(token: string, actorId: string, allowOverride = false) {
  const invitation = await checkinRepo.resolveByToken(token);
  if (!invitation) {
    await recordAudit({ userId: actorId, action: "checkin.unrecognized_token" });
    throw AppError.notFound("This QR code doesn't match any invitation");
  }
  return performCheckin(invitation, actorId, allowOverride);
}

export async function checkinByGuestId(guestId: string, actorId: string, allowOverride = false) {
  const invitation = await checkinRepo.resolveByGuestId(guestId);
  if (!invitation) {
    throw AppError.badRequest("This guest has not been invited yet - generate an invitation first");
  }
  return performCheckin(invitation, actorId, allowOverride);
}

export function listCheckinsForEvent(eventId: string) {
  return checkinRepo.listByEvent(eventId);
}
