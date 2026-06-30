import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "navy" | "orange" | "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  navy: "bg-navy-900 text-white",
  orange: "bg-orange-100 text-orange-600",
  neutral: "bg-neutral-100 text-neutral-600",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
