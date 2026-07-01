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

export interface PropertyManagerDoc {
  uid: string;
  businessName: string;
  payoutAccountRef?: string;
  propertyIds: string[];
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
}

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "denied"
  | "withdrawn";

export interface ApplicationDoc {
  id: string;
  tenantId: string;
  listingId: string;
  status: ApplicationStatus;
  reputationSnapshot?: ReputationScoreDoc;
  message?: string;
  submittedAt: number;
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
  tenantId: string;
  amount: number;
  method: "card" | "voucher";
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
  category: string;
  item: string;
  description: string;
  photoUrls: string[];
  status: MaintenanceStatus;
  priority: MaintenancePriority;
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
}

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
  entitlements: PMEntitlement[];
  totalPaid: number;
  updatedAt: number;
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
  unitId: string;
  propertyId: string;
  tenantId?: string;        // set when PM assigns to a specific applicant
  tenantName: string;
  tenantEmail: string;

  // Term
  termType: LeaseTermType;
  customMonths?: number;
  startDate: number;        // timestamp
  endDate?: number;         // computed; null for month-to-month

  // Financials
  rent: number;
  securityDeposit: number;
  moveInFee: number;
  lateFeeDays: number;      // grace period in days
  lateFeeAmount: number;

  // Details
  utilities: LeaseUtilities;
  pets: LeasePets;
  parking: LeaseParking;
  smokingAllowed: boolean;
  quietHoursStart: string;  // e.g. "22:00"
  quietHoursEnd: string;    // e.g. "08:00"
  additionalTerms: string;

  status: LeaseStatus;
  templateId?: string;      // if created from a saved template
  selectedClauses: string[]; // IDs of selected legal clause blocks
  createdAt: number;
  sentAt?: number;
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
