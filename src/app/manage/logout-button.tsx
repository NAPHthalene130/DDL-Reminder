"use client";

import { useState } from "react";

export function ManageLogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    await fetch("/api/manage/logout", {
      method: "POST"
    });

    window.location.reload();
  }

  return (
    <button
      className="h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSubmitting}
      onClick={handleLogout}
      type="button"
    >
      {isSubmitting ? "退出中..." : "退出管理"}
    </button>
  );
}
