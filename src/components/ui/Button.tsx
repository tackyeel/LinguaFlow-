import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary/95 text-black hover:bg-primary",
  secondary: "bg-panel2 text-text hover:bg-panel2/80 border border-line/10",
  ghost: "text-muted hover:bg-panel2 hover:text-text",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/20"
};

export function Button({ children, icon, className, variant = "secondary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
