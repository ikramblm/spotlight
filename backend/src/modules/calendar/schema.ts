import { z } from "zod";

export const calendarQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    hallId: z.string().uuid().optional(),
    status: z.enum(["confirmed", "completed", "canceled"]).optional(),
  })
  .refine((data) => data.to >= data.from, {
    message: "'to' must be on or after 'from'",
    path: ["to"],
  });

export const todayCalendarQuerySchema = z.object({
  hallId: z.string().uuid().optional(),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type TodayCalendarQuery = z.infer<typeof todayCalendarQuerySchema>;
