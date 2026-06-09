import { getRetainers, getProjectOptions, getClientOptions } from "@/lib/data";
import AdminTop from "../../AdminTop";
import RetainersManager from "./RetainersManager";

export const metadata = { title: "Retainers — StudioMVP Admin" };

export default async function RetainersPage() {
  const { live, rows } = await getRetainers();
  const [projects, clients] = await Promise.all([getProjectOptions(), getClientOptions()]);

  return (
    <>
      <AdminTop title="Retainers" live={live} />
      <RetainersManager retainers={rows} projects={projects} clients={clients} />
    </>
  );
}
