import { getSession } from "@/lib/auth";
import { getClientData, getProjectTasks } from "@/lib/data";
import ClientTop from "../../ClientTop";
import NoProject from "../../NoProject";
import TaskBoard from "@/app/components/TaskBoard";

export const metadata = { title: "Tasks — StudioMVP" };

export default async function TasksPage() {
  const session = await getSession();
  const data = await getClientData(session?.userId);
  const tasks = data.projectId ? await getProjectTasks(data.projectId) : [];
  const open = tasks.filter((t) => t.status !== "confirmed").length;

  return (
    <>
      <ClientTop title="Tasks" sub={data.hasProject ? `${open} open` : undefined} />
      <div className="grid">
        {!data.hasProject || !data.projectId ? (
          <NoProject note="No tasks yet. Once your project is set up, you can ask us to do things here and track them through to done." name={session?.name || ""} email={session?.email || ""} />
        ) : (
          <div style={{ gridColumn: "1 / -1" }}>
            <TaskBoard projectId={data.projectId} role="client" initial={tasks} />
          </div>
        )}
      </div>
    </>
  );
}
