import { NextResponse } from "next/server";
import { z } from "zod";
import { buildManageSessionCookie, getManagePassword } from "@/lib/manage-auth";
import { verifyManagePassword } from "@/lib/manage-session";

const loginSchema = z.object({
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Password is required." },
      { status: 400 }
    );
  }

  if (!verifyManagePassword(parsed.data.password, getManagePassword())) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const sessionCookie = buildManageSessionCookie();
  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  );

  return response;
}
