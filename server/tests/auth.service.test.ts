import { describe, expect, it } from "vitest";
import {
  hashPassword,
  issueAccessToken,
  verifyAccessToken,
  verifyPassword,
} from "../src/services/auth.service.js";

// Unit tests for the pure, side-effect-free parts of the auth service
// (hashing, token issue/verify). registerUser/loginUser hit Prisma and are
// covered by integration tests once a test database is wired up (Epic 1).

describe("password hashing", () => {
  it("hashes a password and verifies the correct password against it", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against a valid hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext password in the hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toContain("correct-horse-battery-staple");
  });
});

describe("access tokens", () => {
  const payload = { sub: "user-123", email: "reviewer@coseke.test", role: "SCORER" as const };

  it("issues a token that verifies back to the same payload", () => {
    const token = issueAccessToken(payload);
    const verified = verifyAccessToken(token);

    expect(verified?.sub).toBe(payload.sub);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  it("returns null for a tampered token", () => {
    const token = issueAccessToken(payload);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(verifyAccessToken(tampered)).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(verifyAccessToken("not-a-jwt")).toBeNull();
  });
});
