import Link from "next/link";
import { hasManageSession } from "@/lib/manage-auth";
import { TaskDashboard } from "../task-dashboard";
import { ManageLoginForm } from "./login-form";
import { ManageLogoutButton } from "./logout-button";

export default async function ManagePage() {
  const isAuthenticated = await hasManageSession();

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen px-6 py-8 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
          <Link className="text-sm font-medium text-[var(--primary)]" href="/">
            返回公开看板
          </Link>
          <h1 className="mt-6 text-3xl font-bold">进入管理区</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            首页可以直接查看 DDL，看任务增删改查需要管理密码。
          </p>
          <ManageLoginForm />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              className="text-sm font-medium text-[var(--primary)]"
              href="/"
            >
              返回公开看板
            </Link>
            <h1 className="mt-4 text-4xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
              任务管理
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              新增、编辑、完成、归档和删除都在这里处理。公开首页继续保持只读。
            </p>
          </div>
          <ManageLogoutButton />
        </header>

        <TaskDashboard mode="manage" />
      </section>
    </main>
  );
}
