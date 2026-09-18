import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { authRateLimiter } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import * as authController from "./controller";
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  refreshSchema,
} from "./schema";

export const authRouter = Router();

authRouter.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

authRouter.post(
  "/refresh",
  authRateLimiter,
  validate({ body: refreshSchema }),
  asyncHandler(authController.refresh)
);

authRouter.post("/logout", validate({ body: refreshSchema }), asyncHandler(authController.logout));

authRouter.post(
  "/password-reset/request",
  authRateLimiter,
  validate({ body: passwordResetRequestSchema }),
  asyncHandler(authController.requestPasswordReset)
);

authRouter.post(
  "/password-reset/confirm",
  authRateLimiter,
  validate({ body: passwordResetConfirmSchema }),
  asyncHandler(authController.confirmPasswordReset)
);

authRouter.get("/me", authenticate, asyncHandler(authController.me));
