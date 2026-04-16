import { createHmac, timingSafeEqual } from "node:crypto";

export const MANAGE_SESSION_COOKIE = "ddl_manage_session";
export const MANAGE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type ManageSessionPayload = {
  version: 1;
  issuedAt: number;
  expiresAt: number;
};

export function createManageSessionToken(
  secret: string,
  now: Date = new Date()
) {
  assertSecret(secret);

  const issuedAt = now.getTime();
  const payload: ManageSessionPayload = {
    version: 1,
    issuedAt,
    expiresAt: issuedAt + MANAGE_SESSION_MAX_AGE_SECONDS * 1000
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyManageSessionToken(
  token: string | undefined,
  secret: string,
  now: Date = new Date()
) {
  if (!token || !secret) {
    return false;
  }

  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra) {
    return false;
  }

  if (!safeEqual(signature, sign(encodedPayload, secret))) {
    return false;
  }

  const payload = parsePayload(encodedPayload);

  if (!payload) {
    return false;
  }

  return payload.expiresAt > now.getTime();
}

export function verifyManagePassword(input: string, expected: string) {
  if (!input || !expected) {
    return false;
  }

  return safeEqual(input, expected);
}

function parsePayload(encodedPayload: string): ManageSessionPayload | null {
  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<
      Record<keyof ManageSessionPayload, unknown>
    >;

    if (
      payload.version !== 1 ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    return payload as ManageSessionPayload;
  } catch {
    return null;
  }
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function assertSecret(secret: string) {
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is required to create a management session."
    );
  }
}
