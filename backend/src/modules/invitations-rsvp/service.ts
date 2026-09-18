import QRCode from "qrcode";
import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import { generateOpaqueToken } from "../../lib/tokens";
import * as guestsRepo from "../guests/repository";
import * as invitationsRepo from "./repository";
import type { SubmitRsvpInput } from "./schema";

export async function generateInvitation(guestId: string, actorId: string) {
  const guest = await guestsRepo.getGuestById(guestId);
  if (!guest) {
    throw AppError.notFound("Guest not found");
  }
  if (await invitationsRepo.guestHasInvitation(guestId)) {
    throw AppError.conflict("This guest already has an invitation");
  }

  const publicToken = generateOpaqueToken(24);
  let invitation;
  try {
    invitation = await invitationsRepo.insertInvitation(guestId, guest.event_id, publicToken);
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23505") {
      throw AppError.conflict("This guest already has an invitation");
    }
    throw err;
  }

  await recordAudit({
    userId: actorId,
    action: "invitation.create",
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { guestId },
  });

  return invitation;
}

export async function sendInvitation(id: string, actorId: string) {
  const invitation = await invitationsRepo.getInvitationById(id);
  if (!invitation) {
    throw AppError.notFound("Invitation not found");
  }

  const updated = await invitationsRepo.markSent(id);

  // TODO(follow-up): deliver via the SMTP_* configured email transport / SMS provider once
  // one is chosen. Logging keeps the flow testable end-to-end without silently dropping the link.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info(`[dev] RSVP link for invitation ${id}: /rsvp/${invitation.public_token}`);
  }

  await recordAudit({ userId: actorId, action: "invitation.send", entityType: "invitation", entityId: id });
  return updated;
}

export async function getInvitation(id: string) {
  const invitation = await invitationsRepo.getInvitationById(id);
  if (!invitation) {
    throw AppError.notFound("Invitation not found");
  }
  const rsvp = await invitationsRepo.getRsvpByInvitationId(id);
  return { invitation, rsvp };
}

/** The QR encodes the bare token - it's what the check-in scanner reads and posts to
 * /checkin/scan. The (separate) RSVP link sent to guests wraps the same token in a URL. */
export async function getQrCodePng(id: string): Promise<Buffer> {
  const invitation = await invitationsRepo.getInvitationById(id);
  if (!invitation) {
    throw AppError.notFound("Invitation not found");
  }
  return QRCode.toBuffer(invitation.public_token, { type: "png", errorCorrectionLevel: "M", margin: 2, width: 320 });
}

export async function getPublicInvitation(token: string) {
  const view = await invitationsRepo.getPublicInvitationView(token);
  if (!view) {
    throw AppError.notFound("Invitation not found");
  }
  return view;
}

export async function submitRsvp(token: string, input: SubmitRsvpInput) {
  const invitation = await invitationsRepo.getInvitationByToken(token);
  if (!invitation) {
    throw AppError.notFound("Invitation not found");
  }

  const updated = await invitationsRepo.updateRsvp(invitation.id, input);

  // Not tied to an authenticated actor - the guest themselves is the one acting here.
  await recordAudit({
    userId: null,
    action: "rsvp.submit",
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { status: input.status },
  });

  return updated;
}
