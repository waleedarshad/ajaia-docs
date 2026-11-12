"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERS = [
  { email: "alice@ajaia.test", name: "Alice" },
  { email: "bob@ajaia.test", name: "Bob" },
  { email: "carol@ajaia.test", name: "Carol" },
];

export function LoginForm({ demoPassword }: { demoPassword: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span>Email</span>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span>Password</span>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifyContent: "center" }}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className="demo-users muted">
        Demo accounts (password <code>{demoPassword}</code>):{" "}
        {DEMO_USERS.map((u, i) => (
          <span key={u.email}>
            <button type="button" onClick={() => { setEmail(u.email); setPassword(demoPassword); }}>
              {u.name}
            </button>
            {i < DEMO_USERS.length - 1 ? ", " : ""}
          </span>
        ))}
      </div>
    </form>
  );
}
