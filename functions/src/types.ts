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
  tenantId: string;
  pmId?: string;
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
  createdAt: number;
}

export interface PropertyDoc {
  id: string;
  ownerId: string;
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
  /** voucherId that activated this PM for free via the payment invite flow. */
  invitedVia?: string;
}
