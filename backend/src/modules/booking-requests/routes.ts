import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as bookingRequestsController from "./controller";
import {
  bookingRequestIdParamsSchema,
  convertBookingRequestSchema,
  createBookingRequestSchema,
  listBookingRequestsQuerySchema,
  rejectBookingRequestSchema,
} from "./schema";

export const bookingRequestsRouter = Router();

bookingRequestsRouter.use(authenticate);

bookingRequestsRouter.get(
  "/",
  requirePermission("booking_requests.view"),
  validate({ query: listBookingRequestsQuerySchema }),
  asyncHandler(bookingRequestsController.listBookingRequests)
);

bookingRequestsRouter.post(
  "/",
  requirePermission("booking_requests.create"),
  validate({ body: createBookingRequestSchema }),
  asyncHandler(bookingRequestsController.createBookingRequest)
);

bookingRequestsRouter.get(
  "/:id",
  requirePermission("booking_requests.view"),
  validate({ params: bookingRequestIdParamsSchema }),
  asyncHandler(bookingRequestsController.getBookingRequest)
);

bookingRequestsRouter.post(
  "/:id/approve",
  requirePermission("booking_requests.approve"),
  validate({ params: bookingRequestIdParamsSchema }),
  asyncHandler(bookingRequestsController.approveBookingRequest)
);

bookingRequestsRouter.post(
  "/:id/reject",
  requirePermission("booking_requests.approve"),
  validate({ params: bookingRequestIdParamsSchema, body: rejectBookingRequestSchema }),
  asyncHandler(bookingRequestsController.rejectBookingRequest)
);

bookingRequestsRouter.post(
  "/:id/cancel",
  requirePermission("booking_requests.edit"),
  validate({ params: bookingRequestIdParamsSchema }),
  asyncHandler(bookingRequestsController.cancelBookingRequest)
);

bookingRequestsRouter.post(
  "/:id/convert",
  requirePermission("booking_requests.approve"),
  validate({ params: bookingRequestIdParamsSchema, body: convertBookingRequestSchema }),
  asyncHandler(bookingRequestsController.convertBookingRequest)
);
