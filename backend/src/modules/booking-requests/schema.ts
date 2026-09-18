import { z } from "zod";

export const createBookingRequestSchema = z
  .object({
    customerId: z.string().uuid(),
    hallId: z.string().uuid(),
    eventType: z.string().min(2).max(80),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    requestedServices: z.array(z.string()).default([]),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const rejectBookingRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const convertBookingRequestSchema = z.object({
  totalAmount: z.number().nonnegative(),
  advancePayment: z.number().nonnegative().default(0),
  guestCount: z.number().int().nonnegative().optional(),
  services: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.number().int().positive().default(1),
        unitPrice: z.number().nonnegative(),
      })
    )
    .default([]),
});

export const listBookingRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["pending", "approved", "rejected", "canceled"]).optional(),
  hallId: z.string().uuid().optional(),
});

export const bookingRequestIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;
export type RejectBookingRequestInput = z.infer<typeof rejectBookingRequestSchema>;
export type ConvertBookingRequestInput = z.infer<typeof convertBookingRequestSchema>;
export type ListBookingRequestsQuery = z.infer<typeof listBookingRequestsQuerySchema>;
