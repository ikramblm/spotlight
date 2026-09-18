import { z } from "zod";

const bookingServiceLineSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
});

export const createBookingSchema = z
  .object({
    customerId: z.string().uuid(),
    hallId: z.string().uuid(),
    eventType: z.string().min(2).max(80),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    guestCount: z.number().int().nonnegative().optional(),
    totalAmount: z.number().nonnegative(),
    advancePayment: z.number().nonnegative().default(0),
    notes: z.string().max(2000).optional(),
    services: z.array(bookingServiceLineSchema).default([]),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((data) => data.advancePayment <= data.totalAmount, {
    message: "Advance payment cannot exceed the total amount",
    path: ["advancePayment"],
  });

export const updateBookingSchema = z
  .object({
    eventType: z.string().min(2).max(80).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    guestCount: z.number().int().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updatePaymentSchema = z.object({
  advancePayment: z.number().nonnegative(),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["confirmed", "completed", "canceled"]).optional(),
  hallId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const bookingIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
export type BookingServiceLine = z.infer<typeof bookingServiceLineSchema>;
