"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { termLabel } from "@/lib/lease/templates";
import { getClauseById } from "@/lib/lease/legalClauses";
import type { LeaseTermsDoc, UtilityResponsibility } from "@/lib/types/models";

const UTIL_LABEL: Record<UtilityResponsibility, string> = {
  tenant: "Tenant",
  landlord: "Landlord",
  split: "Split equally",
  na: "N/A",
};

const STATUS_TONE = {
  draft: "neutral",
  sent: "navy",
  tenant_signed: "warning",
  fully_signed: "success",
  expired: "danger",
} as const;

function currency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface LeasePreviewDocProps {
  lease: LeaseTermsDoc;
  pmDisplayName?: string;
}

export function LeasePreviewDoc({ lease, pmDisplayName }: LeasePreviewDocProps) {
  const resolvedPmName = lease.pmDisplayName ?? pmDisplayName ?? "Property Manager";

  return (
    <div className="flex flex-col gap-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        @media print {
          body > *:not(#printable-lease) { display: none !important; }
          #printable-lease { width: 100%; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-navy-900">Lease Agreement</h2>
          <Badge tone={STATUS_TONE[lease.status] as "neutral"}>
            {lease.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
      </div>

      <div
        id="printable-lease"
        className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-navy-900 print:border-0 print:p-0"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">RESIDENTIAL LEASE AGREEMENT</h1>
          <p className="mt-1 text-xs text-neutral-600">
            Managed on the ResiGrid Platform · Powered by Illy Robotic Instruments
          </p>
        </div>

        <DocSection title="Parties & Property">
          <Row label="Tenant" value={lease.tenantName} />
          <Row label="Tenant email" value={lease.tenantEmail} />
          <Row label="Unit" value={lease.unitId} />
          <Row label="Property" value={lease.propertyId} />
        </DocSection>

        <DocSection title="Term">
          <Row label="Lease type" value={termLabel(lease.termType, lease.customMonths)} />
          <Row label="Start date" value={formatDate(lease.startDate)} />
          <Row label="End date" value={lease.endDate ? formatDate(lease.endDate) : "Ongoing (month-to-month)"} />
        </DocSection>

        <DocSection title="Financials">
          <Row label="Monthly rent" value={currency(lease.rent)} />
          <Row label="Security deposit" value={currency(lease.securityDeposit)} />
          <Row label="Move-in fee" value={lease.moveInFee > 0 ? currency(lease.moveInFee) : "None"} />
          <Row label="Late fee grace period" value={`${lease.lateFeeDays} day${lease.lateFeeDays !== 1 ? "s" : ""}`} />
          <Row label="Late fee" value={lease.lateFeeAmount > 0 ? currency(lease.lateFeeAmount) : "None"} />
        </DocSection>

        <DocSection title="Utilities">
          <Row label="Gas" value={UTIL_LABEL[lease.utilities.gas]} />
          <Row label="Electric / Lights" value={UTIL_LABEL[lease.utilities.electric]} />
          <Row label="Water & Sewer" value={UTIL_LABEL[lease.utilities.water]} />
          <Row label="Trash & Recycling" value={UTIL_LABEL[lease.utilities.trash]} />
          <Row label="Internet" value={UTIL_LABEL[lease.utilities.internet]} />
        </DocSection>

        <DocSection title="Pets">
          {lease.pets.allowed ? (
            <>
              <Row label="Pets" value="Allowed" />
              <Row label="Maximum pets" value={String(lease.pets.maxCount)} />
              <Row label="Types allowed" value={lease.pets.typesAllowed || "Any"} />
              <Row label="Pet deposit" value={currency(lease.pets.deposit)} />
              <Row label="Monthly pet rent" value={lease.pets.monthlyRent > 0 ? currency(lease.pets.monthlyRent) : "None"} />
            </>
          ) : (
            <Row label="Pets" value="Not permitted" />
          )}
        </DocSection>

        <DocSection title="Parking">
          {lease.parking.type === "none" ? (
            <Row label="Parking" value="Not included or available" />
          ) : (
            <>
              <Row label="Parking" value={lease.parking.type === "included" ? "Included in rent" : "Available for fee"} />
              <Row label="Spaces" value={String(lease.parking.spaces)} />
              {lease.parking.type === "paid" && (
                <Row label="Monthly parking fee" value={currency(lease.parking.monthlyFee)} />
              )}
            </>
          )}
        </DocSection>

        <DocSection title="Rules">
          <Row label="Smoking" value={lease.smokingAllowed ? "Permitted" : "Not permitted on premises"} />
          <Row label="Quiet hours" value={`${lease.quietHoursStart} – ${lease.quietHoursEnd}`} />
        </DocSection>

        {lease.additionalTerms && (
          <DocSection title="Additional Terms & Conditions">
            <p className="whitespace-pre-wrap leading-relaxed text-neutral-600">
              {lease.additionalTerms}
            </p>
          </DocSection>
        )}

        {(lease.selectedClauses?.length ?? 0) > 0 && (
          <DocSection title="Legal Terms & Conditions">
            <div className="flex flex-col gap-6">
              {(lease.selectedClauses ?? []).map((clauseId, idx) => {
                const clause = getClauseById(clauseId);
                if (!clause) return null;
                return (
                  <div key={clauseId}>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-navy-900">
                      {idx + 1}. {clause.title}
                    </p>
                    <p className="text-xs leading-relaxed text-neutral-600">{clause.text}</p>
                  </div>
                );
              })}
            </div>
          </DocSection>
        )}

        {/* Signature blocks */}
        <div className="mt-10 grid grid-cols-2 gap-12 border-t border-neutral-200 pt-8">
          {/* Landlord / PM signature */}
          <SigBlock
            label="Landlord / Property Manager"
            signerName={lease.status === "fully_signed" ? resolvedPmName : undefined}
            signedAt={lease.pmSignedAt}
          />
          {/* Tenant signature */}
          <SigBlock
            label="Tenant"
            signerName={
              lease.status === "tenant_signed" || lease.status === "fully_signed"
                ? (lease.tenantSignatureName ?? lease.tenantName)
                : undefined
            }
            signedAt={lease.tenantSignedAt}
          />
        </div>

        {/* Legal validity notice when fully executed */}
        {lease.status === "fully_signed" && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-green-800">
              ✓ This agreement is fully executed and legally binding.
            </p>
            <p className="mt-0.5 text-[10px] text-green-700">
              Digitally signed and recorded on the ResiGrid Platform · {formatDateTime(lease.pmSignedAt ?? lease.tenantSignedAt)}
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-[10px] text-neutral-400">
          Generated by ResiGrid on {new Date().toLocaleDateString()} · This document is for
          informational purposes and should be reviewed by a licensed attorney where required by law.
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
      <span className="w-40 shrink-0 text-neutral-500">{label}</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}

function SigBlock({
  label,
  signerName,
  signedAt,
}: {
  label: string;
  signerName?: string;
  signedAt?: number;
}) {
  return (
    <div>
      {/* Cursive signature line */}
      <div className="mb-1 h-12 border-b border-neutral-400 flex items-end pb-1">
        {signerName ? (
          <span
            style={{ fontFamily: "'Dancing Script', cursive", fontSize: 28, lineHeight: 1 }}
            className="text-navy-900 leading-none"
          >
            {signerName}
          </span>
        ) : (
          <span className="text-xs text-neutral-300 italic">Awaiting signature</span>
        )}
      </div>
      <p className="text-xs text-neutral-500">Signature</p>

      {/* Print name */}
      <div className="mt-4 border-b border-neutral-400 pb-1">
        {signerName && (
          <p className="text-sm font-medium text-navy-900">{signerName}</p>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">Print name</p>

      {/* Date */}
      <div className="mt-4 border-b border-neutral-400 pb-1">
        {signedAt && (
          <p className="text-sm text-navy-900">
            {new Date(signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">Date</p>

      <p className="mt-3 text-xs font-medium text-navy-900">{label}</p>
    </div>
  );
}
