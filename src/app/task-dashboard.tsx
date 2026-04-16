"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateDeadlineProgress,
  DeadlineStatus,
  getDeadlineStatus,
  getRemainingTimeParts
} from "@/lib/deadline";
import { TaskStatusValue } from "@/lib/task-constants";

type TaskDto = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  dueAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TaskView = TaskDto & {
  status: TaskStatusValue;
  startDate: Date;
  dueDate: Date;
  progress: number;
  deadlineStatus: DeadlineStatus;
  remainingText: string;
};

type TaskFormState = {
  title: string;
  description: string;
  startAt: string;
  dueAt: string;
};

type ApiTaskResponse = {
  task?: TaskDto;
  tasks?: TaskDto[];
  error?: string;
  issues?: Array<{
    message: string;
  }>;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  startAt: "",
  dueAt: ""
};

const STATUS_RANK: Record<TaskStatusValue, number> = {
  ACTIVE: 0,
  COMPLETED: 1,
  ARCHIVED: 2
};

const STATUS_META: Record<
  DeadlineStatus,
  {
    label: string;
    toneClass: string;
    barClass: string;
  }
> = {
  normal: {
    label: "正常",
    toneClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    barClass: "bg-emerald-600"
  },
  approaching: {
    label: "临近",
    toneClass: "border-amber-200 bg-amber-50 text-amber-800",
    barClass: "bg-amber-500"
  },
  due_today: {
    label: "今天截止",
    toneClass: "border-yellow-200 bg-yellow-50 text-yellow-800",
    barClass: "bg-yellow-500"
  },
  overdue: {
    label: "已逾期",
    toneClass: "border-red-200 bg-red-50 text-red-700",
    barClass: "bg-red-600"
  },
  completed: {
    label: "已完成",
    toneClass: "border-zinc-200 bg-zinc-100 text-zinc-700",
    barClass: "bg-zinc-500"
  },
  archived: {
    label: "已归档",
    toneClass: "border-zinc-200 bg-zinc-100 text-zinc-500",
    barClass: "bg-zinc-400"
  }
};

