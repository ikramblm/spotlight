import type { NextFunction, Request, Response } from "express";
import { requirePermission, requireRole } from "../src/middleware/rbac";
import { AppError } from "../src/lib/AppError";
import type { AuthenticatedUser } from "../src/types";

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    email: "user@test.local",
    role: "operations_manager",
    permissions: [],
    ...overrides,
  };
}

describe("requirePermission middleware", () => {
  it("calls next() with no arguments when the user has every required permission", () => {
    const req = { user: makeUser({ permissions: ["users.view", "users.edit"] }) } as unknown as Request;
    const next = jest.fn() as NextFunction;

    requirePermission("users.view", "users.edit")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("forwards a 403 AppError when a required permission is missing", () => {
    const req = { user: makeUser({ permissions: ["users.view"] }) } as unknown as Request;
    const next = jest.fn() as NextFunction;

    requirePermission("users.view", "users.deactivate")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as jest.Mock).mock.calls[0][0] as AppError;
    expect(err.status).toBe(403);
  });

  it("forwards a 401 AppError when there is no authenticated user", () => {
    const req = {} as Request;
    const next = jest.fn() as NextFunction;

    requirePermission("users.view")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as jest.Mock).mock.calls[0][0] as AppError;
    expect(err.status).toBe(401);
  });
});

describe("requireRole middleware", () => {
  it("allows a matching role through", () => {
    const req = { user: makeUser({ role: "security_staff" }) } as unknown as Request;
    const next = jest.fn() as NextFunction;

    requireRole("security_staff", "business_owner")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("blocks a role that is not in the allowed list", () => {
    const req = { user: makeUser({ role: "event_coordinator" }) } as unknown as Request;
    const next = jest.fn() as NextFunction;

    requireRole("business_owner")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as jest.Mock).mock.calls[0][0] as AppError;
    expect(err.status).toBe(403);
  });
});
