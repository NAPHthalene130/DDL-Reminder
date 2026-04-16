import Link from "next/link";
import { appConfig } from "@/lib/env";

const setupItems = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "SQLite + Prisma",
  "Public dashboard",
  "Protected management area"
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[var(--primary)]">
              SQLite-ready foundation
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
              {appConfig.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              一个以 PC 端 Web 为主、同时适配手机端的个人 DDL
              管理工具已经接入轻量 SQLite 数据层。
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

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">任务看板占位</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  接下来会接入任务 API
                  和真实看板。首页保持公开只读，增删改查操作放在受保护管理区。
                </p>
              </div>
              <span className="inline-flex w-fit rounded-md bg-[var(--muted)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
                Awaiting tasks
              </span>
            </div>

            <div className="mt-8 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-8 text-center">
              <p className="text-lg font-semibold">还没有任务</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Phase 4 和 Phase 5 完成后，这里会显示任务、剩余时间、状态和 DDL
                进度条。
              </p>
            </div>
          </div>

          <aside className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">当前基础能力</h2>
            <ul className="mt-5 space-y-3">
              {setupItems.map((item) => (
                <li
                  className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]"
                  key={item}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}
