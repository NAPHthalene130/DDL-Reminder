import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DDL Reminder",
  description:
    "Track deadlines, progress, and reminders in one focused dashboard."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
