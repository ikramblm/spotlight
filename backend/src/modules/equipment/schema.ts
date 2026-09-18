import { z } from "zod";

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(150),
  category: z.string().min(2).max(80),
  quantityTotal: z.number().int().nonnegative(),
  condition: z.enum(["good", "needs_repair", "retired"]).default("good"),
  location: z.string().max(150).optional(),
  supplierId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateEquipmentSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  category: z.string().min(2).max(80).optional(),
  quantityTotal: z.number().int().nonnegative().optional(),
  condition: z.enum(["good", "needs_repair", "retired"]).optional(),
  location: z.string().max(150).optional(),
  supplierId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const listEquipmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
  category: z.string().optional(),
});

export const equipmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const assignEquipmentSchema = z.object({
  bookingId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const assignmentIdParamsSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const archiveEquipmentSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type ListEquipmentQuery = z.infer<typeof listEquipmentQuerySchema>;
export type AssignEquipmentInput = z.infer<typeof assignEquipmentSchema>;
export type ArchiveEquipmentInput = z.infer<typeof archiveEquipmentSchema>;
