import { getRetainers, getProjectOptions } from "@/lib/data";
import AdminTop from "../../AdminTop";
import RetainersManager from "./RetainersManager";

export const metadata = { title: "Retainers — StudioMVP Admin" };

export default async function RetainersPage() {
  const { live, rows } = await getRetainers();
  const projects = await getProjectOptions();

  return (
    <>
      <AdminTop title="Retainers" live={live} />
      <RetainersManager retainers={rows} projects={projects} />
    </>
  );
}
