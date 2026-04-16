import { NextResponse } from "next/server";
import { hasManageSession } from "@/lib/manage-auth";

export async function GET() {
  return NextResponse.json({
    authenticated: await hasManageSession()
  });
}
