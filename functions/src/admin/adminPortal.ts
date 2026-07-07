import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import type {
  LeaseTermsDoc,
  MaintenanceRequestDoc,
  PaymentDoc,
  PMSubscriptionDoc,
  PropertyDoc,
  ReputationScoreDoc,
  UnitDoc,
  UserDoc,
  VoucherDoc,
} from "../types";

// ── Access control ────────────────────────────────────────────────────────────
// Two independent gates, both enforced server-side (the client PIN prompt is
// just UX — nothing here trusts the client):
//   1. The caller's Google account email must be on this allowlist.
//   2. The request must carry the correct portal PIN.
// The obscure URL is intentionally NOT part of the security model — routes in
// a static-export bundle are always discoverable.
const ADMIN_EMAILS = new Set(["dwilson@illyrobotic-ai.com"]);
const ADMIN_PIN = "4931";

function assertAdmin(request: CallableRequest<{ pin?: string }>): void {
  const email = request.auth?.token?.email;
  const emailVerified = request.auth?.token?.email_verified;
  if (!email || !emailVerified || !ADMIN_EMAILS.has(email)) {
    logger.warn("adminPortal: rejected caller", { email: email ?? "unauthenticated" });
    throw new HttpsError("permission-denied", "Not authorized.");
  }
  if (request.data?.pin !== ADMIN_PIN) {
    logger.warn("adminPortal: wrong PIN from allowed account", { email });
    throw new HttpsError("permission-denied", "Incorrect PIN.");
  }
}

// ── Overview payload types (mirrored in the admin page) ──────────────────────
interface AdminUserSummary {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: string;
  createdAt: number;
  propertyCount?: number;
  unitCount?: number;
  activeLeaseCount?: number;
  rgeScore?: number;
  subscriptionActive?: boolean;
  subscriptionTier?: string;
  totalPaidToPlatform?: number;
}

interface AdminRecentPayment {
  id: string;
  amount: number;
  status: string;
  onTime?: boolean;
  paidDate?: number;
  tenantName: string;
  pmName: string;
}

