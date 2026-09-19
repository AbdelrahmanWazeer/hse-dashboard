"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, users, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getBaseUrl } from "@/lib/url";
import { sendInvitationEmail } from "@/lib/email";

const INVITE_TTL = 7 * 24 * 60 * 60 * 1000;
const ROLE_VALUES = ["admin", "editor", "publisher", "viewer"] as const;

export type InviteFormState = {
  error?: string;
  ok?: string;
  inviteUrl?: string;
};

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createInviteToken() {
  return randomBytes(24).toString("base64url");
}

export async function createInvitation(_state: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const user = await requirePermission("team:invite");
  const tenant = await getCurrentTenant();

  const name = s(formData, "name");
  const email = s(formData, "email").toLowerCase();
  const role = s(formData, "role");
  const jobTitle = s(formData, "jobTitle");

  if (!name) return { error: "Full name is required." };
  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  if (!ROLE_VALUES.includes(role as never)) return { error: "Please choose a role." };
  if (!jobTitle) return { error: "Job title is required." };

  const existingInvite = db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tenantId, tenant.id),
        eq(invitations.email, email),
        eq(invitations.status, "pending")
      )
    )
    .get();
  if (existingInvite) return { error: "An invitation is already pending for this email." };

  const existingUser = db.select().from(users).where(eq(users.email, email)).get();
  if (existingUser) return { error: "An account with this email already exists. Ask them to sign in instead." };

  const now = Date.now();
  const token = await createInviteToken();
  db.insert(invitations)
    .values({
      id: id("inv"),
      tenantId: tenant.id,
      email,
      name,
      role,
      jobTitle,
      token,
      status: "pending",
      invitedById: user.id,
      expiresAt: now + INVITE_TTL,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const inviteUrl = `${await getBaseUrl()}/accept/${token}`;
  const emailResult = await sendInvitationEmail({
    to: email,
    name,
    inviteUrl,
    tenantName: tenant.name,
    role,
    jobTitle,
  });

  revalidatePath("/team");
  if (!emailResult.ok) {
    return {
      ok: `Invitation created for ${email} but the email couldn't be sent (${emailResult.detail}). Share the link below with the invitee.`,
      inviteUrl,
    };
  }
  return { ok: `Invitation sent to ${email}.` };
}

export async function resendInvitation(formData: FormData) {
  await requirePermission("team:invite");
  const tenant = await getCurrentTenant();
  const inviteId = s(formData, "id");
  const invite = db.select().from(invitations).where(eq(invitations.id, inviteId)).get();
  if (!invite || invite.tenantId !== tenant.id) {
    revalidatePath("/team");
    return;
  }

  const now = Date.now();
  const token = await createInviteToken();
  db.update(invitations)
    .set({ token, status: "pending", expiresAt: now + INVITE_TTL, updatedAt: now })
    .where(eq(invitations.id, inviteId))
    .run();

  const inviteUrl = `${await getBaseUrl()}/accept/${token}`;
  await sendInvitationEmail({
    to: invite.email,
    name: invite.name,
    inviteUrl,
    tenantName: tenant.name,
    role: invite.role,
    jobTitle: invite.jobTitle,
  });

  revalidatePath("/team");
}

export async function revokeInvitation(formData: FormData) {
  await requirePermission("team:invite");
  const tenant = await getCurrentTenant();
  const inviteId = s(formData, "id");
  const invite = db.select().from(invitations).where(eq(invitations.id, inviteId)).get();
  if (!invite || invite.tenantId !== tenant.id) {
    revalidatePath("/team");
    return;
  }
  db.update(invitations)
    .set({ status: "revoked", updatedAt: Date.now() })
    .where(eq(invitations.id, inviteId))
    .run();
  revalidatePath("/team");
}