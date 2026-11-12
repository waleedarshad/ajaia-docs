import Link from "next/link";
import type { SessionUser } from "@/server/session";
import { SignOutButton } from "./SignOutButton";

export function AppHeader({ user, children }: { user: SessionUser; children?: React.ReactNode }) {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        Ajaia Docs
      </Link>
      <div className="header-middle">{children}</div>
      <div className="header-user">
        <span className="muted">{user.name}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
