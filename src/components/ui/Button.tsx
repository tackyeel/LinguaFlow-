import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white border border-transparent hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface text-accent border border-border hover:bg-surface-hover shadow-sm",
  ghost: "bg-transparent text-text-secondary border border-transparent hover:bg-surface-hover hover:text-text-primary",
  danger: "bg-danger-soft text-danger border border-transparent hover:opacity-80"
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-xs rounded-full",
  md: "h-10 px-5 text-sm rounded-full",
  lg: "h-12 px-6 text-base rounded-full",
  icon: "h-10 w-10 rounded-full p-0 flex items-center justify-center"
};

export function Button({ 
  children, 
  icon, 
  className, 
  variant = "secondary", 
  size = "md",
  type = "button", 
  ...props 
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-all duration-200 ease-in-out active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
