# DDL-Reminder Project Plan

## Summary

DDL-Reminder is a self-hosted personal web app for tracking tasks and DDL times. The home page is a public read-only dashboard that opens directly in the browser and shows active tasks, remaining time, deadline status, and progress bars.

Only the task management area is protected. The user can open the dashboard without logging in, but creating, editing, completing, archiving, or deleting tasks requires a management password.

The project is for one person, so the default database should be SQLite instead of PostgreSQL. SQLite keeps deployment, backups, and local development lighter while remaining enough for this low-concurrency personal tool.

## Recommended Tech Stack

- Frontend and full-stack framework: Next.js App Router + TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui or Radix UI primitives when useful
- Database: SQLite
- ORM and migrations: Prisma
- Validation: Zod
- Tests: Vitest
- Email: Nodemailer with SMTP configuration
- Deployment: Docker Compose or direct Node.js process
- Runtime services:
  - `app`: Next.js web application
  - `worker`: reminder scanner and email sender
- Reverse proxy: Nginx or Caddy for HTTPS, domain routing, and optional extra access control

## Database Choice

Use SQLite for the first version.

Reasons:

- This app is single-user and low-concurrency.
- SQLite removes the need to run and maintain a separate database service.
- Backups are simple because the data lives in one file, for example `data/ddl-reminder.db`.
- It is easier to deploy on a small self-managed server.
- Prisma supports SQLite well for this project’s current schema and query needs.

Tradeoffs:

- SQLite is not ideal for high-write concurrency or future multi-user collaboration.
- If the app later needs multiple users, heavy reporting, or complex integrations, migrate to PostgreSQL.
- The current project has no production data yet, so switching from the existing PostgreSQL plan to SQLite is safe.

## Core Features

### Public Dashboard

The root page `/` should open directly without login.

It should show:

- Active tasks sorted by DDL time from nearest to farthest.
- Task title.
- Optional description.
- DDL time.
- Remaining time in days, hours, and minutes.
- DDL progress bar.
- Task status label:
  - Normal
  - Approaching
  - Due today
  - Overdue
  - Completed, only if completed tasks are shown

The dashboard is read-only. It must not expose create, edit, complete, archive, or delete actions.

### Protected Management Area

The management area `/manage` is the only protected UI.

The user can:

- Enter the management password.
- Create a task with title, DDL time, optional description, and optional start time.
- Edit task title, description, start time, and DDL time.
- Mark a task as completed.
- Archive or delete a task.
- Log out of the management session.

Authentication rules:

- No registration.
- No user table.
- No full-site login.
- Configure the management password with `MANAGE_PASSWORD`.
- Sign the management session with `SESSION_SECRET`.
- Store the session in an HTTP-only cookie.
- Public read APIs are allowed.
- All write APIs require a valid management session.

### DDL Progress

Progress calculation:

```text
progress = (now - startAt) / (dueAt - startAt)
```

The displayed progress should be clamped between `0%` and `100%`.

If the user does not provide `startAt`, use the task creation time as the start time.

### Email Reminders

Email reminders remain part of the first version.

The worker service should:

- Run every 5 minutes.
- Scan incomplete active tasks.
- Send reminder emails through SMTP.
- Write successful sends into `ReminderLog`.
- Avoid duplicate reminders for the same task and reminder type.
- Continue running if one email fails, while logging the failure.

Initial reminder types:

- 24 hours before DDL.
- 1 hour before DDL.
- Once after the task becomes overdue.

## Data Model

### Task

Fields:

- `id`
- `title`
- `description`
- `startAt`
- `dueAt`
- `status`
- `createdAt`
- `updatedAt`

Recommended statuses:

- `ACTIVE`
- `COMPLETED`
- `ARCHIVED`

For SQLite, prefer string fields for status-like values and enforce allowed values in TypeScript/Zod. This avoids relying on database enum behavior that differs across database providers.

### ReminderLog

Fields:

- `id`
- `taskId`
- `reminderType`
- `sentAt`

