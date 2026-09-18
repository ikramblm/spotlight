import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as usersController from "./controller";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamsSchema,
} from "./schema";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  "/",
  requirePermission("users.view"),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(usersController.listUsers)
);

usersRouter.post(
  "/",
  requirePermission("users.create"),
  validate({ body: createUserSchema }),
  asyncHandler(usersController.createUser)
);

usersRouter.get(
  "/:id",
  requirePermission("users.view"),
  validate({ params: userIdParamsSchema }),
  asyncHandler(usersController.getUser)
);

usersRouter.patch(
  "/:id",
  requirePermission("users.edit"),
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  asyncHandler(usersController.updateUser)
);

usersRouter.post(
  "/:id/activate",
  requirePermission("users.deactivate"),
  validate({ params: userIdParamsSchema }),
  asyncHandler(usersController.activateUser)
);

usersRouter.post(
  "/:id/deactivate",
  requirePermission("users.deactivate"),
  validate({ params: userIdParamsSchema }),
  asyncHandler(usersController.deactivateUser)
);
