import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const tenant = await getCurrentTenant();

  return (
    <DashboardShell session={session} tenantName={tenant.name}>
      {children}
    </DashboardShell>
  );
}