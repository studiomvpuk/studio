import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import ClientTop from "../../ClientTop";
import NoProject from "../../NoProject";
import Approvals from "../../Approvals";

export const metadata = { title: "Approvals — StudioMVP" };

export default async function ApprovalsPage() {
  const session = await getSession();
  const data = await getClientData(session?.userId);
  const pending = data.approvals.filter((a) => a.status === "pending").length;

  return (
    <>
      <ClientTop title="Approvals" sub={data.hasProject ? `${pending} awaiting your review` : undefined} />
      <div className="grid">
        {!data.hasProject ? (
          <NoProject note="No approvals yet. When the team shares work for sign-off, it lands here." />
        ) : (
          <div style={{ gridColumn: "1 / -1" }}>
            <Approvals initial={data.approvals} />
          </div>
        )}
      </div>
    </>
  );
}
