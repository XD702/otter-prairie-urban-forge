import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        suppressHydrationWarning
        className={cn(
          "h-11 w-full rounded-[var(--radius-sm)] border border-gold/25 bg-ink/50 px-3 text-sm text-cream tabular-nums placeholder:text-muted/70",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          className,
        )}
        {...props}
      />
    );
  },
);
