import jwt from "jsonwebtoken";
import { generateRefreshToken, hashRefreshToken, signAccessToken, verifyAccessToken } from "./tokens";
import type { AuthenticatedUser } from "../types";

const user: AuthenticatedUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "owner@test.local",
  role: "business_owner",
  permissions: ["users.view"],
};

describe("access tokens", () => {
  it("round-trips the user's identity, role and permissions", () => {
    const token = signAccessToken(user);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.role).toBe(user.role);
    expect(payload.permissions).toEqual(user.permissions);
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken(user);
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("rejects an alg:none token even though no secret is needed to forge one", () => {
    const forged = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, permissions: ["users.view", "users.deactivate"] },
      "",
      { algorithm: "none" }
    );
    expect(() => verifyAccessToken(forged)).toThrow();
  });
});

describe("refresh tokens", () => {
  it("never stores the raw token, only its hash", () => {
    const { token, tokenHash } = generateRefreshToken();
    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toBe(hashRefreshToken(token));
  });

  it("generates a different token on every call", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.token).not.toBe(b.token);
  });
});
