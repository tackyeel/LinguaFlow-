import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./../../utils/cn"; // we can use the cn utility

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p> : null}
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {children}
      </div>
    </section>
  );
}

interface FieldProps {
  label: string;
  description?: string;
  children: ReactNode;
  alignTop?: boolean;
}

export function Field({ label, description, children, alignTop }: FieldProps) {
  return (
    <label
      className={cn(
        "flex min-h-[64px] flex-col gap-4 px-2 py-4 transition-colors hover:bg-surface-hover sm:flex-row sm:justify-between",
        alignTop ? "sm:items-start" : "sm:items-center"
      )}
    >
      <span className="min-w-0 flex-1 pr-4">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{description}</span> : null}
      </span>
      <div className="w-full min-w-[200px] flex-shrink-0 sm:w-auto">
        {children}
      </div>
    </label>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export function TextInput({ className, mono, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent",
        mono && "font-mono",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[112px] w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    />
  );
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "ml-auto flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
        checked ? "bg-accent" : "bg-border-subtle"
      )}
    >
      <span
        className={cn(
          "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-surface-selected px-3 text-xs font-medium text-accent">
      {children}
    </span>
  );
}
