import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.98]",
  {
    variants: {
      variant: {
        gold: "rounded-[var(--radius-pill)] bg-gold text-ink shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] hover:bg-gold-bright",
        ghost:
          "rounded-[var(--radius-pill)] bg-transparent text-cream border border-gold/30 hover:border-gold/60 hover:bg-cream/5",
        felt: "rounded-[var(--radius-md)] bg-felt text-cream border border-gold/22 hover:border-gold/45 hover:bg-felt-raise",
        danger: "rounded-[var(--radius-pill)] bg-transparent text-loss border border-loss/40 hover:bg-loss/10",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

export { buttonVariants };