export const adminGetOverview = onCall<{ pin: string }>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    assertAdmin(request);

    const [
      usersSnap,
      propertiesSnap,
      unitsSnap,
      listingsSnap,
      leasesSnap,
      paymentsSnap,
      vouchersSnap,
      maintenanceSnap,
      subsSnap,
      scoresSnap,
    ] = await Promise.all([
      db.collection("users").get(),
      db.collection("properties").get(),
      db.collection("units").get(),
      db.collection("listings").get(),
      db.collection("leaseTerms").get(),
      db.collection("payments").get(),
      db.collection("vouchers").get(),
      db.collection("maintenanceRequests").get(),
      db.collection("pmSubscriptions").get(),
      db.collection("reputationScores").get(),
    ]);

    // The admin account itself shouldn't count as a tenant/PM in metrics.
    const users = usersSnap.docs
      .map((d) => ({ ...(d.data() as UserDoc), uid: d.id }))
      .filter((u) => !ADMIN_EMAILS.has(u.email));
    const properties = propertiesSnap.docs.map((d) => d.data() as PropertyDoc);
    const units = unitsSnap.docs.map((d) => d.data() as UnitDoc);
    const leases = leasesSnap.docs.map((d) => d.data() as LeaseTermsDoc);
    const payments = paymentsSnap.docs.map((d) => ({ ...(d.data() as PaymentDoc), id: d.id }));
    const vouchers = vouchersSnap.docs.map((d) => d.data() as VoucherDoc);
    const maintenance = maintenanceSnap.docs.map((d) => d.data() as MaintenanceRequestDoc);
    const subs = new Map(subsSnap.docs.map((d) => [d.id, d.data() as PMSubscriptionDoc]));
    const scores = new Map(scoresSnap.docs.map((d) => [d.id, d.data() as ReputationScoreDoc]));

    const propertyCountByOwner = new Map<string, number>();
    for (const p of properties) {
      propertyCountByOwner.set(p.ownerId, (propertyCountByOwner.get(p.ownerId) ?? 0) + 1);
    }
    const ownerByPropertyId = new Map(propertiesSnap.docs.map((d) => [d.id, (d.data() as PropertyDoc).ownerId]));
    const unitCountByOwner = new Map<string, number>();
    for (const u of units) {
      const owner = ownerByPropertyId.get(u.propertyId);
      if (owner) unitCountByOwner.set(owner, (unitCountByOwner.get(owner) ?? 0) + 1);
    }
    const activeLeasesByTenant = new Map<string, number>();
    for (const l of leases) {
      if (l.status === "fully_signed" && l.tenantId) {
        activeLeasesByTenant.set(l.tenantId, (activeLeasesByTenant.get(l.tenantId) ?? 0) + 1);
      }
    }
    const nameByUid = new Map(users.map((u) => [u.uid, u.displayName || u.email]));

    const tenants: AdminUserSummary[] = [];
    const propertyManagers: AdminUserSummary[] = [];
    for (const u of users) {
      const base: AdminUserSummary = {
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
        role: u.role,
        createdAt: u.createdAt,
      };
      if (u.role === "property_manager") {
        const sub = subs.get(u.uid);
        propertyManagers.push({
          ...base,
          propertyCount: propertyCountByOwner.get(u.uid) ?? 0,
          unitCount: unitCountByOwner.get(u.uid) ?? 0,
          subscriptionActive: sub?.active ?? false,
          subscriptionTier: sub?.tier,
          totalPaidToPlatform: sub?.totalPaid ?? 0,
        });
      } else {
        tenants.push({
          ...base,
          activeLeaseCount: activeLeasesByTenant.get(u.uid) ?? 0,
          rgeScore: scores.get(u.uid)?.score,
        });
      }
    }

    const completedPayments = payments.filter((p) => p.status === "completed");
    const recentPayments: AdminRecentPayment[] = [...completedPayments]
      .sort((a, b) => (b.paidDate ?? 0) - (a.paidDate ?? 0))
      .slice(0, 15)
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        onTime: p.onTime,
        paidDate: p.paidDate,
        tenantName: nameByUid.get(p.tenantId) ?? p.tenantId,
        pmName: (p.pmId && nameByUid.get(p.pmId)) || p.pmId || "—",
      }));

    const OPEN_MAINTENANCE = new Set(["submitted", "acknowledged", "in_progress"]);

    return {
      metrics: {
        tenantCount: tenants.length,
        pmCount: propertyManagers.length,
        propertyCount: properties.length,
        unitCount: units.length,
        occupiedUnitCount: units.filter((u) => u.currentTenantId).length,
        publishedListingCount: listingsSnap.docs.filter((d) => d.data().status === "published").length,
        activeLeaseCount: leases.filter((l) => l.status === "fully_signed").length,
        pendingLeaseCount: leases.filter((l) => l.status === "sent" || l.status === "tenant_signed").length,
        completedPaymentCount: completedPayments.length,
        rentVolume: completedPayments.reduce((s, p) => s + (p.amount ?? 0), 0),
        platformRevenue: [...subs.values()].reduce((s, sub) => s + (sub.totalPaid ?? 0), 0),
        activeSubscriptionCount: [...subs.values()].filter((s) => s.active).length,
        pendingVoucherCount: vouchers.filter((v) => v.status === "pending").length,
        openMaintenanceCount: maintenance.filter((m) => OPEN_MAINTENANCE.has(m.status)).length,
      },
      tenants: tenants.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
      propertyManagers: propertyManagers.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
      recentPayments,
    };
  },
);

export const adminSetUserRole = onCall<{ pin: string; uid: string; role: string }>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    assertAdmin(request);

    const { uid, role } = request.data;
    if (!uid || (role !== "tenant" && role !== "property_manager")) {
      throw new HttpsError("invalid-argument", "Provide a uid and a role of tenant or property_manager.");
    }
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "No user with that ID.");

    await ref.update({ role });
    logger.info("adminSetUserRole: role changed", {
      by: request.auth?.token?.email,
      uid,
      role,
    });
    return { ok: true };
  },
);
