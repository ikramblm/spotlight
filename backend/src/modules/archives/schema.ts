import { z } from "zod";

export const listArchivesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  entityType: z.string().max(40).optional(),
});

export type ListArchivesQuery = z.infer<typeof listArchivesQuerySchema>;
