import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main style={{ padding: 32 }}>
      <h1>Ajaia Docs</h1>
      <p>
        Signed in as <strong>{user.name}</strong> ({user.email}). Dashboard arrives in the next phase.
      </p>
    </main>
  );
}
