import Link from "next/link";
import { requirePermission } from "@/lib/guards";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { InviteForm } from "@/components/team/invite-form";
import { ArrowLeft } from "lucide-react";

export default async function InvitePage() {
  await requirePermission("team:invite");
  const t = await getT();

  return (
    <div>
      <PageHeader title="Invite team member" description="Send an email invitation with access to your HSE workspace">
        <Link
          href="/team"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to team", "العودة إلى الفريق")}
        </Link>
      </PageHeader>
      <InviteForm />
    </div>
  );
}