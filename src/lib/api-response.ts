import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      error: "Invalid request.",
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    },
    { status: 400 }
  );
}
