import Link from "next/link";
import StartForm from "./StartForm";

export const metadata = { title: "Start a project — StudioMVP" };

export default function StartPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">Start a project</div>
        <div className="sub">Tell us what you&rsquo;re building. We&rsquo;ll come back with a plan, a timeline and a price — usually within a day.</div>
        <StartForm />
        <div className="auth-foot">
          <Link href="/">← Back to studiomvp.co.uk</Link>
        </div>
      </div>
    </div>
  );
}
