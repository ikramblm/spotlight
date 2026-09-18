import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { publicRateLimiter } from "../../middleware/rateLimit";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as invitationsController from "./controller";
import {
  guestIdParamsSchema,
  invitationIdParamsSchema,
  publicTokenParamsSchema,
  submitRsvpSchema,
} from "./schema";

/** Authenticated - staff generating/sending invitations and viewing their status/QR. */
export const invitationsRouter = Router();

invitationsRouter.use(authenticate);

invitationsRouter.post(
  "/guest/:guestId",
  requirePermission("invitations.create"),
  validate({ params: guestIdParamsSchema }),
  asyncHandler(invitationsController.generateInvitation)
);

invitationsRouter.get(
  "/:id",
  requirePermission("invitations.view"),
  validate({ params: invitationIdParamsSchema }),
  asyncHandler(invitationsController.getInvitation)
);

invitationsRouter.post(
  "/:id/send",
  requirePermission("invitations.send"),
  validate({ params: invitationIdParamsSchema }),
  asyncHandler(invitationsController.sendInvitation)
);

invitationsRouter.get(
  "/:id/qr.png",
  requirePermission("invitations.view"),
  validate({ params: invitationIdParamsSchema }),
  asyncHandler(invitationsController.getQrCode)
);

/** Public - no auth. Guests reach this via their invitation link, never an internal account
 * (spec §10). Token entropy (192-bit random) is the actual access control here. */
export const publicRsvpRouter = Router();

publicRsvpRouter.use(publicRateLimiter);

publicRsvpRouter.get(
  "/:token",
  validate({ params: publicTokenParamsSchema }),
  asyncHandler(invitationsController.getPublicInvitation)
);

publicRsvpRouter.post(
  "/:token",
  validate({ params: publicTokenParamsSchema, body: submitRsvpSchema }),
  asyncHandler(invitationsController.submitRsvp)
);
