import { describe, expect, it } from "vitest";
import {
  createManageSessionToken,
  verifyManagePassword,
  verifyManageSessionToken
} from "./manage-session";

const secret = "test-session-secret-with-enough-length";

describe("manage session tokens", () => {
  it("verifies a token signed with the same secret", () => {
    const now = new Date("2026-04-16T00:00:00.000Z");
    const token = createManageSessionToken(secret, now);

    expect(verifyManageSessionToken(token, secret, now)).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    const now = new Date("2026-04-16T00:00:00.000Z");
    const token = createManageSessionToken(secret, now);

    expect(verifyManageSessionToken(token, "different-secret", now)).toBe(
      false
    );
  });

  it("rejects an expired token", () => {
    const token = createManageSessionToken(
      secret,
      new Date("2026-04-16T00:00:00.000Z")
    );

    expect(
      verifyManageSessionToken(
        token,
        secret,
        new Date("2026-04-24T00:00:00.000Z")
      )
    ).toBe(false);
  });

  it("rejects a tampered token", () => {
    const now = new Date("2026-04-16T00:00:00.000Z");
    const token = createManageSessionToken(secret, now);
    const tamperedToken = token.replace(".", "x.");

    expect(verifyManageSessionToken(tamperedToken, secret, now)).toBe(false);
  });
});

describe("verifyManagePassword", () => {
  it("accepts the expected password", () => {
    expect(verifyManagePassword("correct-password", "correct-password")).toBe(
      true
    );
  });

  it("rejects an incorrect password", () => {
    expect(verifyManagePassword("wrong-password", "correct-password")).toBe(
      false
    );
  });

  it("rejects empty values", () => {
    expect(verifyManagePassword("", "correct-password")).toBe(false);
    expect(verifyManagePassword("correct-password", "")).toBe(false);
  });
});
