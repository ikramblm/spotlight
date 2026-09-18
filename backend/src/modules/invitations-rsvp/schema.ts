import { z } from "zod";

export const guestIdParamsSchema = z.object({
  guestId: z.string().uuid(),
});

export const invitationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const publicTokenParamsSchema = z.object({
  token: z.string().min(1),
});

export const submitRsvpSchema = z.object({
  status: z.enum(["accepted", "declined"]),
  partySize: z.number().int().nonnegative().optional(),
  message: z.string().max(1000).optional(),
});

export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>;
