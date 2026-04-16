import { NextResponse } from "next/server";
import { jsonError, validationError } from "@/lib/api-response";
import { getPrisma } from "@/lib/prisma";
import { requireManageSession } from "@/lib/task-auth";
import {
  createTaskSchema,
  normalizeOptionalDescription
} from "@/lib/task-validation";

export async function GET() {
  const prisma = getPrisma();
  const tasks = await prisma.task.findMany({
    orderBy: [
      {
        status: "asc"
      },
      {
        dueAt: "asc"
      }
    ]
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const unauthorizedResponse = await requireManageSession();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const now = new Date();
  const prisma = getPrisma();
  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: normalizeOptionalDescription(parsed.data.description),
      startAt: parsed.data.startAt ?? now,
      dueAt: parsed.data.dueAt
    }
  });

  if (!task) {
    return jsonError("Failed to create task.", 500);
  }

  return NextResponse.json({ task }, { status: 201 });
}
