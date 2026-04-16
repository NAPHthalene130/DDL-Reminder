import { NextResponse } from "next/server";
import { jsonError, validationError } from "@/lib/api-response";
import { getPrisma } from "@/lib/prisma";
import { requireManageSession } from "@/lib/task-auth";
import {
  normalizeOptionalDescription,
  taskIdSchema,
  updateTaskSchema
} from "@/lib/task-validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorizedResponse = await requireManageSession();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const taskId = await parseTaskId(context);

  if (!taskId) {
    return jsonError("Invalid task id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const prisma = getPrisma();
  const task = await prisma.task
    .update({
      where: {
        id: taskId
      },
      data: {
        ...(parsed.data.title !== undefined
          ? { title: parsed.data.title }
          : {}),
        ...(parsed.data.description !== undefined
          ? {
              description: normalizeOptionalDescription(parsed.data.description)
            }
          : {}),
        ...(parsed.data.startAt !== undefined
          ? { startAt: parsed.data.startAt }
          : {}),
        ...(parsed.data.dueAt !== undefined ? { dueAt: parsed.data.dueAt } : {})
      }
    })
    .catch(() => null);

  if (!task) {
    return jsonError("Task not found.", 404);
  }

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorizedResponse = await requireManageSession();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const taskId = await parseTaskId(context);

  if (!taskId) {
    return jsonError("Invalid task id.", 400);
  }

  const prisma = getPrisma();
  const task = await prisma.task
    .delete({
      where: {
        id: taskId
      }
    })
    .catch(() => null);

  if (!task) {
    return jsonError("Task not found.", 404);
  }

  return NextResponse.json({ ok: true });
}

async function parseTaskId(context: RouteContext) {
  const params = await context.params;
  const parsed = taskIdSchema.safeParse(params.id);

  return parsed.success ? parsed.data : null;
}
