export type UserRole = "tenant" | "property_manager";

export interface UserDoc {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  createdAt: number;
  /** Set when this user is a team member — the uid of the PM admin who invited them */
  teamAdminId?: string;
  /** Properties this team member has been granted access to */
  teamPropertyIds?: string[];
  /** How many times the Grid Early Adopter welcome celebration has shown (max 3). */
  promoCelebrations?: number;
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

/** Direct-pay handles a PM can enable in the Payment Center. Tenants pay the
 * PM directly through these apps, then report it for PM confirmation —
 * unlike Square, money never moves through ResiGrid. Empty/missing = the
 * method is disabled and hidden from that PM's tenants. */
export interface PaymentMethodsConfig {
  /** PayPal.me username (paypal.me/<username>) */
  paypal?: string;
  /** Cash App $cashtag, without the $ */
  cashapp?: string;
  /** Venmo username, without the @ */
  venmo?: string;
  /** Chime $ChimeSign, without the $ */
  chime?: string;
  /** Zelle-enrolled email or U.S. phone number */
  zelle?: string;
}

export type ExternalPayMethod = keyof PaymentMethodsConfig;

/** Tenant-reported payment made outside ResiGrid (PayPal/Cash App/etc.) —
 * becomes a real `payments` record (receipt + RGE credit) only after the PM
 * confirms they received the money. */
export interface ExternalPaymentClaimDoc {
  id: string;
  tenantId: string;
  pmId: string;
  amount: number;
  method: ExternalPayMethod;
  leaseTermsId?: string;
  invoiceId?: string;
  note?: string;
  status: "pending" | "confirmed" | "declined";
  createdAt: number;
  resolvedAt?: number;
  paymentId?: string;
}

export interface PropertyManagerDoc {
  uid: string;
  businessName: string;
  payoutAccountRef?: string;
  propertyIds: string[];
  paymentMethods?: PaymentMethodsConfig;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PropertyDoc {
  id: string;
  ownerId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  geo?: GeoPoint;
  photos: string[];
  amenities: string[];
  unitIds: string[];
  createdAt: number;
}

export type UnitStatus = "vacant" | "occupied";

export interface UnitDoc {
  id: string;
  propertyId: string;
  unitNumber: string;
  beds: number;
  baths: number;
  rent: number;
  sqft?: number;
  photos?: string[];
  status: UnitStatus;
  currentTenantId?: string;
  currentLeaseId?: string;
}

export type ListingStatus = "draft" | "published" | "filled" | "archived";

export interface ListingDoc {
  id: string;
  unitId: string;
  propertyId: string;
  ownerId: string;
  title: string;
  description: string;
  rent: number;
  beds: number;
  baths: number;
  photos: string[];
  city: string;
  state: string;
  zip: string;
  geo?: GeoPoint;
  featured: boolean;
  status: ListingStatus;
  createdAt: number;
  availableFrom?: number;
  amenities?: string[];
  addressLine1?: string;
  /** Source tag for non-ResiGrid listings ("hud_lihtc" or "demo"). */
  source?: "hud_lihtc" | "demo";
  /** Application form attached by the PM — tenants can apply directly when set. */
  applicationFormId?: string;
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
  unitId?: string;
  pmId?: string;
  status: ApplicationStatus;
  reputationSnapshot?: ReputationScoreDoc;
  message?: string;
  submittedAt: number;
  invitedAt?: number;
  decidedAt?: number;
  decisionNote?: string;
  documentUrls?: string[];
  depositPaidAt?: number;
  leaseSignDeadline?: number;
  applicationFormId?: string;
  // Applicant-provided answers
  monthlyIncome?: number;
  employer?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  moveInDate?: number;
  references?: string;
  customAnswers?: Record<string, string>;
  // Application fee (charged at submission when the form requires one).
  // "paid"    = collected by card via Square at submission.
  // "pending" = applicant reported paying via an external app (feeMethod),
  //             awaiting the PM's confirmation of receipt.
  // "waived"  = no charge.
  feeAmount?: number;
  feePolicy?: ApplicationFeePolicy;
  feeStatus?: "paid" | "waived" | "pending";
  /** Which external app the applicant used, when the fee was reported not carded. */
  feeMethod?: ExternalPayMethod;
  /** Voucher/payment reference for a card-paid fee. */
  feePaymentRef?: string;
  /** When the PM confirmed receipt of an externally-reported fee. */
  feePaidAt?: number;
}

/** Tenant expresses interest in a listing or requests a visit */
export interface TenantInterestDoc {
  id: string;
  tenantId: string;
  listingId: string;
  pmId: string;
  type: "visit" | "interest";
  message?: string;
  preferredDate?: number;
  createdAt: number;
  status: "pending" | "acknowledged" | "scheduled" | "completed";
}

export type ApplicationFeePolicy = "waived" | "refundable" | "non_refundable";

/** PM-created reusable application template — attach to any unit's listing */
export interface ApplicationFormDoc {
  id: string;
  pmId: string;
  name: string;
  listingId?: string;
  requireIncomeVerification: boolean;
  requireBackgroundCheck: boolean;
  requireCreditCheck: boolean;
  requirePaystubs: boolean;
  requireBankStatements: boolean;
  requirePhotoID: boolean;
  requireUtilityStatement: boolean;
  requireReferences?: boolean;
  /** Minimum applicant monthly income ($) — 0/absent = no requirement. */
  requiredMonthlyIncome?: number;
  allowInstantApply: boolean;
  applicationFee?: number;
  /** How the fee is handled when applicationFee > 0 (default non_refundable). */
  feePolicy?: ApplicationFeePolicy;
  customQuestions: string[];
  createdAt: number;
}

export type LeaseSignStatus = "unsigned" | "tenant_signed" | "fully_signed";

export interface LeaseDoc {
  id: string;
  unitId: string;
  tenantId: string;
  pmId: string;
  documentUrl?: string;
  signedStatus: LeaseSignStatus;
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
  squarePaymentId: string;
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
  /** Sum of all My RGE task credits (insurance/paystub/review/referral) — see [[project_my_rge]]. */
  taskBonusPoints?: number;
  /** leaseTermsIds already credited for an insurance upload (1x per lease). */
  insuranceLeaseIds?: string[];
  /** ms timestamp of the last paystub credit — gates the 14-day cooldown. */
  lastPaystubAt?: number;
  /** ms timestamp of the last qualifying (3★+) PM review credit — gates the 30-day cooldown. */
  lastReviewCreditAt?: number;
  /** Calendar-quarter key (e.g. "2026-Q3") the referral counter below applies to. */
  referralQuarterKey?: string;
  referralsThisQuarter?: number;
  /** Referred tenant UIDs already credited — prevents re-crediting the same referral. */
  referredTenantIds?: string[];
}

export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

export interface MaintenanceRequestDoc {
  id: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  /** Property owner uid — set on creation so DM thread security rules can check it directly */
  pmId?: string;
  category: string;
  item: string;
  affectedRoom?: string;
  description: string;
  photoUrls: string[];
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  /** @deprecated — kept for backward compat; DM thread is the new channel */
  tenantNotes?: string;
  tenantNotesUpdatedAt?: number;
  /** @deprecated — kept for backward compat; DM thread is the new channel */
  pmNotes?: string;
  createdAt: number;
}

/** A single message in the per-request DM thread */
export interface MaintenanceMessageDoc {
  id: string;
  senderId: string;
  content: string;
  createdAt: number;
}

export interface MessageThreadDoc {
  id: string;
  participantIds: string[];
  propertyId?: string;
  leaseId?: string;
  lastMessageAt: number;
  lastMessageSnippet?: string;
}

export interface MessageDoc {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: number;
  readBy: string[];
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
  readBy?: string[];
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
  createdAt?: number;
  updatedAt: number;
  invitedVia?: string;
  squareCustomerId?: string;
  squareCardId?: string;
  /** Set when this PM claimed a platform promotion (e.g. "grid_early_adopter"). */
  promo?: string;
  promoGrantedAt?: number;
  /** Set when an admin revokes the promotion — PM portal access ends and all
   * property data is permanently deleted 30 days after this timestamp. */
  promoRevokedAt?: number;
}

export type UtilityResponsibility = "tenant" | "landlord" | "split" | "na";
export type LeaseTermType = "month-to-month" | "12-month" | "24-month" | "custom";
export type ParkingType = "none" | "included" | "paid";
export type LeaseStatus = "draft" | "sent" | "tenant_signed" | "fully_signed" | "expired";

export interface LeaseUtilities {
  gas: UtilityResponsibility;
  electric: UtilityResponsibility;
  water: UtilityResponsibility;
  trash: UtilityResponsibility;
  internet: UtilityResponsibility;
}

export interface LeasePets {
  allowed: boolean;
  maxCount: number;
  typesAllowed: string;
  deposit: number;
  monthlyRent: number;
}

export interface LeaseParking {
  type: ParkingType;
  spaces: number;
  monthlyFee: number;
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
  /** Set when this lease originated from an approved application. */
  applicationId?: string;

