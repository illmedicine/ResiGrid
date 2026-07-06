export type TenantMood = "happy" | "neutral" | "sad" | "angry";

export interface TenantMoodInput {
  leaseStartDate: number;
  lateFeeDays: number;
  tenantSignedAt?: number;
  pmSignedAt?: number;
  /** Most recent *completed* payment date, if any. */
  lastCompletedPaymentAt?: number;
  hasUrgentOpenMaintenance: boolean;
  /** Due date of the tenant's current rent invoice, when one exists —
   * preferred over the day-of-month heuristic below. */
  currentInvoiceDueDate?: number;
  /** Status of the tenant's current rent invoice, when one exists. */
  currentInvoiceStatus?: "pending" | "paid" | "overdue";
  /** Injectable for testing; defaults to Date.now(). */
  now?: number;
}

export interface TenantMoodResult {
  mood: TenantMood;
  emoji: string;
  label: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENTLY_SIGNED_WINDOW_DAYS = 7;

/**
 * There's no due-date/billing-cycle field anywhere in the app (rent is paid
 * on-demand) — this derives the nearest recurring due date from the
 * day-of-month the lease started on, since that's the closest thing to a
 * billing cycle that already exists in the data.
 */
function mostRecentDueDate(leaseStartDate: number, now: number): number {
  const dueDay = new Date(leaseStartDate).getDate();
  const candidate = new Date(now);
  candidate.setHours(0, 0, 0, 0);
  candidate.setDate(dueDay);
  if (candidate.getTime() > now) {
    candidate.setMonth(candidate.getMonth() - 1);
  }
  return Math.max(candidate.getTime(), leaseStartDate);
}

export function computeTenantMood(input: TenantMoodInput): TenantMoodResult {
  const now = input.now ?? Date.now();

  if (input.hasUrgentOpenMaintenance) {
    return { mood: "angry", emoji: "😠", label: "Urgent maintenance open" };
  }

  const usingRealInvoice = input.currentInvoiceDueDate != null;
  const dueDate = usingRealInvoice
    ? input.currentInvoiceDueDate!
    : mostRecentDueDate(input.leaseStartDate, now);
  const isCurrentCyclePaid = usingRealInvoice
    ? input.currentInvoiceStatus === "paid"
    : input.lastCompletedPaymentAt != null && input.lastCompletedPaymentAt >= dueDate;
  const isOverdue = usingRealInvoice
    ? input.currentInvoiceStatus === "overdue"
    : !isCurrentCyclePaid && now > dueDate + input.lateFeeDays * MS_PER_DAY;

  if (isOverdue) {
    return { mood: "sad", emoji: "😟", label: "Rent overdue" };
  }

  const signedAt = Math.max(input.tenantSignedAt ?? 0, input.pmSignedAt ?? 0) || undefined;
  const recentlySigned =
    signedAt != null && now - signedAt <= RECENTLY_SIGNED_WINDOW_DAYS * MS_PER_DAY;

  if (recentlySigned) {
    return { mood: "happy", emoji: "😄", label: "Lease just signed" };
  }
  if (isCurrentCyclePaid) {
    return { mood: "happy", emoji: "😄", label: "Rent paid up" };
  }

  return { mood: "neutral", emoji: "😐", label: "All quiet" };
}
