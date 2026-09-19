import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, tenants } from "@/lib/db/schema";
import { ROLE_LABELS } from "@/lib/permissions";
import { ROLES } from "@/lib/constants";
import { getT } from "@/lib/i18n";
import { AcceptInviteForm } from "./accept-form";
import { MailCheck, MailX, ShieldCheck } from "lucide-react";

const NOW = Date.now();

type Params = Promise<{ token: string }>;

const roleLabelAr = Object.fromEntries(ROLES.map((r) => [r.value, r.labelAr]));

export default async function AcceptInvitePage({ params }: { params: Params }) {
  const t = await getT();
  const { token } = await params;
  const invite = db.select().from(invitations).where(eq(invitations.token, token)).get();
  const tenant = invite ? db.select().from(tenants).where(eq(tenants.id, invite.tenantId)).get() : null;

  const usable = !!invite && invite.status === "pending" && invite.expiresAt >= NOW;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b px-8 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold">HSE Dashboard</p>
            <p className="text-xs text-muted-foreground">
              {t("Accept your workspace invitation", "قبول دعوة مساحة العمل الخاصة بك")}
            </p>
          </div>
        </div>

        <div className="p-8">
          {usable && invite && tenant ? (
            <>
              <h1 className="text-xl font-bold">{t("You're invited", "أنت مدعو")}</h1>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">
                {t("Set your password below to create your account and get started.", "عيّن كلمة المرور أدناه لإنشاء حسابك والبدء.")}
              </p>
              <AcceptInviteForm
                token={invite.token}
                name={invite.name}
                email={invite.email}
                role={invite.role}
                jobTitle={invite.jobTitle}
                tenantName={tenant.name}
              />
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <MailX className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-bold">Invitation unavailable</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {!invite
                  ? "This invitation link is invalid. Ask the person who invited you for a new one."
                  : invite.status === "revoked"
                    ? "This invitation was revoked by an administrator."
                    : invite.status === "accepted"
                      ? "This invitation has already been used. Sign in with your account."
                      : "This invitation has expired or is no longer valid. Ask an administrator to send a new one."}
              </p>
            </>
          )}
          <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
            {usable ? (
              <>
                <MailCheck className="mr-1 inline h-3.5 w-3.5" />
                Invited as{" "}
                {invite ? (ROLE_LABELS[invite.role as keyof typeof ROLE_LABELS] ?? invite.role) : ""} —{" "}
                <Link className="text-primary underline-offset-4 hover:underline" href="/login">
                  have an account? Sign in
                </Link>
              </>
            ) : (
              <Link className="text-primary underline-offset-4 hover:underline" href="/login">
                Go to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}