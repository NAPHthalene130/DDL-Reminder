import Link from "next/link";

export function TopNav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link
          className="text-lg font-bold tracking-normal text-[var(--foreground)]"
          href="/"
        >
          DDL-Reminder
        </Link>

        <Link
          aria-label="任务配置"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--panel)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          href="/manage"
          title="任务配置"
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
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 0 1-2.97 2.97l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21.4a2.1 2.1 0 0 1-4.2 0v-.15a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.05.05a2.1 2.1 0 0 1-2.97-2.97l.05-.05A1.8 1.8 0 0 0 3.6 15a1.8 1.8 0 0 0-1.66-1.1H1.8a2.1 2.1 0 0 1 0-4.2h.15A1.8 1.8 0 0 0 3.6 8.6a1.8 1.8 0 0 0-.36-1.98l-.05-.05a2.1 2.1 0 0 1 2.97-2.97l.05.05a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 9.3 2.35V2.2a2.1 2.1 0 0 1 4.2 0v.15a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.05-.05a2.1 2.1 0 0 1 2.97 2.97l-.05.05a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.66 1.1H21a2.1 2.1 0 0 1 0 4.2h-.15A1.8 1.8 0 0 0 19.4 15Z" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
