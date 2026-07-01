"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LEGAL_CLAUSE_CATEGORIES } from "@/lib/lease/legalClauses";

interface LegalClausesSectionProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function LegalClausesSection({ selected, onChange }: LegalClausesSectionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["occupancy", "rent", "maintenance", "legal"]),
  );
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());

  function toggleCategory(catId: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }

  function toggleClauseExpand(clauseId: string) {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      next.has(clauseId) ? next.delete(clauseId) : next.add(clauseId);
      return next;
    });
  }

  function toggleClause(clauseId: string) {
    const next = new Set(selected);
    next.has(clauseId) ? next.delete(clauseId) : next.add(clauseId);
    onChange(next);
  }

  function selectAllInCategory(catId: string) {
    const cat = LEGAL_CLAUSE_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    const allSelected = cat.clauses.every((cl) => selected.has(cl.id));
    const next = new Set(selected);
    cat.clauses.forEach((cl) => (allSelected ? next.delete(cl.id) : next.add(cl.id)));
    onChange(next);
  }

  const totalSelected = selected.size;
  const totalClauses = LEGAL_CLAUSE_CATEGORIES.reduce((sum, c) => sum + c.clauses.length, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-600">
          {totalSelected} of {totalClauses} clauses selected
        </p>
        <button
          type="button"
          onClick={() => {
            const allIds = LEGAL_CLAUSE_CATEGORIES.flatMap((c) => c.clauses.map((cl) => cl.id));
            onChange(totalSelected === totalClauses ? new Set<string>() : new Set(allIds));
          }}
          className="text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          {totalSelected === totalClauses ? "Clear all" : "Select all"}
        </button>
      </div>

      {LEGAL_CLAUSE_CATEGORIES.map((category) => {
        const isOpen = openCategories.has(category.id);
        const catSelected = category.clauses.filter((cl) => selected.has(cl.id)).length;

        return (
          <div key={category.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                )}
                <span className="text-sm font-semibold text-navy-900">{category.label}</span>
                {catSelected > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                    {catSelected}/{category.clauses.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); selectAllInCategory(category.id); }}
                className="text-[10px] font-medium text-neutral-500 hover:text-orange-600"
              >
                {category.clauses.every((cl) => selected.has(cl.id)) ? "Clear" : "All"}
              </button>
            </button>

            {/* Clause list */}
            {isOpen && (
              <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                {category.clauses.map((clause) => {
                  const isChecked = selected.has(clause.id);
                  const isExpanded = expandedClauses.has(clause.id);

                  return (
                    <div
                      key={clause.id}
                      className={cn(
                        "transition-colors",
                        isChecked ? "bg-orange-50" : "bg-white hover:bg-neutral-50",
                      )}
                    >
                      <div className="flex items-start gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          id={clause.id}
                          checked={isChecked}
                          onChange={() => toggleClause(clause.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-orange-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={clause.id}
                              className="cursor-pointer text-sm font-medium text-navy-900"
                            >
                              {clause.title}
                            </label>
                            {clause.recommended && (
                              <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-600">
                                <Star className="h-2.5 w-2.5" /> Recommended
                              </span>
                            )}
                          </div>

                          {/* Text preview + expand */}
                          <p className={cn(
                            "mt-1 text-xs leading-relaxed text-neutral-500",
                            !isExpanded && "line-clamp-2",
                          )}>
                            {clause.text}
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleClauseExpand(clause.id)}
                            className="mt-1 text-[10px] font-medium text-orange-600 hover:text-orange-700"
                          >
                            {isExpanded ? "Show less ▲" : "Read full clause ▼"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
