import { hasManageSession } from "@/lib/manage-auth";
import { TaskDashboard } from "../task-dashboard";
import { ManageLoginForm } from "./login-form";
import { ManageLogoutButton } from "./logout-button";

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-[var(--foreground)]">
              任务配置
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              管理你的 DDL 清单。
            </p>
          </div>
          <ManageLogoutButton />
        </div>

        <TaskDashboard mode="manage" />
      </section>
    </main>
  );
}