Recommended reminder types:

- `DUE_IN_24H`
- `DUE_IN_1H`
- `OVERDUE`

Add a unique constraint on `taskId` and `reminderType` to prevent duplicate reminders.

## API Design

Use Next.js Route Handlers.

Public endpoints:

- `GET /api/tasks`

Management authentication endpoints:

- `POST /api/manage/login`
- `POST /api/manage/logout`
- `GET /api/manage/session`

Protected task endpoints:

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/complete`
- `POST /api/tasks/:id/archive`

Input validation should use Zod.

Validation rules:

- Task title cannot be empty.
- `dueAt` must be a valid date.
- `startAt`, if provided, must be a valid date.
- `dueAt` must be later than `startAt`.
- Task description is optional.
- Task status and reminder type must match the allowed constants.

## UI Plan

### Pages

- `/`: public read-only DDL dashboard.
- `/manage`: protected task management page.
- `/manage/login`: management password page, or inline login state inside `/manage`.

### Public Dashboard

The dashboard should prioritize the PC web experience first, while keeping a responsive layout that remains clear and usable on phones.

Recommended sections:

- Header with app name.
- Active task list.
- Optional completed task section.
- Optional link to `/manage`, kept unobtrusive.

Each task card should show:

- Title.
- DDL time.
- Remaining time.
- Progress bar.
- Status label.

### Management Page

The management page should show:

- Add task action.
- Active tasks with edit, complete, archive, and delete actions.
- Optional completed or archived task section.
- Logout action.

### Visual Direction

- PC web-first layout, with responsive support for phone screens.
- Clear task cards with stable dimensions.
- Progress bars should be readable and not depend only on color.
- Management actions should be visually separated from the public dashboard.
- Avoid decorative complexity; the page should feel like a focused personal tool.

## Deployment Plan

SQLite deployment should avoid a separate database container.

Recommended services:

- `app`
  - Runs the Next.js application.
  - Uses Next.js standalone output.
  - Reads and writes the SQLite file.
- `worker`
  - Runs the reminder worker script.
  - Uses the same SQLite file.
  - Uses SMTP environment variables.

Recommended persistent path:

```text
data/ddl-reminder.db
```

For Docker Compose, mount a persistent volume or host directory:

```text
./data:/app/data
```

Production startup should run:

```bash
prisma migrate deploy
```

Recommended deployment files:

- `Dockerfile`
- `compose.yaml`
- `.env.example`
- `README.md`

Reverse proxy:

- Use Nginx or Caddy.
- Terminate HTTPS at the proxy.
- Forward requests to the Next.js app.
- Optionally add extra protection for `/manage`, such as Basic Auth, IP allowlist, or private network access.

Backup:

- Stop or pause writes when possible.
- Back up `data/ddl-reminder.db`.
- Keep periodic off-server copies.

## Environment Variables

Recommended variables:

`DATABASE_URL` defaults to `file:./data/ddl-reminder.db` when omitted, but keeping it explicit is clearer for deployment.

```env
DATABASE_URL=file:./data/ddl-reminder.db
MANAGE_PASSWORD=change-me
SESSION_SECRET=change-me-to-a-long-random-string
APP_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM=DDL Reminder <reminder@example.com>
MAIL_TO=you@example.com
TZ=Asia/Shanghai
```

## Implementation Steps

1. Keep the existing Next.js + TypeScript project foundation.
2. Change Prisma from PostgreSQL to SQLite.
3. Replace the current PostgreSQL initial migration with a SQLite initial migration.
4. Remove PostgreSQL-specific dependencies and Prisma adapter code.
5. Add SQLite adapter dependencies and update the Prisma client factory.
6. Add a small SQLite file preparation script before running production migrations.
7. Keep the existing `Task` and `ReminderLog` domain model, adjusted for SQLite-compatible status fields.
8. Keep and expand shared DDL calculation utilities and tests.
9. Implement public read-only dashboard at `/`.
10. Implement management password session.
11. Implement protected management page at `/manage`.
12. Implement public read API and protected write APIs.
13. Implement the email reminder worker against SQLite.
14. Add Dockerfile and Docker Compose configuration with a persistent `data` mount.
15. Add README instructions for local development, deployment, and SQLite backup.
16. Run local and Docker-based verification.

## Test Plan

### Logic Tests

- Remaining time calculation.
- Progress percentage calculation.
- Progress clamping to `0%` and `100%`.
- Due today status.
- Approaching status.
- Overdue status.
- Completed tasks should not be treated as overdue.
- Reminder deduplication logic.

### Database Tests

- Prisma schema validates for SQLite.
- Initial SQLite migration can be applied.
- Generated Prisma Client works with the SQLite adapter.
- Unique reminder constraint prevents duplicate reminder logs.

### API Tests

- `GET /api/tasks` works without management authentication.
- Write APIs reject unauthenticated requests.
- Management login succeeds with the correct password.
- Management login fails with an incorrect password.
- Creating a valid task succeeds after management login.
- Creating a task with an empty title fails.
- Creating a task with invalid dates fails.
- Creating a task where `dueAt <= startAt` fails.
- Updating a task works after management login.
- Marking a task completed works after management login.
- Completed tasks are ignored by the reminder worker.

### UI Acceptance Tests

- User can open `/` without login.
- Public dashboard shows tasks but no destructive controls.
- User can open `/manage` and authenticate with the management password.
- User can add a task from `/manage`.
- User can edit a task from `/manage`.
- User can mark a task completed from `/manage`.
- User can delete or archive a task from `/manage`.
- Refreshing the page keeps tasks persisted.
- PC layout can scan and manage multiple tasks comfortably.
- Phone layout remains responsive and clearly shows DDL time, remaining time, and progress.

### Deployment Tests

- App can run with `DATABASE_URL=file:./data/ddl-reminder.db`.
- Migrations run successfully in production mode.
- SQLite data remains after container restart.
- Worker starts and logs scan activity.
- SMTP configuration sends a reminder email successfully.
- Backing up and restoring `data/ddl-reminder.db` preserves tasks.

## Recommended Development Order

Implement the project in small vertical slices. The goal is to keep the existing foundation, switch to the lighter storage model early, then build the public dashboard and protected management flow.

### Phase 1: Project Foundation

Status: completed.

Already included:

- Next.js + TypeScript.
- Tailwind CSS.
- ESLint and Prettier.
- Prisma 7 baseline.
- `.env.example`.
- Minimal homepage.

### Phase 2: SQLite Database and Domain Model

Update the existing Phase 2 work to use SQLite.

Tasks:

- Change Prisma datasource provider to SQLite.
- Replace PostgreSQL migration with SQLite migration.
- Remove PostgreSQL adapter and `pg`.
- Add SQLite adapter.
- Add `db:ensure` / `db:migrate` scripts so the SQLite file exists before `prisma migrate deploy`.
- Keep `Task` and `ReminderLog`.
- Keep shared date/progress utility functions.
- Keep logic tests for progress, remaining time, computed status, and reminder deduplication.

Exit criteria:

- Prisma validates for SQLite.
- Migration exists for SQLite.
- SQLite migration can be applied through `npm run db:migrate`.
- `npm test`, `npm run lint`, `npm run format`, and `npm run build` pass.

### Phase 3: Public Dashboard and Management Authentication

Replace the old full-site authentication phase.

Tasks:

- Keep `/` public and read-only.
- Add `/manage` as the protected task management page.
- Implement management password login with `MANAGE_PASSWORD`.
- Add signed HTTP-only cookie session using `SESSION_SECRET`.
- Add logout for the management session.
- Protect only `/manage` and write APIs.

Exit criteria:

- `/` opens without login.
- `/manage` requires the management password.
- Management session can be created and cleared.
- Public users cannot write tasks.

### Phase 4: Task API

Build the task backend around public read and protected writes.

Tasks:

- Implement public `GET /api/tasks`.
- Implement protected `POST /api/tasks`.
- Implement protected `PATCH /api/tasks/:id`.
- Implement protected completion, archive, and delete actions.
- Validate all task inputs with Zod.
- Ensure completed and archived tasks are handled consistently.

Exit criteria:

- Anyone can read tasks.
- Only an authenticated management session can create, update, complete, archive, or delete tasks.
- Invalid task input returns clear errors.

### Phase 5: Main Dashboard and Management UI

Build the real user experience once the API works.

Tasks:

- Build the public dashboard.
- Build the protected management page.
- Add task creation UI.
- Add task editing UI.
- Add task cards or table rows.
- Show DDL time, remaining time, computed status, and progress bar.
- Add complete, archive, and delete actions only in management UI.
- Build the PC web layout first, then add responsive adaptations for phone screens.

Exit criteria:

- Public dashboard is useful without login.
- Management UI can fully manage tasks.
- Refreshing the page keeps data persisted.
- DDL status and progress are visually clear.
- The page works comfortably on PC web and remains usable on phone screens.

### Phase 6: Email Reminder Worker

Add the reminder system after the core app is usable.

Tasks:

- Implement the worker script.
- Scan incomplete active tasks every 5 minutes.
- Detect `DUE_IN_24H`, `DUE_IN_1H`, and `OVERDUE` reminder windows.
- Send email through Nodemailer SMTP.
- Write successful sends to `ReminderLog`.
- Use a unique constraint to prevent duplicates.
- Log failures without stopping the worker.

Exit criteria:

- The worker can find reminder candidates.
- A reminder email can be sent with valid SMTP settings.
- The same reminder type is not sent twice for the same task.
- Completed and archived tasks are ignored.

### Phase 7: Docker and Self-Hosted Deployment

Package the app for the target server after local behavior is stable.

Tasks:

- Add a production `Dockerfile`.
- Add `compose.yaml` with `app` and `worker`.
- Add a persistent `data` mount for SQLite.
- Run `prisma migrate deploy` during production startup.
- Document reverse proxy setup for Nginx or Caddy.
- Document SQLite backup expectations.

Exit criteria:

- App and worker start successfully.
- SQLite data survives container restarts.
- Worker can access the same database file.
- Backup and restore instructions are clear.

### Phase 8: Final Hardening

Polish security, reliability, and documentation last.

Tasks:

- Review required environment variables.
- Ensure `MANAGE_PASSWORD` and `SESSION_SECRET` are required in production.
- Check cookie security settings for HTTPS deployment.
- Add useful empty states and error messages.
- Add README instructions for local development and server deployment.
- Run the full test suite.
- Perform a manual end-to-end check.

Exit criteria:

- A fresh developer can follow the README to run the project.
- A server deployment has a clear path.
- The app handles common invalid states gracefully.
- Tests and manual checks pass.

### Recommended Milestones

Milestone 1: SQLite-backed public dashboard with persisted tasks seeded or created through scripts/API. This proves the lighter storage model.

Milestone 2: Protected `/manage` page with full task CRUD. This makes the app useful day to day.

Milestone 3: Email worker. This turns the app from a passive tracker into an active reminder system.

Milestone 4: Docker Compose deployment and SQLite backup documentation. This makes it ready for the self-hosted server.

## Future Enhancements

- Task priority.
- Tags or categories.
- Search and filters.
- Recurring tasks.
- Calendar view.
- Browser notifications.
- WeChat, Telegram, or webhook reminders.
- Optional private dashboard mode.
- Import/export as JSON or CSV.
- Statistics for completed and overdue tasks.
- PostgreSQL migration path if multi-user or heavy usage becomes necessary.

## Assumptions

- The first version is for personal use only.
- The public dashboard can be viewed without login.
- Only the task management UI and write APIs require authentication.
- No registration or multi-user account system is needed.
- SQLite is the default database.
- Email reminders remain part of v1.
- Browser notifications and chat app reminders are out of scope for v1.
- Default timezone is `Asia/Shanghai`.
