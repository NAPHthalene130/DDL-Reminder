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
      className="h-10 rounded-md border border-red-500 bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSubmitting}
      onClick={handleLogout}
      type="button"
    >
      {isSubmitting ? "退出中..." : "退出登录"}
    </button>
  );
}
