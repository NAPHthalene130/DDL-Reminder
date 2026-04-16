import Link from "next/link";
import { appConfig } from "@/lib/env";
import { TaskDashboard } from "./task-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[var(--primary)]">
              Public DDL dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
              {appConfig.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              一个以 PC 端 Web 为主、同时适配手机端的个人 DDL
              看板。这里保持只读，管理区负责增删改查。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)]"
              href="/manage"
            >
              管理任务
            </Link>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
              默认时区：
              <span className="font-semibold text-[var(--foreground)]">
                {appConfig.timezone}
              </span>
            </div>
          </div>
        </header>

        <TaskDashboard mode="public" />
      </section>
    </main>
  );
}
