"use client";

import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DaysDueCounterProps {
  dueDate: number | null;
  paid: boolean;
  className?: string;
}

export function DaysDueCounter({ dueDate, paid, className }: DaysDueCounterProps) {
  if (!dueDate) return null;

  if (paid) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        Paid
      </span>
    );
  }

  const daysUntilDue = Math.ceil((dueDate - Date.now()) / (24 * 60 * 60 * 1000));
  const overdue = daysUntilDue < 0;
  const dueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        overdue && "bg-red-50 text-red-700",
        dueSoon && !overdue && "bg-orange-50 text-orange-700",
        !overdue && !dueSoon && "bg-neutral-100 text-neutral-700",
        className,
      )}
    >
      {overdue ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      {overdue
        ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`
        : daysUntilDue === 0
          ? "Due today"
          : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`}
    </span>
  );
}
