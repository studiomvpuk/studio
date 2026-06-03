export default function AdminTop({
  title,
  live,
  actions,
}: {
  title: string;
  live?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="top">
      <h1>{title}</h1>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {live !== undefined && (
          <span className={`badge ${live ? "b-ok" : "b-mute"}`}>{live ? "Live data" : "Demo mode"}</span>
        )}
        {actions}
      </div>
    </div>
  );
}
