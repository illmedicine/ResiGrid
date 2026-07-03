"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ApplicationDoc, ApplicationFormDoc } from "@/lib/types/models";

const STATUS_TONE: Record<
  ApplicationDoc["status"],
  "neutral" | "navy" | "success" | "danger" | "orange" | "warning"
> = {
  shortlisted: "orange",
  invited: "navy",
  submitted: "neutral",
  under_review: "navy",
  more_info_needed: "orange",
  approved: "success",
  denied: "danger",
  withdrawn: "neutral",
};

const STATUS_LABEL: Record<ApplicationDoc["status"], string> = {
  shortlisted: "Shortlisted",
  invited: "Invited to Apply",
  submitted: "Submitted — Awaiting Review",
  under_review: "Under Review",
  more_info_needed: "Additional Information Requested",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
};

interface ListingInfo {
  title: string;
  city: string;
  state: string;
  zip?: string;
  rent: number;
  addressLine1?: string;
  beds?: number;
  baths?: number;
}

interface ApplicationPreviewDocProps {
  application: ApplicationDoc;
  tenantName: string;
  tenantEmail?: string;
  listing?: ListingInfo | null;
  formDoc?: ApplicationFormDoc | null;
}

function formatDate(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function currency(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function ApplicationPreviewDoc({
  application,
  tenantName,
  tenantEmail,
  listing,
  formDoc,
}: ApplicationPreviewDocProps) {
  const screeningRequired = formDoc
    ? [
        formDoc.requireIncomeVerification && "Income Verification",
        formDoc.requireBackgroundCheck && "Background Check",
        formDoc.requireCreditCheck && "Credit Check",
        formDoc.requirePaystubs && "Paystubs",
        formDoc.requireBankStatements && "Bank Statements",
        formDoc.requirePhotoID && "Government-Issued Photo ID",
        formDoc.requireUtilityStatement && "Utility Statement",
      ].filter(Boolean) as string[]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <style>{`
        @media print {
          body > *:not(#printable-application) { display: none !important; }
          #printable-application { width: 100%; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-navy-900">Rental Application</h2>
          <Badge tone={STATUS_TONE[application.status]}>
            {STATUS_LABEL[application.status]}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
      </div>

      <div
        id="printable-application"
        className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-navy-900 print:border-0 print:p-0"
      >
        {/* Header */}
        <div className="mb-8 text-center border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-bold tracking-tight">RENTAL APPLICATION</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Submitted through the ResiGrid Platform · Powered by Illy Robotic Instruments
          </p>
        </div>

        {/* Property */}
        <DocSection title="Property">
          {listing ? (
            <>
              <Row label="Listing" value={listing.title} />
              {listing.addressLine1 && (
                <Row label="Address" value={listing.addressLine1} />
              )}
              <Row
                label="Location"
                value={`${listing.city}, ${listing.state}${listing.zip ? " " + listing.zip : ""}`}
              />
              {listing.beds !== undefined && listing.baths !== undefined && (
                <Row
                  label="Unit size"
                  value={`${listing.beds === 0 ? "Studio" : `${listing.beds} bed`} · ${listing.baths} bath`}
                />
              )}
              <Row label="Monthly rent" value={currency(listing.rent)} />
            </>
          ) : (
            <Row label="Listing ID" value={application.listingId} />
          )}
          {application.unitId && (
            <Row label="Unit ID" value={application.unitId} />
          )}
        </DocSection>

        {/* Applicant */}
        <DocSection title="Applicant">
          <Row label="Full name" value={tenantName} />
          {tenantEmail && <Row label="Email" value={tenantEmail} />}
          <Row label="Application date" value={formatDate(application.submittedAt)} />
          {application.moveInDate && (
            <Row label="Desired move-in" value={formatDate(application.moveInDate)} />
          )}
        </DocSection>

        {/* Financial */}
        {(application.monthlyIncome || application.employer) && (
          <DocSection title="Financial Information">
            {application.monthlyIncome && (
              <Row
                label="Monthly income"
                value={`${currency(application.monthlyIncome)}/mo`}
              />
            )}
            {application.employer && (
              <Row label="Employer / income source" value={application.employer} />
            )}
          </DocSection>
        )}

        {/* Emergency contact */}
        {(application.emergencyContactName || application.emergencyContactPhone) && (
          <DocSection title="Emergency Contact">
            {application.emergencyContactName && (
              <Row label="Name" value={application.emergencyContactName} />
            )}
            {application.emergencyContactPhone && (
              <Row label="Phone" value={application.emergencyContactPhone} />
            )}
          </DocSection>
        )}

        {/* Cover letter */}
        {application.message && (
          <DocSection title="Cover Letter / Message">
            <p className="leading-relaxed text-neutral-600 whitespace-pre-wrap">
              {application.message}
            </p>
          </DocSection>
        )}

        {/* Custom Q&A */}
        {application.customAnswers && Object.keys(application.customAnswers).length > 0 && (
          <DocSection title="Additional Questions">
            <div className="flex flex-col gap-3">
              {Object.entries(application.customAnswers).map(([question, answer]) => (
                <div key={question}>
                  <p className="font-medium text-navy-900 mb-0.5">{question}</p>
                  <p className="text-neutral-600 pl-3 border-l-2 border-neutral-200">
                    {answer || <span className="italic text-neutral-400">No answer provided</span>}
                  </p>
                </div>
              ))}
            </div>
          </DocSection>
        )}

        {/* Screening requirements */}
        {screeningRequired.length > 0 && (
          <DocSection title="Screening Requirements">
            <p className="text-xs text-neutral-500 mb-2">
              The property manager has requested the following verifications:
            </p>
            <ul className="flex flex-col gap-1">
              {screeningRequired.map((req) => (
                <li key={req} className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-navy-900 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </DocSection>
        )}

        {/* Supporting documents */}
        {application.documentUrls && application.documentUrls.length > 0 && (
          <DocSection title="Supporting Documents">
            <ul className="flex flex-col gap-2">
              {application.documentUrls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline text-sm"
                  >
                    Document {i + 1} ↗
                  </a>
                </li>
              ))}
            </ul>
          </DocSection>
        )}

        {/* Application fee */}
        {formDoc?.applicationFee && formDoc.applicationFee > 0 && (
          <DocSection title="Application Fee">
            <Row label="Fee amount" value={currency(formDoc.applicationFee)} />
          </DocSection>
        )}

        {/* Status & Decision */}
        <DocSection title="Application Status">
          <Row label="Current status" value={STATUS_LABEL[application.status]} />
          <Row label="Submitted" value={formatDateTime(application.submittedAt)} />
          {application.invitedAt && (
            <Row label="Invited" value={formatDateTime(application.invitedAt)} />
          )}
          {application.decidedAt && (
            <Row label="Decision date" value={formatDateTime(application.decidedAt)} />
          )}
          {application.decisionNote && (
            <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
              <p className="text-xs font-semibold text-orange-800 mb-0.5">
                Note from property manager:
              </p>
              <p className="text-xs text-orange-700">{application.decisionNote}</p>
            </div>
          )}
        </DocSection>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-neutral-400 border-t border-neutral-100 pt-6">
          Application ID: {application.id} · Generated by ResiGrid on{" "}
          {new Date().toLocaleDateString()} · All information provided by the applicant
        </p>
      </div>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-navy-900">
        {title}
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-44 shrink-0 text-neutral-500">{label}</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}
