import { NextResponse } from "next/server";
import { buildClearManageSessionCookie } from "@/lib/manage-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const sessionCookie = buildClearManageSessionCookie();
  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  );

  return response;
}
