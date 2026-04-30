"use client";

import { useMemo, useState } from "react";
import type { DeadlineStatus } from "@/lib/deadline";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

type CalendarTask = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  deadlineStatus: DeadlineStatus;
  hasDeadline: boolean;
};

const STATUS_COLORS: Record<DeadlineStatus, string> = {
  normal: "#cfd9f4",
  approaching: "#f5c84c",
  urgent: "#f59e0b",
  overdue: "#ff7a8a",
  completed: "#4bae50",
  archived: "#a5ad9b"
};

type CalendarViewProps = {
  tasks: CalendarTask[];
};

export default function CalendarView({ tasks }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const [centerMonth, setCenterMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const prevMonth = new Date(
    centerMonth.getFullYear(),
    centerMonth.getMonth() - 1,
    1
  );
  const nextMonth = new Date(
    centerMonth.getFullYear(),
    centerMonth.getMonth() + 1,
    1
  );

  const months = [
    { date: prevMonth, key: "prev" },
    { date: centerMonth, key: "center" },
    { date: nextMonth, key: "next" }
  ];

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      if (!task.hasDeadline || !task.dueDate) continue;
      const key = dateKey(task.dueDate);
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    }
    return map;
  }, [tasks]);

  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  const timelineTasks = useMemo(() => {
    return timelineDays.map((day) => {
      const key = dateKey(day);
      return {
        date: day,
        tasks: (tasksByDay.get(key) ?? []).filter(
          (t) => t.status === "ACTIVE"
        )
      };
    });
  }, [timelineDays, tasksByDay]);

  function handleMonthClick(monthKey: string) {
    if (monthKey === "prev") {
      setCenterMonth(
        new Date(centerMonth.getFullYear(), centerMonth.getMonth() - 1, 1)
      );
    } else if (monthKey === "next") {
      setCenterMonth(
        new Date(centerMonth.getFullYear(), centerMonth.getMonth() + 1, 1)
      );
    }
  }

  return (
    <section className="flex flex-col gap-8">
      <section>
        <h2 className="mb-5 text-xl font-bold tracking-wide">任务总览</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {months.map((month) => {
            const isCenter = month.key === "center";
            return (
              <button
                key={month.key}
                aria-label={`切换到 ${formatYearMonth(month.date)}`}
                className={`rounded-lg border p-3 text-left transition ${
                  isCenter
                    ? "border-[var(--primary)] bg-[var(--panel)] opacity-100"
                    : "border-[var(--border)] bg-[var(--panel)] opacity-50 hover:opacity-75"
                }`}
                disabled={isCenter}
                onClick={() => handleMonthClick(month.key)}
                type="button"
              >
                <MonthGrid
                  isCenter={isCenter}
                  monthDate={month.date}
                  tasksByDay={tasksByDay}
                  today={today}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-bold tracking-wide">近7天任务</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          {timelineTasks.every((d) => d.tasks.length === 0) ? (
            <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              未来7天内没有待办任务
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {timelineTasks.map(({ date, tasks: dayTasks }) => (
                <TimelineDay
                  date={date}
                  isToday={dateKey(date) === dateKey(today)}
                  key={dateKey(date)}
                  tasks={dayTasks}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function MonthGrid({
  isCenter,
  monthDate,
  tasksByDay,
  today
}: {
  isCenter: boolean;
  monthDate: Date;
  tasksByDay: Map<string, CalendarTask[]>;
  today: Date;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const todayKey = dateKey(today);

  return (
    <div>
      <p
        className={`mb-2 text-sm font-bold ${
          isCenter ? "" : "pointer-events-none"
        }`}
      >
        {formatYearMonth(monthDate)}
      </p>
      <div
        className="grid grid-cols-7 gap-px text-center text-xs"
        role="grid"
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            className="py-1 font-semibold text-[var(--muted-foreground)]"
            key={label}
          >
            {label}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }
          const cellDate = new Date(year, month, day);
          const cellKey = dateKey(cellDate);
          const dayTasks = tasksByDay.get(cellKey) ?? [];
          const isToday = cellKey === todayKey;

          return (
            <div
              className={`flex flex-col items-center gap-0.5 rounded py-1 text-xs ${
                isToday
                  ? "bg-[var(--primary)] font-bold text-[var(--primary-foreground)]"
                  : ""
              }`}
              key={day}
              role="gridcell"
            >
              <span>{day}</span>
              {dayTasks.length > 0 ? (
                <div className="flex gap-0.5">
                  {dayTasks.slice(0, 3).map((task, taskIndex) => (
                    <span
                      className="block size-1.5 rounded-full"
                      key={taskIndex}
                      style={{
                        backgroundColor: STATUS_COLORS[task.deadlineStatus]
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineDay({
  date,
  isToday,
  tasks
}: {
  date: Date;
  isToday: boolean;
  tasks: CalendarTask[];
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex w-20 shrink-0 flex-col items-center rounded-md px-2 py-1 text-xs ${
          isToday
            ? "bg-[var(--primary)] font-bold text-[var(--primary-foreground)]"
            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
        }`}
      >
        <span>
          {date.getMonth() + 1}/{date.getDate()}
        </span>
        <span className="text-[10px]">
          {["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {tasks.length === 0 ? (
          <p className="py-1 text-xs text-[var(--muted-foreground)]">无任务</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tasks.map((task) => (
              <span
                className="inline-block max-w-full truncate rounded px-2 py-0.5 text-xs font-medium"
                key={task.id}
                style={{
                  backgroundColor: STATUS_COLORS[task.deadlineStatus] + "30",
                  color: STATUS_COLORS[task.deadlineStatus],
                  border: `1px solid ${STATUS_COLORS[task.deadlineStatus]}50`
                }}
                title={task.title}
              >
                {task.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatYearMonth(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}
