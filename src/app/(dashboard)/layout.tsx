import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return <Shell userName={session.user?.name}>{children}</Shell>;
}