  termType: LeaseTermType;
  customMonths?: number;
  startDate: number;
  endDate?: number;

  rent: number;
  securityDeposit: number;
  moveInFee: number;
  lateFeeDays: number;
  lateFeeAmount: number;

  utilities: LeaseUtilities;
  pets: LeasePets;
  parking: LeaseParking;
  smokingAllowed: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  additionalTerms: string;

  status: LeaseStatus;
  templateId?: string;
  selectedClauses: string[];
  createdAt: number;
  sentAt?: number;
  viewedAt?: number;
  tenantSignedAt?: number;
  tenantSignatureName?: string;
  pmSignedAt?: number;
  signDeadline?: number;    // sentAt + 48 h
}

export interface PaymentReviewDoc {
  id: string;
  paymentId: string;
  tenantId: string;
  pmId: string;
  city?: string;
  state?: string;
  tenantReview?: "up" | "down";
  pmReview?: "up" | "down";
  tenantReviewedAt?: number;
  pmReviewedAt?: number;
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
  /** Set on "insurance" uploads only — used to enforce 1x-per-lease RGE credit. */
  leaseTermsId?: string;
  createdAt: number;
}

/** A tenant vouching for another platform tenant by ID — see [[project_my_rge]]. Written only by the `submitReferral` callable. */
export interface ReferralDoc {
  id: string;
  referrerId: string;
  referredTenantId: string;
  createdAt: number;
}

/** A property manager's star rating of a tenant — 3★+ credits RGE once per rolling 30 days. Immutable once created. */
export interface TenantReviewDoc {
  id: string;
  tenantId: string;
  pmId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: number;
}

/** National listing synced from RentCast — read-only, never owned by a PM in ResiGrid */
export interface NationalListingDoc {
  id: string;               // "rc_{rentcastId}"
  source: "rentcast";
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  beds: number;
  baths: number;
  sqft?: number | null;
  rent: number;
  propertyType: string;
  photos: string[];
  status: string;
  daysOnMarket?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  description?: string | null;
  listingUrl?: string | null;
  listedDate?: string | null;
  syncedAt: number;
}

/** Savable template — PM can reuse for future leases */
export interface LeaseTemplateDoc {
  id: string;
  pmId: string;
  name: string;             // "12-Month Standard", "Pet-Friendly M2M", etc.
  termType: LeaseTermType;
  customMonths?: number;
  securityDepositMultiplier: number; // multiplier of rent (e.g. 1.5 = 1.5× rent)
  moveInFee: number;
  lateFeeDays: number;
  lateFeeAmount: number;
  utilities: LeaseUtilities;
  pets: LeasePets;
  parking: LeaseParking;
  smokingAllowed: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  additionalTerms: string;
  createdAt: number;
}
