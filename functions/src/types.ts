// Mirrors the shape of src/lib/types/models.ts in the Next.js app.
// Duplicated here because functions/ is a separate TypeScript project/runtime.

export type UserRole = "tenant" | "property_manager";

export interface UserDoc {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  createdAt: number;
}

export interface LeaseDoc {
  id: string;
  unitId: string;
  tenantId: string;
  pmId: string;
  documentUrl?: string;
  signedStatus: "unsigned" | "tenant_signed" | "fully_signed";
  startDate: number;
  endDate: number;
  rentAmount: number;
  dueDay: number;
  createdAt: number;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface PaymentDoc {
  id: string;
  leaseId?: string;
  leaseTermsId?: string;
  invoiceId?: string;
  tenantId: string;
  pmId?: string;
  amount: number;
  method: "card" | "voucher" | "external";
  /** For method "external": which app the tenant paid through (paypal, cashapp…). */
  externalMethod?: string;
  status: PaymentStatus;
  dueDate?: number;
  paidDate?: number;
  onTime?: boolean;
  voucherId?: string;
}

/** Tenant-reported payment made outside ResiGrid (PayPal/Cash App/etc.) —
 * becomes a real `payments` record only after the PM confirms receipt. */
export interface ExternalPaymentClaimDoc {
  id: string;
  tenantId: string;
  pmId: string;
  amount: number;
  method: string;
  leaseTermsId?: string;
  invoiceId?: string;
  note?: string;
  status: "pending" | "confirmed" | "declined";
  createdAt: number;
  resolvedAt?: number;
  paymentId?: string;
}

export type VoucherStatus =
  | "pending"
  | "claimed"
  | "paid_out"
  | "expired"
  | "refunded";

export interface VoucherDoc {
  id: string;
  senderId: string;
  recipientContact: string;
  recipientUserId?: string;
  amount: number;
  /** Square payment ID — only set once money has actually moved (paid_out). */
  squarePaymentId?: string;
  /** Card-on-file reference under ResiGrid's platform Square account, used
   * to charge the card at claim time when the recipient wasn't connected yet. */
  squareCustomerId?: string;
  squareCardId?: string;
  status: VoucherStatus;
  claimToken: string;
  createdAt: number;
  expiresAt: number;
  leaseId?: string;
  leaseTermsId?: string;
  invoiceId?: string;
}

export type RentInvoiceStatus = "pending" | "paid" | "overdue";

/** Automated rent invoice — one per 30-day cycle from the lease's startDate. */
export interface RentInvoiceDoc {
  id: string;
  leaseTermsId: string;
  tenantId: string;
  pmId: string;
  propertyId: string;
  unitId: string;
  amount: number;
  cycleNumber: number;
  periodStart: number;
  dueDate: number;
  status: RentInvoiceStatus;
  createdAt: number;
  paidAt?: number;
  paymentId?: string;
}

export interface BadgeDoc {
  id: string;
  label: string;
  description: string;
  earnedAt: number;
}

export interface ReputationScoreDoc {
  tenantId: string;
  onTimeCount: number;
  lateCount: number;
  totalCount: number;
  currentStreak: number;
  badges: BadgeDoc[];
  score: number;
  taskBonusPoints?: number;
  insuranceLeaseIds?: string[];
  lastPaystubAt?: number;
  lastReviewCreditAt?: number;
  referralQuarterKey?: string;
  referralsThisQuarter?: number;
  referredTenantIds?: string[];
}

export interface ReferralDoc {
  id: string;
  referrerId: string;
  referredTenantId: string;
  createdAt: number;
}

export interface TenantReviewDoc {
  id: string;
  tenantId: string;
  pmId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: number;
}

export interface SharedDocumentDoc {
  id: string;
  uploaderId: string;
  uploaderRole: "tenant" | "property_manager";
  tenantId: string;
  pmId: string;
  unitId?: string;
  propertyId?: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  category: "lease" | "application" | "maintenance" | "other" | "insurance" | "paystub";
  leaseTermsId?: string;
  createdAt: number;
}

export interface MaintenanceRequestDoc {
  id: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  category: string;
  item: string;
  description: string;
  photoUrls: string[];
  status: "submitted" | "acknowledged" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  pmNotes?: string;
  createdAt: number;
}

export interface PropertyDoc {
  id: string;
  ownerId: string;
  name?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface UnitDoc {
  id: string;
  propertyId: string;
  unitNumber: string;
  currentTenantId?: string;
}

export type ApplicationStatus =
  | "shortlisted"
  | "invited"
  | "submitted"
  | "under_review"
  | "more_info_needed"
  | "approved"
  | "denied"
  | "withdrawn";

export interface ApplicationDoc {
  id: string;
  tenantId: string;
  listingId: string;
  pmId?: string;
  unitId?: string;
  status: ApplicationStatus;
  message?: string;
  submittedAt: number;
  decisionNote?: string;
}

export interface ListingDoc {
  id: string;
  ownerId: string;
  unitId: string;
  propertyId: string;
  title: string;
  addressLine1?: string;
  city: string;
  state: string;
  zip: string;
}

export type NoticeScope = "all" | "property" | "unit";

export interface NoticeDoc {
  id: string;
  pmId: string;
  scope: NoticeScope;
  scopeId?: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface LeaseTermsDoc {
  id: string;
  pmId: string;
  pmDisplayName?: string;
  unitId: string;
  propertyId: string;
  tenantId?: string;
  tenantName: string;
  tenantEmail: string;
  rent: number;
  startDate: number;
  endDate?: number;
  status: "draft" | "sent" | "tenant_signed" | "fully_signed" | "expired";
  createdAt: number;
  sentAt?: number;
  tenantSignedAt?: number;
}

export interface SquareConnectionDoc {
  uid: string;
  merchantId: string;
  accessToken: string;
  refreshToken?: string;
  locationId: string;
  expiresAt?: string;
  connectedAt: number;
}

export type PMTier = "starter" | "growth" | "mega";

export interface PMEntitlement {
  propertyId: string;
  address: string;
  paidUnits: number;
  squarePaymentId: string;
  amountPaid: number;
  paidAt: number;
}

export interface PMSubscriptionDoc {
  uid: string;
  active: boolean;
  tier?: PMTier;
  tierExpiresAt?: number;
  entitlements: PMEntitlement[];
  totalPaid: number;
  updatedAt: number;
  invitedVia?: string;
  /** Square Customer ID for recurring billing (saved at first checkout). */
  squareCustomerId?: string;
  /** Square Card ID (card on file) for recurring billing. */
  squareCardId?: string;
  /** Set when this PM claimed a platform promotion (e.g. "grid_early_adopter"). */
  promo?: string;
  promoGrantedAt?: number;
  /** Set when an admin revokes the promotion — PM portal access ends and all
   * property data is permanently deleted 30 days after this timestamp. */
  promoRevokedAt?: number;
  /** Set once the 30-day post-revocation purge has run, to avoid re-processing. */
  promoEnforcedAt?: number;
}

export type TeamInviteStatus = "pending" | "accepted" | "revoked";

export interface PMTeamInviteDoc {
  id: string;
  adminId: string;
  adminName: string;
  email: string;
  propertyIds: string[];
  status: TeamInviteStatus;
  createdAt: number;
  acceptedAt?: number;
  memberId?: string;
}