export function TaskDashboard({ mode }: { mode: "public" | "manage" }) {
  const isManageMode = mode === "manage";
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(() => createEmptyForm());
  const [now, setNow] = useState(() => new Date());

  const loadTasks = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        cache: "no-store"
      });
      const payload = (await response.json()) as ApiTaskResponse;

      if (!response.ok) {
        throw new Error(payload.error || "任务加载失败。");
      }

      setTasks(payload.tasks ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const visibleTasks = useMemo(() => {
    return tasks
      .map((task) => toTaskView(task, now))
      .filter((task) => isManageMode || task.status !== "ARCHIVED")
      .sort(compareTaskViews);
  }, [isManageMode, now, tasks]);

  const stats = useMemo(() => {
    return {
      active: visibleTasks.filter((task) => task.status === "ACTIVE").length,
      dueToday: visibleTasks.filter(
        (task) => task.deadlineStatus === "due_today"
      ).length,
      overdue: visibleTasks.filter((task) => task.deadlineStatus === "overdue")
        .length,
      completed: visibleTasks.filter((task) => task.status === "COMPLETED")
        .length
    };
  }, [visibleTasks]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = formToPayload(form);
      const endpoint = editingTaskId
        ? `/api/tasks/${editingTaskId}`
        : "/api/tasks";
      const response = await fetch(endpoint, {
        method: editingTaskId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as ApiTaskResponse;

      if (!response.ok || !data.task) {
        throw new Error(getApiError(data));
      }

      const savedTask = data.task;

      setTasks((currentTasks) => upsertTask(currentTasks, savedTask));
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runTaskAction(
    taskId: string,
    endpoint: string,
    method: "POST" | "DELETE"
  ) {
    setBusyTaskId(taskId);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method
      });
      const data = (await response.json()) as ApiTaskResponse;

      if (!response.ok) {
        throw new Error(getApiError(data));
      }

      if (method === "DELETE") {
        setTasks((currentTasks) =>
          currentTasks.filter((task) => task.id !== taskId)
        );
      } else if (data.task) {
        const savedTask = data.task;

        setTasks((currentTasks) => upsertTask(currentTasks, savedTask));
      }

      if (editingTaskId === taskId) {
        resetForm();
      }
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyTaskId(null);
    }
  }

  function startEditing(task: TaskView) {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description ?? "",
      startAt: toDatetimeLocalValue(task.startDate),
      dueAt: toDatetimeLocalValue(task.dueDate)
    });
  }

  function resetForm() {
    setEditingTaskId(null);
    setForm(createEmptyForm());
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBlock label="进行中" value={stats.active} />
        <StatBlock label="今天截止" value={stats.dueToday} />
        <StatBlock label="已逾期" value={stats.overdue} isWarning />
        <StatBlock label="已完成" value={stats.completed} />
      </section>

      {isManageMode ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(340px,0.75fr)_1.25fr]">
          <form
            className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5"
            onSubmit={handleSubmit}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">
                {editingTaskId ? "编辑任务" : "新增任务"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {editingTaskId ? "调整 DDL 信息" : "写下新的 DDL"}
              </h2>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              标题
              <input
                className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--primary)]"
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value
                  }))
                }
                placeholder="例如：提交课程论文"
                required
                value={form.title}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              描述
              <textarea
                className="min-h-28 resize-y rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base leading-6 outline-none focus:border-[var(--primary)]"
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value
                  }))
                }
                placeholder="材料、链接、提交要求..."
                value={form.description}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                开始时间
                <input
                  className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      startAt: event.target.value
                    }))
                  }
                  required
                  type="datetime-local"
                  value={form.startAt}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                DDL 时间
                <input
                  className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dueAt: event.target.value
                    }))
                  }
                  required
                  type="datetime-local"
                  value={form.dueAt}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? "保存中..."
                  : editingTaskId
                    ? "保存修改"
                    : "添加任务"}
              </button>
              {editingTaskId ? (
                <button
                  className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-semibold"
                  onClick={resetForm}
                  type="button"
                >
                  取消编辑
                </button>
              ) : null}
            </div>
          </form>

          <TaskList
            busyTaskId={busyTaskId}
            isLoading={isLoading}
            mode={mode}
            onArchive={(taskId) =>
              runTaskAction(taskId, `/api/tasks/${taskId}/archive`, "POST")
            }
            onComplete={(taskId) =>
              runTaskAction(taskId, `/api/tasks/${taskId}/complete`, "POST")
            }
            onDelete={(taskId) => {
              if (window.confirm("确认删除这个任务吗？")) {
                void runTaskAction(taskId, `/api/tasks/${taskId}`, "DELETE");
              }
            }}
            onEdit={startEditing}
            tasks={visibleTasks}
          />
        </section>
      ) : (
        <TaskList
          busyTaskId={busyTaskId}
          isLoading={isLoading}
          mode={mode}
          tasks={visibleTasks}
        />
      )}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TaskList({
  busyTaskId,
  isLoading,
  mode,
  onArchive,
  onComplete,
  onDelete,
  onEdit,
  tasks
}: {
  busyTaskId: string | null;
  isLoading: boolean;
  mode: "public" | "manage";
  onArchive?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: TaskView) => void;
  tasks: TaskView[];
}) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center">
        <p className="text-lg font-semibold">正在读取任务</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          DDL 清单马上出现。
        </p>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center">
        <p className="text-lg font-semibold">还没有任务</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {mode === "manage"
            ? "从左侧添加第一个 DDL。"
            : "管理区添加任务后，这里会显示剩余时间和进度。"}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {tasks.map((task) => (
        <TaskCard
          busyTaskId={busyTaskId}
          key={task.id}
          mode={mode}
          onArchive={onArchive}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
          task={task}
        />
      ))}
    </section>
  );
}

