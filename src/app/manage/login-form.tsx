"use client";

import { FormEvent, useState } from "react";

export function ManageLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/manage/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setError("管理密码不正确。");
      setIsSubmitting(false);
      return;
    }

    window.location.reload();
  }

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
        管理密码
        <input
          autoComplete="current-password"
          className="h-11 rounded-md border border-[var(--border)] bg-[var(--field)] px-3 text-base text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="输入管理密码"
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button
        className="h-11 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "验证中..." : "进入管理区"}
      </button>
    </form>
  );
}
