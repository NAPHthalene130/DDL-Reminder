import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env["DATABASE_URL"] || "file:./data/ddl-reminder.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: databaseUrl
  }
});
