import { type ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-600 focus-visible:outline-orange-600",
  secondary:
    "bg-navy-900 text-white hover:bg-navy-800 focus-visible:outline-navy-700",
  outline:
    "border border-neutral-200 text-navy-900 hover:bg-neutral-100 bg-white",
  ghost: "text-navy-900 hover:bg-navy-900/5",
};

const sizeClasses: Record<Size, string> = {
  // min-h ensures ≥44px touch targets on all button sizes (WCAG 2.5.5 / Apple HIG)
  sm: "text-sm px-3 py-2 min-h-[44px] rounded-md",
  md: "text-sm px-4 py-2.5 min-h-[44px] rounded-lg",
  lg: "text-base px-5 py-3 min-h-[48px] rounded-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", href, children, ...props },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
