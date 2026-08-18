"use server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { auth } from "@/auth";

export async function logAudit(
  action: "CREATE" | "UPDATE" | "DELETE" | "ACCESS" | "IMPERSONATE",
  entityType: string,
  entityId: string | number | null,
  details?: Record<string, any>
) {
  try {
    const session = await auth();
    await db.insert(auditLogs).values({
      userId: session?.user?.id || "system",
      userName: session?.user?.name || session?.user?.email || "Sistema",
      action,
      entityType,
      entityId: entityId?.toString() || null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (e) {
    console.error("Audit log failed:", e);
    // Never block the main operation due to audit failure
  }
}
