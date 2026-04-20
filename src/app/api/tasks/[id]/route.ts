import { NextResponse } from "next/server";
import { jsonError, validationError } from "@/lib/api-response";
import { getPrisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/task-auth";
import { TASK_ERROR_MESSAGES } from "@/lib/task-error-messages";
import {
  isValidTaskDateRange,
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
  const { response, session } = await requireUserSession();

  if (response) {
    return response;
  }

  const taskId = await parseTaskId(context);

  if (!taskId) {
    return jsonError(TASK_ERROR_MESSAGES.idInvalid, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const prisma = getPrisma();
  const existingTask = await prisma.task
    .findFirst({
      where: {
        id: taskId,
        userId: session.user.id
      }
    })
    .catch(() => null);

  if (!existingTask) {
    return jsonError(TASK_ERROR_MESSAGES.notFound, 404);
  }

  const nextStartAt = parsed.data.startAt ?? existingTask.startAt;
  const nextDueAt = parsed.data.dueAt ?? existingTask.dueAt;

  if (!isValidTaskDateRange(nextStartAt, nextDueAt)) {
    return jsonError(TASK_ERROR_MESSAGES.dateRangeInvalid, 400);
  }

  const updateResult = await prisma.task
    .updateMany({
      where: {
        id: taskId,
        userId: session.user.id
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

  if (!updateResult?.count) {
    return jsonError(TASK_ERROR_MESSAGES.notFound, 404);
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId
    }
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response, session } = await requireUserSession();

  if (response) {
    return response;
  }

  const taskId = await parseTaskId(context);

  if (!taskId) {
    return jsonError(TASK_ERROR_MESSAGES.idInvalid, 400);
  }

  const prisma = getPrisma();
  const task = await prisma.task
    .deleteMany({
      where: {
        id: taskId,
        userId: session.user.id
      }
    })
    .catch(() => null);

  if (!task?.count) {
    return jsonError(TASK_ERROR_MESSAGES.notFound, 404);
  }

  return NextResponse.json({ ok: true });
}

async function parseTaskId(context: RouteContext) {
  const params = await context.params;
  const parsed = taskIdSchema.safeParse(params.id);

  return parsed.success ? parsed.data : null;
}
