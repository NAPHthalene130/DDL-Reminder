import "dotenv/config";

import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL || "file:./data/ddl-reminder.db";

if (databaseUrl === ":memory:" || databaseUrl === "file::memory:") {
  process.exit(0);
}

if (!databaseUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL must use the file: scheme for SQLite.");
}

const databasePath = databaseUrl.replace(/^file:/, "");

if (!databasePath) {
  throw new Error("DATABASE_URL must include a SQLite database file path.");
}

const absolutePath = resolve(process.cwd(), databasePath);

mkdirSync(dirname(absolutePath), { recursive: true });
closeSync(openSync(absolutePath, "a"));

console.log(`SQLite database file ready at ${absolutePath}`);
