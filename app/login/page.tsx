import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — StudioMVP" };

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">StudioMVP</div>
        <div className="sub">Sign in to your client or admin portal. We&rsquo;ll email you a secure link — no password needed.</div>
        <LoginForm />
        <div className="auth-foot">
          <Link href="/">← Back to studiomvp.co.uk</Link>
        </div>
      </div>
    </div>
  );
}
