import Link from "next/link";
import { hasManageSession } from "@/lib/manage-auth";
import { TaskDashboard } from "../task-dashboard";
import { ManageLoginForm } from "./login-form";

export default async function ManagePage() {
  const isAuthenticated = await hasManageSession();

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
          <h1 className="text-3xl font-bold">任务配置</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            输入管理密码后，可以新增、编辑、完成、归档和删除任务。
          </p>
          <ManageLoginForm />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link
          aria-label="退出设置"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          href="/"
          title="退出设置"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </Link>

        <TaskDashboard mode="manage" />
      </section>
    </main>
  );
}
