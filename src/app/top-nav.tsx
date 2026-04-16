import Link from "next/link";
import { hasManageSession } from "@/lib/manage-auth";
import { ManageLogoutButton } from "./manage/logout-button";

export async function TopNav() {
  const isAuthenticated = await hasManageSession();

  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link
          className="text-lg font-bold tracking-normal text-[var(--foreground)]"
          href="/"
        >
          DDL-Reminder
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? <ManageLogoutButton /> : null}
        </div>
      </div>
    </nav>
  );
}
