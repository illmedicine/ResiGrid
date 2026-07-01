"use client";

import { useRef, useState } from "react";
import { Search, User } from "lucide-react";
import { useTenantSearch } from "@/lib/hooks/useTenantSearch";
import { Input } from "@/components/ui/Input";
import type { UserDoc } from "@/lib/types/models";

interface TenantSearchInputProps {
  onSelect: (tenant: UserDoc) => void;
  label?: string;
}

export function TenantSearchInput({
  onSelect,
  label = "Search tenants by name or email",
}: TenantSearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserDoc | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, loading } = useTenantSearch(query);

  function handleSelect(tenant: UserDoc) {
    setSelected(tenant);
    setQuery(tenant.displayName ?? tenant.email ?? "");
    setOpen(false);
    onSelect(tenant);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-navy-900">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type first name, last name, or email…"
          className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-navy-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">
              No registered tenants match &quot;{query}&quot;
            </div>
          ) : (
            <ul>
              {results.map((tenant) => (
                <li key={tenant.uid}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(tenant)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-orange-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900/10 text-navy-900">
                      <User className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">
                        {tenant.displayName ?? "—"}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {tenant.email}
                      </p>
                      <p className="truncate text-[10px] font-mono text-neutral-400 mt-0.5">
                        UID: {tenant.uid}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs">
          <User className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-navy-900">{selected.displayName}</span>
            <span className="mx-1.5 text-neutral-400">·</span>
            <span className="text-neutral-600">{selected.email}</span>
            <br />
            <span className="font-mono text-neutral-500">UID: {selected.uid}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-neutral-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
