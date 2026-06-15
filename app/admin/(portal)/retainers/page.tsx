import { getRetainers, getProjectOptions, getClientOptions, getRetainerTasks, getRetainerTaskUsage, type ProjectTask } from "@/lib/data";
import AdminTop from "../../AdminTop";
import RetainersManager from "./RetainersManager";

export const metadata = { title: "Retainers — StudioMVP Admin" };

export default async function RetainersPage() {
  const { live, rows } = await getRetainers();
  const [projects, clients] = await Promise.all([getProjectOptions(), getClientOptions()]);

  // Tasks + this-period usage for each retainer, so the admin can manage them inline (no extra page).
  const taskLists = await Promise.all(rows.map((r) => getRetainerTasks(r.id)));
  const usages = await Promise.all(rows.map((r) => getRetainerTaskUsage(r.id, r.rawPeriod)));
  const tasksByRetainer: Record<string, ProjectTask[]> = {};
  const usageByRetainer: Record<string, number> = {};
  rows.forEach((r, i) => { tasksByRetainer[r.id] = taskLists[i]; usageByRetainer[r.id] = usages[i]; });

  return (
    <>
      <AdminTop title="Retainers" live={live} />
      <RetainersManager retainers={rows} projects={projects} clients={clients} tasksByRetainer={tasksByRetainer} usageByRetainer={usageByRetainer} />
    </>
  );
}
