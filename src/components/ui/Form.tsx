import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-line/10 bg-panel p-5 shadow-glow">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      <div className="grid gap-3">{children}</div>
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
      className={clsx(
        "grid gap-3 rounded-md border border-line/10 bg-panel2/50 p-3 sm:grid-cols-[minmax(160px,1fr)_minmax(240px,1.3fr)]",
        alignTop ? "items-start" : "items-center"
      )}
    >
      <span>
        <span className="block text-sm font-medium text-text">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-muted">{description}</span> : null}
      </span>
      {children}
    </label>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export function TextInput({ className, mono, ...props }: TextInputProps) {
  return (
    <input
      className={clsx(
        "h-9 w-full rounded-md border border-line/10 bg-app px-3 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary/70",
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
      className={clsx(
        "min-h-28 w-full resize-y rounded-md border border-line/10 bg-app px-3 py-2 text-sm leading-6 text-text outline-none transition placeholder:text-muted/70 focus:border-primary/70",
        className
      )}
      {...props}
    />
  );
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "h-9 w-full rounded-md border border-line/10 bg-app px-3 text-sm text-text outline-none transition focus:border-primary/70",
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
      className={clsx(
        "ml-auto flex h-6 w-11 items-center rounded-full border border-line/10 p-0.5 transition",
        checked ? "bg-primary" : "bg-app"
      )}
    >
      <span
        className={clsx(
          "block h-5 w-5 rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-line/10 bg-panel2 px-2 text-xs font-medium text-muted">
      {children}
    </span>
  );
}
