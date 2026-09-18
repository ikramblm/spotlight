import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as bookingsController from "./controller";
import {
  bookingIdParamsSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  updateBookingSchema,
  updatePaymentSchema,
} from "./schema";

export const bookingsRouter = Router();

bookingsRouter.use(authenticate);

bookingsRouter.get(
  "/",
  requirePermission("bookings.view"),
  validate({ query: listBookingsQuerySchema }),
  asyncHandler(bookingsController.listBookings)
);

bookingsRouter.post(
  "/",
  requirePermission("bookings.create"),
  validate({ body: createBookingSchema }),
  asyncHandler(bookingsController.createBooking)
);

bookingsRouter.get(
  "/:id",
  requirePermission("bookings.view"),
  validate({ params: bookingIdParamsSchema }),
  asyncHandler(bookingsController.getBooking)
);

bookingsRouter.patch(
  "/:id",
  requirePermission("bookings.edit"),
  validate({ params: bookingIdParamsSchema, body: updateBookingSchema }),
  asyncHandler(bookingsController.updateBooking)
);

bookingsRouter.patch(
  "/:id/payments",
  requirePermission("bookings.edit"),
  validate({ params: bookingIdParamsSchema, body: updatePaymentSchema }),
  asyncHandler(bookingsController.updatePayment)
);

bookingsRouter.post(
  "/:id/cancel",
  requirePermission("bookings.edit"),
  validate({ params: bookingIdParamsSchema }),
  asyncHandler(bookingsController.cancelBooking)
);

bookingsRouter.post(
  "/:id/complete",
  requirePermission("bookings.edit"),
  validate({ params: bookingIdParamsSchema }),
  asyncHandler(bookingsController.completeBooking)
);
