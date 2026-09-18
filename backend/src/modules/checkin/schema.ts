import { z } from "zod";

export const scanSchema = z.object({
  token: z.string().min(1),
});

export const guestIdParamsSchema = z.object({
  guestId: z.string().uuid(),
});

export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid(),
});

export type ScanInput = z.infer<typeof scanSchema>;
