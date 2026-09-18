import { z } from "zod";

// Sent as multipart/form-data (see routes.ts) - text fields plus an optional "photo" file part,
// not JSON, so a photo doesn't have to be base64-inflated through a JSON body-size limit.
export const createConfiscationSchema = z.object({
  guestId: z.string().uuid(),
  itemType: z.enum(["phone", "camera", "other"]),
  itemDescription: z.string().max(1000).optional(),
  storageReference: z.string().min(1).max(60),
});

export const returnConfiscationSchema = z.object({
  returnedToNote: z.string().max(255).optional(),
});

export const listConfiscationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  eventId: z.string().uuid().optional(),
  status: z.enum(["holding", "returned"]).optional(),
});

export const confiscationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateConfiscationInput = z.infer<typeof createConfiscationSchema>;
export type ReturnConfiscationInput = z.infer<typeof returnConfiscationSchema>;
export type ListConfiscationsQuery = z.infer<typeof listConfiscationsQuerySchema>;
