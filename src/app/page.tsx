import { TaskDashboard } from "./task-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <TaskDashboard mode="public" />
      </section>
    </main>
  );
}
