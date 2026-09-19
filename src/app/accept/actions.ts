"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, memberships, teamMembers, invitations, tenants, id } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";

export type AcceptInviteState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function acceptInvitation(_state: AcceptInviteState, formData: FormData): Promise<AcceptInviteState> {
  const token = s(formData, "token");
  const name = s(formData, "name");
  const password = s(formData, "password");
  const confirm = s(formData, "confirm");

  const invite = db.select().from(invitations).where(eq(invitations.token, token)).get();
  if (!invite) return { error: "This invitation link is invalid. Ask the person who invited you for a new one." };
  if (invite.status === "accepted") {
    return { error: "This invitation has already been accepted. Please sign in with your email instead." };
  }
  if (invite.status === "revoked") {
    return { error: "This invitation was revoked by an administrator." };
  }
  if (invite.status === "expired" || invite.expiresAt < Date.now()) {
    db.update(invitations).set({ status: "expired", updatedAt: Date.now() }).where(eq(invitations.id, invite.id)).run();
    return { error: "This invitation has expired. Ask an administrator to send a new one." };
  }

  if (!name) return { error: "Please enter your full name." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const tenant = db.select().from(tenants).where(eq(tenants.id, invite.tenantId)).get();
  if (!tenant) return { error: "This invitation is no longer valid." };

  const email = invite.email.toLowerCase();
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    db.update(invitations).set({ status: "accepted", updatedAt: Date.now() }).where(eq(invitations.id, invite.id)).run();
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  const now = Date.now();
  const userId = id("usr");
  const passwordHash = await bcrypt.hash(password, 10);
  db.insert(users)
    .values({
      id: userId,
      name,
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  db.insert(memberships)
    .values({
      id: id("mem"),
      userId,
      tenantId: invite.tenantId,
      role: invite.role,
      jobTitle: invite.jobTitle,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  db.insert(teamMembers)
    .values({
      id: id("tm"),
      tenantId: invite.tenantId,
      userId,
      name,
      email,
      jobTitle: invite.jobTitle,
      role: invite.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  db.update(invitations).set({ status: "accepted", updatedAt: now }).where(eq(invitations.id, invite.id)).run();

  revalidatePath("/team");
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "Account created, but automatic sign-in failed. Please sign in manually." };
  }
  return {};
}