import {
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  collection,
} from "firebase/firestore";
import { db } from "./config";
import type {
  ApplicationDoc,
  ApplicationFormDoc,
  ExternalPaymentClaimDoc,
  LeaseDoc,
  LeaseTemplateDoc,
  LeaseTermsDoc,
  ListingDoc,
  MaintenanceMessageDoc,
  MaintenanceRequestDoc,
  MessageDoc,
  MessageThreadDoc,
  NationalListingDoc,
  NoticeDoc,
  PaymentDoc,
  PaymentReviewDoc,
  PMTeamInviteDoc,
  PropertyDoc,
  PropertyManagerDoc,
  RentInvoiceDoc,
  ReputationScoreDoc,
  SharedDocumentDoc,
  TenantInterestDoc,
  UnitDoc,
  UserDoc,
  VoucherDoc,
} from "@/lib/types/models";

function converter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: T) => data,
    fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
  };
}

function typedCollection<T extends DocumentData>(
  path: string,
): CollectionReference<T> {
  return collection(db, path).withConverter(converter<T>());
}

export const usersCol = () => typedCollection<UserDoc>("users");
export const propertyManagersCol = () =>
  typedCollection<PropertyManagerDoc>("propertyManagers");
export const propertiesCol = () => typedCollection<PropertyDoc>("properties");
export const unitsCol = () => typedCollection<UnitDoc>("units");
export const listingsCol = () => typedCollection<ListingDoc>("listings");
export const applicationsCol = () =>
  typedCollection<ApplicationDoc>("applications");
export const leasesCol = () => typedCollection<LeaseDoc>("leases");
export const paymentsCol = () => typedCollection<PaymentDoc>("payments");
export const vouchersCol = () => typedCollection<VoucherDoc>("vouchers");
export const reputationScoresCol = () =>
  typedCollection<ReputationScoreDoc>("reputationScores");
export const maintenanceRequestsCol = () =>
  typedCollection<MaintenanceRequestDoc>("maintenanceRequests");
export const maintenanceMessagesCol = (requestId: string) =>
  typedCollection<MaintenanceMessageDoc>(`maintenanceRequests/${requestId}/messages`);
export const messageThreadsCol = () =>
  typedCollection<MessageThreadDoc>("messageThreads");
export const threadMessagesCol = (threadId: string) =>
  typedCollection<MessageDoc>(`messageThreads/${threadId}/messages`);
export const noticesCol = () => typedCollection<NoticeDoc>("notices");
export const leaseTermsCol = () => typedCollection<LeaseTermsDoc>("leaseTerms");
export const leaseTemplatesCol = () =>
  typedCollection<LeaseTemplateDoc>("leaseTemplates");
export const tenantInterestsCol = () =>
  typedCollection<TenantInterestDoc>("tenantInterests");
export const applicationFormsCol = () =>
  typedCollection<ApplicationFormDoc>("applicationForms");
export const sharedDocumentsCol = () =>
  typedCollection<SharedDocumentDoc>("sharedDocuments");
export const paymentReviewsCol = () =>
  typedCollection<PaymentReviewDoc>("paymentReviews");
export const nationalListingsCol = () =>
  typedCollection<NationalListingDoc>("nationalListings");
export const pmTeamInvitesCol = () =>
  typedCollection<PMTeamInviteDoc>("pmTeamInvites");
export const rentInvoicesCol = () =>
  typedCollection<RentInvoiceDoc>("rentInvoices");
export const externalPaymentClaimsCol = () =>
  typedCollection<ExternalPaymentClaimDoc>("externalPaymentClaims");
