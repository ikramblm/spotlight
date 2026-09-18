import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as authService from "./service";
import type {
  LoginInput,
  RefreshInput,
  PasswordResetRequestInput,
  PasswordResetConfirmInput,
} from "./schema";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;
  const result = await authService.login(email, password, req.ip ?? null);
  res.status(200).json({
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshInput;
  const result = await authService.refresh(refreshToken, req.ip ?? null);
  res.status(200).json({
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshInput;
  await authService.logout(refreshToken, req.user?.id ?? null);
  res.status(204).send();
}

export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body as PasswordResetRequestInput;
  await authService.requestPasswordReset(email);
  res.status(202).json({ data: { message: "If that account exists, a reset link has been sent." } });
}

export async function confirmPasswordReset(req: Request, res: Response) {
  const { token, newPassword } = req.body as PasswordResetConfirmInput;
  await authService.confirmPasswordReset(token, newPassword);
  res.status(200).json({ data: { message: "Password updated. Please log in again." } });
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  res.status(200).json({ data: req.user });
}
