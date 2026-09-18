import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as calendarController from "./controller";
import { calendarQuerySchema, todayCalendarQuerySchema } from "./schema";

export const calendarRouter = Router();

calendarRouter.use(authenticate);

// Security Staff's narrow "today only" view (matrix §6) - registered separately from the
// full range so their role only ever needs calendar.view_today, never calendar.view.
calendarRouter.get(
  "/today",
  requirePermission("calendar.view_today"),
  validate({ query: todayCalendarQuerySchema }),
  asyncHandler(calendarController.getTodayCalendar)
);

calendarRouter.get(
  "/",
  requirePermission("calendar.view"),
  validate({ query: calendarQuerySchema }),
  asyncHandler(calendarController.getCalendar)
);
