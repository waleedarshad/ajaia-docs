import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div>
          <h1>Ajaia Docs</h1>
          <p className="muted" style={{ margin: 0 }}>Sign in to create, edit and share documents.</p>
        </div>
        <LoginForm demoPassword={process.env.DEMO_PASSWORD ?? "demo1234"} />
      </div>
    </div>
  );
}
