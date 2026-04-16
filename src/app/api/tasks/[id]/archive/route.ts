import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getPrisma } from "@/lib/prisma";
import { requireManageSession } from "@/lib/task-auth";
import { taskIdSchema } from "@/lib/task-validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const unauthorizedResponse = await requireManageSession();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const params = await context.params;
  const parsed = taskIdSchema.safeParse(params.id);

  if (!parsed.success) {
    return jsonError("Invalid task id.", 400);
  }

  const prisma = getPrisma();
  const task = await prisma.task
    .update({
      where: {
        id: parsed.data
      },
      data: {
        status: "ARCHIVED"
      }
    })
    .catch(() => null);

  if (!task) {
    return jsonError("Task not found.", 404);
  }

  return NextResponse.json({ task });
}
