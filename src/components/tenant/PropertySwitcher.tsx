"use client";

import { useRef, useState } from "react";
import { ChevronDown, Home } from "lucide-react";
import { useTenantLeaseContext } from "@/lib/context/TenantLeaseContext";
import { cn } from "@/lib/utils/cn";

export function PropertySwitcher() {
  const { activeLeases, selectedLeaseId, setSelectedLeaseId } = useTenantLeaseContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // No clutter for the common single-lease case.
  if (activeLeases.length <= 1) return null;

  const selected = activeLeases.find((l) => l.lease.id === selectedLeaseId) ?? activeLeases[0];

  return (
    <div className="border-b border-neutral-200 bg-white px-4 py-2 md:px-8">
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-neutral-100"
        >
          <Home className="h-3.5 w-3.5 text-orange-500" />
          {selected?.property?.name ?? "Select property"}
          {selected?.unit && (
            <span className="text-neutral-500">· Unit {selected.unit.unitNumber}</span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 text-neutral-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
              {activeLeases.map(({ lease, property, unit }) => (
                <button
                  key={lease.id}
                  type="button"
                  onClick={() => {
                    setSelectedLeaseId(lease.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-neutral-50",
                    lease.id === selectedLeaseId && "bg-orange-50",
                  )}
                >
                  {property?.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.photos[0]}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900/5 text-navy-900">
                      <Home className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">
                      {property?.name ?? "Property"}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {unit ? `Unit ${unit.unitNumber}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
