import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as confiscationsController from "./controller";
import {
  confiscationIdParamsSchema,
  createConfiscationSchema,
  listConfiscationsQuerySchema,
  returnConfiscationSchema,
} from "./schema";

export const confiscationsRouter = Router();

// Memory storage: the file never touches disk unprocessed - photo.ts re-encodes the buffer
// (and validates it's really an image) before fileStorage.ts ever writes anything.
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

confiscationsRouter.use(authenticate);

confiscationsRouter.get(
  "/",
  requirePermission("confiscations.view"),
  validate({ query: listConfiscationsQuerySchema }),
  asyncHandler(confiscationsController.listConfiscations)
);

confiscationsRouter.post(
  "/",
  requirePermission("confiscations.create"),
  // multipart/form-data, not JSON: the app-wide express.json() middleware only engages for
  // application/json bodies, so it never sees (or size-limits) this request at all.
  photoUpload.single("photo"),
  validate({ body: createConfiscationSchema }),
  asyncHandler(confiscationsController.createConfiscation)
);

confiscationsRouter.get(
  "/:id",
  requirePermission("confiscations.view"),
  validate({ params: confiscationIdParamsSchema }),
  asyncHandler(confiscationsController.getConfiscation)
);

confiscationsRouter.get(
  "/:id/photo",
  requirePermission("confiscations.view"),
  validate({ params: confiscationIdParamsSchema }),
  asyncHandler(confiscationsController.getPhoto)
);

confiscationsRouter.post(
  "/:id/return",
  requirePermission("confiscations.return"),
  validate({ params: confiscationIdParamsSchema, body: returnConfiscationSchema }),
  asyncHandler(confiscationsController.returnConfiscation)
);
