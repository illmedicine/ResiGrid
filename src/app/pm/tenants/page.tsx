"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { CheckCircle2, Search, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  messageThreadsCol,
  threadMessagesCol,
  unitsCol,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useOwnerLeases } from "@/lib/hooks/useOwnerLeases";
import { useOwnerProperties } from "@/lib/hooks/useOwnerProperties";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import { TenantSearchInput } from "@/components/pm/TenantSearchInput";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { LeaseDoc, UnitDoc, UserDoc } from "@/lib/types/models";

export default function PmTenantsPage() {
  const { user } = useAuth();
  const { leases, loading } = useOwnerLeases(user?.uid);
  const { properties } = useOwnerProperties(user?.uid);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<UserDoc | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [vacantUnits, setVacantUnits] = useState<UnitDoc[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");

  const tenantIds = Array.from(new Set(leases.map((l) => l.tenantId)));

  // Load vacant units when PM selects a property in assign mode
  useEffect(() => {
    if (!selectedPropertyId) {
      setVacantUnits([]);
      return;
    }
    const q = query(
      unitsCol(),
      where("propertyId", "==", selectedPropertyId),
      where("status", "==", "vacant"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setVacantUnits(snap.docs.map((d) => ({ ...d.data(), id: d.id } as UnitDoc)));
    });
    return unsub;
  }, [selectedPropertyId]);

  async function handleAssign() {
    if (!user || !selectedTenant || !selectedUnitId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      // Update unit with tenant
      await updateDoc(doc(db, "units", selectedUnitId), {
        currentTenantId: selectedTenant.uid,
        status: "occupied",
      });

      // Create a message thread and send notification
      const threadRef = doc(messageThreadsCol());
      await setDoc(threadRef, {
        id: threadRef.id,
        participantIds: [user.uid, selectedTenant.uid],
        propertyId: selectedPropertyId,
        leaseId: undefined,
        lastMessageAt: Date.now(),
        lastMessageSnippet: "You have been assigned to a unit",
      });
      const unit = vacantUnits.find((u) => u.id === selectedUnitId);
      const property = properties.find((p) => p.id === selectedPropertyId);
      await addDoc(threadMessagesCol(threadRef.id), {
        id: "",
        threadId: threadRef.id,
        senderId: user.uid,
        content:
          `Welcome! You have been assigned to Unit ${unit?.unitNumber ?? selectedUnitId}` +
          (property ? ` at ${property.name}` : "") +
          `. You can now access your tenant portal to pay rent, submit maintenance requests, ` +
          `view your lease, and message your property manager directly.`,
        createdAt: Date.now(),
        readBy: [user.uid],
      });

      setAssignSuccess(true);
      setAssignMode(false);
      setSelectedTenant(null);
      setSelectedPropertyId("");
      setSelectedUnitId("");
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign tenant",
      );
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Tenants</h1>
          <p className="text-sm text-neutral-600">
            Manage tenants across your properties and assign them to units.
          </p>
        </div>
        <Button onClick={() => { setAssignMode((v) => !v); setAssignSuccess(false); }} size="sm">
          <UserPlus className="h-4 w-4" />
          Assign tenant to unit
        </Button>
      </div>

      {assignSuccess && (
        <Card className="border-green-200 bg-green-50 p-4">
          <CardContent className="flex items-center gap-2 p-0 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Tenant assigned! They have been notified via platform message.
          </CardContent>
        </Card>
      )}

      {/* Assign tenant panel */}
      {assignMode && (
        <Card className="p-5">
          <CardContent className="flex flex-col gap-4 p-0">
            <h2 className="text-sm font-semibold text-navy-900">Assign a tenant to a unit</h2>

            <TenantSearchInput
              label="Search for registered tenant"
              onSelect={(t) => setSelectedTenant(t)}
            />

            {selectedTenant && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Property"
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    setSelectedUnitId("");
                  }}
                >
                  <option value="">Select property…</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>

                <Select
                  label="Vacant unit"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={!selectedPropertyId}
                >
                  <option value="">Select unit…</option>
                  {vacantUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber} — ${u.rent}/mo
                    </option>
                  ))}
                  {selectedPropertyId && vacantUnits.length === 0 && (
                    <option disabled value="">No vacant units</option>
                  )}
                </Select>
              </div>
            )}

            {assignError && (
              <p className="text-sm text-red-600">{assignError}</p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAssign}
                disabled={assigning || !selectedTenant || !selectedUnitId}
                size="sm"
              >
                {assigning ? "Assigning…" : "Confirm assignment"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAssignMode(false);
                  setSelectedTenant(null);
                  setSelectedPropertyId("");
                  setSelectedUnitId("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing tenants list with search */}
      {!loading && tenantIds.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter by name or UID…"
            value={tenantSearch}
            onChange={(e) => setTenantSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : tenantIds.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">
              No tenants yet. Use &quot;Assign tenant to unit&quot; to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        tenantIds.map((tenantId) => (
          <TenantRow
            key={tenantId}
            tenantId={tenantId}
            lease={leases.find((l) => l.tenantId === tenantId)!}
            searchTerm={tenantSearch}
          />
        ))
      )}
    </div>
  );
}

function TenantRow({
  tenantId,
  lease,
  searchTerm,
}: {
  tenantId: string;
  lease: LeaseDoc;
  searchTerm: string;
}) {
  const name = useUserDisplayName(tenantId);

  if (
    searchTerm &&
    !name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !tenantId.toLowerCase().includes(searchTerm.toLowerCase())
  ) {
    return null;
  }

  return (
    <Card className="p-4">
      <CardContent className="flex items-center justify-between gap-3 flex-wrap p-0">
        <div>
          <p className="text-sm font-semibold text-navy-900">{name ?? tenantId}</p>
          <p className="font-mono text-[10px] text-neutral-400">UID: {tenantId}</p>
          <p className="text-xs text-neutral-600 mt-0.5">
            ${lease.rentAmount.toLocaleString()}/mo · due day {lease.dueDay}
          </p>
        </div>
        <div className="flex gap-2">
          <Button href="/pm/messages" size="sm" variant="outline">
            Message
          </Button>
          <Button href={`/pm/leases/new`} size="sm" variant="outline">
            New lease
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