function TaskCard({
  busyTaskId,
  mode,
  onArchive,
  onComplete,
  onDelete,
  onEdit,
  task
}: {
  busyTaskId: string | null;
  mode: "public" | "manage";
  onArchive?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: TaskView) => void;
  task: TaskView;
}) {
  const meta = STATUS_META[task.deadlineStatus];
  const isBusy = busyTaskId === task.id;

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="break-words text-2xl font-semibold leading-tight">
              {task.title}
            </h2>
            <span
              className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${meta.toneClass}`}
            >
              {meta.label}
            </span>
          </div>
          {task.description ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--muted-foreground)]">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 text-sm lg:min-w-72">
          <InfoPill label="剩余" value={task.remainingText} />
          <InfoPill label="DDL" value={formatDateTime(task.dueDate)} />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--muted-foreground)]">
          <span>DDL 进度</span>
          <span>{Math.round(task.progress)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-md bg-[var(--muted)]">
          <div
            className={`h-full rounded-md transition-[width] ${meta.barClass}`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs text-[var(--muted-foreground)] sm:flex-row sm:justify-between">
          <span>开始：{formatDateTime(task.startDate)}</span>
          <span>更新：{formatDateTime(new Date(task.updatedAt))}</span>
        </div>
      </div>

      {mode === "manage" ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <TaskActionButton onClick={() => onEdit?.(task)}>
            编辑
          </TaskActionButton>
          {task.status === "ACTIVE" ? (
            <TaskActionButton
              disabled={isBusy}
              onClick={() => onComplete?.(task.id)}
            >
              完成
            </TaskActionButton>
          ) : null}
          {task.status !== "ARCHIVED" ? (
            <TaskActionButton
              disabled={isBusy}
              onClick={() => onArchive?.(task.id)}
            >
              归档
            </TaskActionButton>
          ) : null}
          <TaskActionButton
            danger
            disabled={isBusy}
            onClick={() => onDelete?.(task.id)}
          >
            删除
          </TaskActionButton>
        </div>
      ) : null}
    </article>
  );
}

function StatBlock({
  isWarning = false,
  label,
  value
}: {
  isWarning?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-5 py-4">
      <p className="text-sm font-medium text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${
          isWarning ? "text-[var(--danger)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[var(--muted)] px-3 py-2">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function TaskActionButton({
  children,
  danger = false,
  disabled = false,
  onClick
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[var(--border)] bg-white text-[var(--foreground)]"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function toTaskView(task: TaskDto, now: Date): TaskView {
  const status = toTaskStatus(task.status);
  const startDate = new Date(task.startAt);
  const dueDate = new Date(task.dueAt);
  const deadlineStatus = getDeadlineStatus({
    taskStatus: status,
    dueAt: dueDate,
    now
  });

  return {
    ...task,
    status,
    startDate,
    dueDate,
    progress: calculateDeadlineProgress({
      startAt: startDate,
      dueAt: dueDate,
      now
    }),
    deadlineStatus,
    remainingText: getRemainingText(status, dueDate, now)
  };
}

function compareTaskViews(left: TaskView, right: TaskView) {
  const rankDiff = STATUS_RANK[left.status] - STATUS_RANK[right.status];

  if (rankDiff !== 0) {
    return rankDiff;
  }

  if (left.status === "ACTIVE") {
    return left.dueDate.getTime() - right.dueDate.getTime();
  }

  return right.dueDate.getTime() - left.dueDate.getTime();
}

function toTaskStatus(status: string): TaskStatusValue {
  if (status === "COMPLETED" || status === "ARCHIVED") {
    return status;
  }

  return "ACTIVE";
}

function getRemainingText(status: TaskStatusValue, dueAt: Date, now: Date) {
  if (status === "COMPLETED") {
    return "已完成";
  }

  if (status === "ARCHIVED") {
    return "已归档";
  }

  const remaining = getRemainingTimeParts(dueAt, now);

  if (remaining.isOverdue) {
    return `逾期 ${formatDuration(now.getTime() - dueAt.getTime())}`;
  }

  if (remaining.totalMs < 60 * 1000) {
    return "不足 1 分钟";
  }

  return formatDuration(remaining.totalMs);
}

function formatDuration(totalMs: number) {
  const totalMinutes = Math.max(1, Math.floor(totalMs / (60 * 1000)));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days > 0) {
    parts.push(`${days} 天`);
  }

  if (hours > 0) {
    parts.push(`${hours} 小时`);
  }

  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} 分钟`);
  }

  return parts.slice(0, 2).join(" ");
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function toDatetimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
}

function createEmptyForm(): TaskFormState {
  const startAt = new Date();
  const dueAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000);

  return {
    ...EMPTY_FORM,
    startAt: toDatetimeLocalValue(startAt),
    dueAt: toDatetimeLocalValue(dueAt)
  };
}

function formToPayload(form: TaskFormState) {
  return {
    title: form.title,
    description: form.description,
    startAt: new Date(form.startAt).toISOString(),
    dueAt: new Date(form.dueAt).toISOString()
  };
}

function upsertTask(tasks: TaskDto[], task: TaskDto) {
  const existingIndex = tasks.findIndex(
    (currentTask) => currentTask.id === task.id
  );

  if (existingIndex === -1) {
    return [...tasks, task];
  }

  return tasks.map((currentTask) =>
    currentTask.id === task.id ? task : currentTask
  );
}

function getApiError(data: ApiTaskResponse) {
  if (data.issues && data.issues.length > 0) {
    return data.issues.map((issue) => issue.message).join(" ");
  }

  return data.error || "请求失败。";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败。";
}
