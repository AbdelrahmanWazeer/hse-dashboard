"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ppeItems, ppeTransactions, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PPE_CATEGORIES } from "@/lib/constants";
import { fromDateInputValue } from "@/lib/utils";

export type PpeItemFormState = { error?: string };
export type PpeTxnFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function num(formData: FormData, key: string, fallback = 0) {
  const v = Number(s(formData, key));
  return Number.isFinite(v) ? v : fallback;
}

function numOrNull(formData: FormData, key: string) {
  const v = s(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createPpeItem(_state: PpeItemFormState, formData: FormData) {
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();

  const name = s(formData, "name");
  const category = s(formData, "category");
  if (!name) return { error: "Item name is required." };
  if (!PPE_CATEGORIES.includes(category as never)) return { error: "Please choose a category." };

  const totalStock = Math.max(0, num(formData, "totalStock"));
  const now = Date.now();
  db.insert(ppeItems)
    .values({
      id: id("ppe"),
      tenantId: tenant.id,
      name,
      category,
      size: opt(formData, "size"),
      brand: opt(formData, "brand"),
      description: opt(formData, "description"),
      totalStock,
      safetyStock: Math.max(0, num(formData, "safetyStock")),
      issued: 0,
      available: totalStock,
      unit: opt(formData, "unit") ?? "pcs",
      storageLocation: opt(formData, "storageLocation"),
      pricePerUnit: numOrNull(formData, "pricePerUnit"),
      minReorderLevel: Math.max(0, num(formData, "minReorderLevel", 5)),
      photoUrl: opt(formData, "photoUrl"),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function updatePpeItem(_state: PpeItemFormState, formData: FormData) {
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();
  const itemId = String(formData.get("id") ?? "");
  const existing = db.select().from(ppeItems).where(eq(ppeItems.id, itemId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Item not found." };

  const name = s(formData, "name");
  const category = s(formData, "category");
  if (!name) return { error: "Item name is required." };
  if (!PPE_CATEGORIES.includes(category as never)) return { error: "Please choose a category." };

  // total_stock / issued / available are managed through transactions; here we keep them as-is.
  db.update(ppeItems)
    .set({
      name,
      category,
      size: opt(formData, "size"),
      brand: opt(formData, "brand"),
      description: opt(formData, "description"),
      safetyStock: Math.max(0, num(formData, "safetyStock")),
      unit: opt(formData, "unit") ?? "pcs",
      storageLocation: opt(formData, "storageLocation"),
      pricePerUnit: numOrNull(formData, "pricePerUnit"),
      minReorderLevel: Math.max(0, num(formData, "minReorderLevel", 5)),
      photoUrl: opt(formData, "photoUrl"),
      updatedAt: Date.now(),
    })
    .where(eq(ppeItems.id, itemId))
    .run();

  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function deletePpeItem(formData: FormData) {
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();
  const itemId = String(formData.get("id") ?? "");
  const existing = db.select().from(ppeItems).where(eq(ppeItems.id, itemId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(ppeItems).where(eq(ppeItems.id, itemId)).run();
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function createPpeTransaction(_state: PpeTxnFormState, formData: FormData) {
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();

  const itemId = s(formData, "ppeItemId");
  const type = s(formData, "type");
  const quantity = Math.max(0, num(formData, "quantity"));
  const date = fromDateInputValue(String(formData.get("date") ?? ""));

  if (!itemId) return { error: "Please choose an item." };
  if (!["receive", "issue", "return", "damage", "adjust"].includes(type)) return { error: "Please choose a transaction type." };
  if (type !== "adjust" && quantity <= 0) return { error: "Quantity must be greater than zero." };
  if (!date) return { error: "Date is required." };

  const item = db.select().from(ppeItems).where(eq(ppeItems.id, itemId)).get();
  if (!item || item.tenantId !== tenant.id) return { error: "Item not found." };

  let totalStock = item.totalStock;
  let issued = item.issued;
  let available = item.available;

  if (type === "receive") {
    totalStock += quantity;
    available += quantity;
  } else if (type === "issue") {
    if (quantity > available) return { error: `Only ${available} unit(s) available to issue.` };
    issued += quantity;
    available -= quantity;
  } else if (type === "return") {
    const back = Math.min(quantity, issued);
    issued -= back;
    available += back;
  } else if (type === "damage") {
    const removed = Math.min(quantity, available);
    totalStock = Math.max(0, totalStock - removed);
    available -= removed;
  } else if (type === "adjust") {
    available = quantity;
    totalStock = issued + quantity;
  }

  const now = Date.now();
  db.update(ppeItems)
    .set({ totalStock, issued, available, updatedAt: now })
    .where(eq(ppeItems.id, itemId))
    .run();
  db.insert(ppeTransactions)
    .values({
      id: id("ppet"),
      tenantId: tenant.id,
      ppeItemId: itemId,
      type,
      quantity,
      teamMemberId: opt(formData, "teamMemberId") || undefined,
      date,
      note: opt(formData, "note"),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/inventory");
  redirect("/inventory");
}