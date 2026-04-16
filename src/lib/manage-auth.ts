import { cookies } from "next/headers";
import {
  MANAGE_SESSION_COOKIE,
  MANAGE_SESSION_MAX_AGE_SECONDS,
  createManageSessionToken,
  verifyManageSessionToken
} from "@/lib/manage-session";

export function getManagePassword() {
  return process.env.MANAGE_PASSWORD ?? "";
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "";
}

export async function hasManageSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MANAGE_SESSION_COOKIE)?.value;

  return verifyManageSessionToken(token, getSessionSecret());
}

export function buildManageSessionCookie() {
  return {
    name: MANAGE_SESSION_COOKIE,
    value: createManageSessionToken(getSessionSecret()),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MANAGE_SESSION_MAX_AGE_SECONDS
    }
  };
}

export function buildClearManageSessionCookie() {
  return {
    name: MANAGE_SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    }
  };
}
