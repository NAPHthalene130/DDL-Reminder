"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DeadlineStatus } from "@/lib/deadline";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const HOUR_MS = 60 * 60 * 1000;
const TIMELINE_HOURS = 72;
const TIMELINE_HALF = TIMELINE_HOURS / 2;
const TIMELINE_STEP_HOURS = 3;

const STATUS_LABELS: Record<DeadlineStatus, string> = {
  normal: "正常",
  approaching: "临近",
  urgent: "紧急",
  overdue: "已逾期",
  completed: "已完成",
  archived: "已归档"
};

type CalendarTask = {
  id: string;
  title: string;
  status: string;
  startDate: Date | null;
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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
    { date: prevMonth, position: "prev" as const, cardLeft: "0%", cardWidth: "33.333%" },
    { date: centerMonth, position: "center" as const, cardLeft: "33.333%", cardWidth: "33.333%" },
    { date: nextMonth, position: "next" as const, cardLeft: "66.667%", cardWidth: "33.333%" }
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

  const timelineTasks = useMemo(() => {
    const now = today.getTime();
    const start = now - TIMELINE_HALF * HOUR_MS;
    const end = now + TIMELINE_HALF * HOUR_MS;

    const inRange = tasks
      .filter((t) => {
        if (!t.hasDeadline || !t.dueDate) return false;
        if (t.status !== "ACTIVE") return false;
        const dueMs = t.dueDate.getTime();
        return dueMs >= start && dueMs <= end;
      })
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

    return { now, start, end, tasks: inRange };
  }, [tasks, today]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return tasksByDay.get(selectedDay) ?? [];
  }, [selectedDay, tasksByDay]);

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

  const handleDayClick = useCallback((cellKey: string) => {
    setSelectedDay((prev) => (prev === cellKey ? null : cellKey));
  }, []);

  function jumpToYearMonth(year: number, month: number) {
    setCenterMonth(new Date(year, month, 1));
    setPickerOpen(false);
  }

  const positionStyles: Record<string, { transform: string; transformOrigin: string; zIndex: number; opacity: number }> = {
    prev: {
      transform: "rotateY(18deg) scale(0.92)",
      transformOrigin: "right center",
      zIndex: 1,
      opacity: 0.5
    },
    center: {
      transform: "rotateY(0deg) scale(1)",
      transformOrigin: "center center",
      zIndex: 2,
      opacity: 1
    },
    next: {
      transform: "rotateY(-18deg) scale(0.92)",
      transformOrigin: "left center",
      zIndex: 1,
      opacity: 0.5
    }
  };

  return (
    <section className="flex flex-col gap-8">
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wide">任务总览</h2>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              按截止时间排列
            </p>
          </div>
          <div className="relative" ref={pickerRef}>
            <button
              aria-expanded={pickerOpen}
              aria-label="选择年月"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
              onClick={() => setPickerOpen((v) => !v)}
              title="选择年月"
              type="button"
            >
              <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
              {formatYearMonth(centerMonth)}
              <svg aria-hidden="true" className={`size-3.5 transition-transform ${pickerOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {pickerOpen ? (
              <YearMonthPicker
                centerMonth={centerMonth}
                onSelect={jumpToYearMonth}
              />
            ) : null}
          </div>
        </div>

        <div
          className="relative h-0 overflow-visible"
          style={{ paddingBottom: "28%" }}
        >
          <div
            className="absolute inset-0"
            style={{ perspective: "1000px" }}
          >
            {months.map((month) => {
              const pos = positionStyles[month.position];
              return (
                <button
                  key={formatYearMonth(month.date)}
                  aria-label={`切换到 ${formatYearMonth(month.date)}`}
                  className="absolute top-0 h-full rounded-lg border p-3 text-left transition-[left,transform,opacity,border-color,background-color] duration-500 ease-in-out"
                  disabled={month.position === "center"}
                  onClick={() => handleMonthClick(month.position)}
                  style={{
                    left: month.cardLeft,
                    width: month.cardWidth,
                    transform: pos.transform,
                    transformOrigin: pos.transformOrigin,
                    zIndex: pos.zIndex,
                    opacity: pos.opacity,
                    borderColor:
                      month.position === "center"
                        ? "var(--primary)"
                        : "var(--border)",
                    backgroundColor: "var(--panel)"
                  }}
                  type="button"
                >
                  <MonthGrid
                    isCenter={month.position === "center"}
                    monthDate={month.date}
                    onDayClick={handleDayClick}
                    selectedDay={selectedDay}
                    tasksByDay={tasksByDay}
                    today={today}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            aria-label="上一个月"
            className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--foreground)]"
            onClick={() => handleMonthClick("prev")}
            type="button"
          >
            <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {formatYearMonth(centerMonth)}
          </span>
          <button
            aria-label="下一个月"
            className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--foreground)]"
            onClick={() => handleMonthClick("next")}
            type="button"
          >
            <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {selectedDay ? (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {formatDateChinese(selectedDay)} 的任务
                <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">
                  ({selectedDayTasks.length} 个)
                </span>
              </h3>
              <button
                aria-label="关闭"
                className="inline-flex size-6 items-center justify-center rounded text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={() => setSelectedDay(null)}
                type="button"
              >
                <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            {selectedDayTasks.length === 0 ? (
              <p className="py-2 text-center text-xs text-[var(--muted-foreground)]">
                该日没有截止的任务
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayTasks.map((task) => (
                  <div
                    className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--field)] px-3 py-2.5"
                    key={task.id}
                  >
                    <span
                      className="block size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[task.deadlineStatus]
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {task.title}
                      </p>
                      {task.dueDate ? (
                        <p className="mt-0.5 truncate text-[10px] text-[var(--muted-foreground)]">
                          截止 {formatDateTime(task.dueDate)}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: STATUS_COLORS[task.deadlineStatus] + "20",
                        color: STATUS_COLORS[task.deadlineStatus]
                      }}
                    >
                      {STATUS_LABELS[task.deadlineStatus]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="mb-5 text-xl font-bold tracking-wide">近3天任务</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <SeventyTwoHourTimeline timeline={timelineTasks} />
        </div>
      </section>
    </section>
  );
}

function YearMonthPicker({
  centerMonth,
  onSelect
}: {
  centerMonth: Date;
  onSelect: (year: number, month: number) => void;
}) {
  const [viewYear, setViewYear] = useState(centerMonth.getFullYear());
  const curYear = centerMonth.getFullYear();
  const curMonth = centerMonth.getMonth();

  return (
    <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <button
          aria-label="上一年"
          className="inline-flex size-7 items-center justify-center rounded text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={() => setViewYear((y) => y - 1)}
          type="button"
        >
          <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-bold">{viewYear}年</span>
        <button
          aria-label="下一年"
          className="inline-flex size-7 items-center justify-center rounded text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={() => setViewYear((y) => y + 1)}
          type="button"
        >
          <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }, (_, i) => {
          const isCurrent = viewYear === curYear && i === curMonth;
          return (
            <button
              className={`rounded py-2 text-xs font-medium transition ${
                isCurrent
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              key={i}
              onClick={() => onSelect(viewYear, i)}
              type="button"
            >
              {i + 1}月
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({
  isCenter,
  monthDate,
  onDayClick,
  selectedDay,
  tasksByDay,
  today
}: {
  isCenter: boolean;
  monthDate: Date;
  onDayClick: (cellKey: string) => void;
  selectedDay: string | null;
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
          const isSelected = cellKey === selectedDay;

          return (
            <button
              className={`flex flex-col items-center gap-0.5 rounded py-1 text-xs transition ${
                isToday
                  ? "bg-[var(--primary)] font-bold text-[var(--primary-foreground)]"
                  : isSelected
                    ? "bg-[var(--muted)] font-semibold text-[var(--foreground)]"
                    : "hover:bg-[var(--muted)]"
              } ${isCenter ? "" : "pointer-events-none"}`}
              key={day}
              onClick={() => onDayClick(cellKey)}
              role="gridcell"
              type="button"
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SeventyTwoHourTimeline({
  timeline
}: {
  timeline: {
    now: number;
    start: number;
    end: number;
    tasks: CalendarTask[];
  };
}) {
  const { now, start, end, tasks } = timeline;
  const totalMs = end - start;

  function pct(ms: number) {
    return ((ms - start) / totalMs) * 100;
  }

  const scaleMarks: number[] = [];
  for (let h = -TIMELINE_HALF; h <= TIMELINE_HALF; h += TIMELINE_STEP_HOURS) {
    scaleMarks.push(h);
  }

  const isMajorLabel = (h: number) => h % 6 === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-20 shrink-0" />
        <div className="relative h-10 flex-1 min-w-0">
          <div className="absolute inset-x-0 top-3 h-1 rounded-full bg-[var(--muted)]" />

          <div
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${pct(now)}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="size-3 rounded-full border-2 border-[var(--primary)] bg-[var(--primary)]" />
              <span className="mt-0.5 text-[10px] font-semibold text-[var(--primary)]">
                现在
              </span>
            </div>
          </div>

          {scaleMarks.map((h) => {
            if (h === 0) return null;
            const markMs = now + h * HOUR_MS;
            const leftPct = pct(markMs);
            if (leftPct < 1 || leftPct > 99) return null;
            const major = isMajorLabel(h);

            return (
              <div
                className="absolute top-3 -translate-x-1/2"
                key={h}
                style={{ left: `${leftPct}%` }}
              >
                {major ? (
                  <>
                    <div className="size-1.5 rounded-full bg-[var(--muted-foreground)]" />
                    <span className="mt-0.5 block text-center text-[10px] leading-none text-[var(--muted-foreground)]">
                      {h > 0 ? `+${h}h` : `${h}h`}
                    </span>
                  </>
                ) : (
                  <div className="size-1 rounded-full bg-[var(--border)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          未来72小时内没有待办任务
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tasks.map((task) => {
            const dueMs = task.dueDate!.getTime();
            const startMs = task.startDate
              ? Math.max(task.startDate.getTime(), start)
              : start;
            const barStartPct = pct(startMs);
            const barEndPct = pct(dueMs);
            const barWidth = barEndPct - barStartPct;
            const isOverdue = dueMs < now;
            const diffHours = Math.abs(
              Math.round((dueMs - now) / HOUR_MS * 10) / 10
            );

            return (
              <div className="flex items-center gap-2.5" key={task.id}>
                <span
                  className={`w-20 shrink-0 text-right text-[10px] leading-tight ${
                    isOverdue
                      ? "text-[var(--danger)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {isOverdue ? `逾期 ${diffHours}h` : `${diffHours}h 后`}
                </span>
                <div className="relative h-10 flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 rounded bg-[var(--muted)]" style={{ right: 0 }} />

                  <div
                    className="absolute inset-y-0 rounded"
                    style={{
                      left: `${barStartPct}%`,
                      width: `${barWidth}%`,
                      backgroundColor: STATUS_COLORS[task.deadlineStatus] + "30",
                      border: `1px solid ${STATUS_COLORS[task.deadlineStatus]}40`
                    }}
                  />

                  <span
                    className="absolute top-0 -translate-x-1/2 -translate-y-full pb-1 text-[10px] leading-none text-[var(--muted-foreground)]"
                    style={{ left: `${barStartPct}%` }}
                  >
                    {formatTimeShort(new Date(startMs))}
                  </span>

                  <span
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium"
                    style={{
                      left: `${barStartPct + (barEndPct - barStartPct) / 2}%`,
                      color: STATUS_COLORS[task.deadlineStatus]
                    }}
                  >
                    {task.title}
                  </span>

                  <span
                    className="absolute top-0 -translate-x-1/2 -translate-y-full pb-1 text-[10px] leading-none font-semibold"
                    style={{
                      left: `${barEndPct}%`,
                      color: STATUS_COLORS[task.deadlineStatus]
                    }}
                  >
                    {formatTimeShort(task.dueDate!)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeShort(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${m}-${d} ${hh}:${mm}`;
}

function formatDateTime(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${m}-${d} ${hh}:${mm}`;
}

function formatDateChinese(dateKey: string) {
  const [y, m, d] = dateKey.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
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
