import { useState } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { Copy, Eye, EyeOff, Search, Star, Trash2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Switch as BaseSwitch } from "./Form";
import { WindowControls } from "./WindowControls";

export interface NavItem<T extends string> {
  id: T;
  label: string;
  description?: string;
  icon: ReactNode;
}

export function AppShell({
  sidebar,
  topBar,
  children
}: {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 bg-app text-text-primary">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        <main className="min-h-0 flex-1 overflow-auto bg-app">
          <div className="mx-auto w-full max-w-[1120px] px-6 py-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function TopBar({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="drag-region flex h-[68px] shrink-0 items-center justify-between border-b border-border-subtle bg-surface pl-6 pr-2">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-medium tracking-tight text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-text-secondary">{subtitle}</p> : null}
      </div>
      <div className="no-drag flex h-full items-center gap-2">
        {actions}
        <div className="ml-2 h-6 w-px bg-border-subtle" />
        <WindowControls />
      </div>
    </header>
  );
}

export function Sidebar<T extends string>({
  items,
  activeId,
  onSelect,
  footer
}: {
  items: Array<NavItem<T>>;
  activeId: T;
  onSelect: (id: T) => void;
  footer?: ReactNode;
}) {
  return (
    <aside className="hidden w-[268px] shrink-0 border-r border-border-subtle bg-surface md:flex md:flex-col">
      <div className="px-7 py-6">
        <div className="text-[26px] font-semibold leading-8 tracking-tight text-accent">LinguaFlow</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Desktop Suite</div>
      </div>
      <nav className="flex-1 space-y-1 overflow-auto px-3">
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-full px-4 text-left text-sm font-medium transition-colors",
                selected
                  ? "bg-surface-selected text-text-primary"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <span className={cn("grid h-6 w-6 place-items-center", selected ? "text-accent" : "text-text-secondary")}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-border-subtle px-6 py-5">{footer}</div> : null}
    </aside>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        <h2 className="text-[28px] font-medium leading-tight tracking-tight text-text-primary">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon,
  children,
  className
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm", className)}>
      {title || description ? (
        <div className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
          {icon ? <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">{icon}</div> : null}
          <div className="min-w-0">
            {title ? <h3 className="text-lg font-medium text-text-primary">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p> : null}
          </div>
        </div>
      ) : null}
      <div>{children}</div>
    </section>
  );
}

export function SettingRow({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[64px] flex-col gap-4 border-b border-border-subtle px-6 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary">{title}</div>
        {description ? <div className="mt-1 text-xs leading-5 text-text-secondary">{description}</div> : null}
      </div>
      <div className="w-full min-w-[180px] sm:w-auto">{children}</div>
    </div>
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-grid h-10 w-10 place-items-center rounded-full text-text-secondary transition hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    />
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: InputHTMLAttributes<HTMLInputElement>["onChange"];
  placeholder?: string;
}) {
  const [visible, setVisible] = usePasswordVisible();
  return (
    <div className="relative">
      <TextInput
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-11"
      />
      <IconButton
        className="absolute right-0 top-0"
        title={visible ? "隐藏 API Key" : "显示 API Key"}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </IconButton>
    </div>
  );
}

function usePasswordVisible(): [boolean, (visible: boolean) => void] {
  return useState(false);
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full resize-y rounded-lg border border-border bg-surface px-3 py-3 text-sm leading-6 text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary outline-none transition focus:border-accent focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Switch(props: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return <BaseSwitch {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "success" && "bg-success-soft text-success",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "neutral" && "bg-surface-hover text-text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full bg-surface-hover p-1", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-5 text-sm font-medium transition",
              selected ? "bg-surface text-accent shadow-sm" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Dialog({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="grid h-full w-full place-items-center bg-black/30 p-6 backdrop-blur-sm">
      <div className={cn("w-full max-w-md overflow-hidden rounded-[24px] bg-surface shadow-lg", className)}>{children}</div>
    </div>
  );
}

export function Toast({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "danger" }) {
  return (
    <div
      className={cn(
        "fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-lg",
        tone === "success" && "bg-success text-white",
        tone === "danger" && "bg-danger text-white",
        tone === "neutral" && "bg-text-primary text-white"
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      {icon ? <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">{icon}</div> : null}
      <div className="text-base font-medium text-text-primary">{title}</div>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p> : null}
    </div>
  );
}

export function Keycap({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-14 items-center justify-center rounded-lg border px-4 py-2 font-mono text-lg font-semibold shadow-sm",
        muted ? "border-border bg-surface-hover text-text-muted" : "border-accent/40 bg-accent-soft text-accent"
      )}
    >
      {children}
    </span>
  );
}

export function ProviderCard({
  name,
  description,
  badge,
  active,
  enabled,
  onClick
}: {
  name: string;
  description?: string;
  badge?: string;
  active?: boolean;
  enabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border bg-surface p-4 text-left transition hover:shadow-sm",
        active ? "border-accent shadow-sm ring-1 ring-accent/20" : "border-border-subtle hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", enabled ? "bg-success" : "bg-border")} />
            <div className="truncate text-sm font-medium text-text-primary">{name}</div>
          </div>
          {description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-secondary">{description}</p> : null}
        </div>
        {badge ? <Badge tone="accent">{badge}</Badge> : null}
      </div>
    </button>
  );
}

export function ServiceListItem({
  icon,
  name,
  children
}: {
  icon: ReactNode;
  name: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft font-semibold text-accent">{icon}</div>
      <div className="min-w-[180px] flex-1">{name}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function HistoryItem({
  type,
  direction,
  serviceName,
  time,
  sourceText,
  resultText,
  contextText,
  favorite,
  onFavorite,
  onDelete
}: {
  type: string;
  direction: string;
  serviceName: string;
  time: string;
  sourceText: string;
  resultText: string;
  contextText?: string;
  favorite?: boolean;
  onFavorite?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          <Badge tone="accent">{type}</Badge>
          <span className="font-medium text-text-primary">{direction}</span>
          <span>·</span>
          <span>{serviceName}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-text-secondary">{time}</span>
          <IconButton title="收藏" onClick={onFavorite}>
            <Star size={16} className={favorite ? "fill-warning text-warning" : ""} />
          </IconButton>
          <IconButton title="复制原文" onClick={() => void navigator.clipboard?.writeText(sourceText)}>
            <Copy size={16} />
          </IconButton>
          <IconButton title="复制译文" onClick={() => void navigator.clipboard?.writeText(resultText)}>
            <Copy size={16} />
          </IconButton>
          <IconButton title="删除" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="min-h-32 border-b border-border-subtle p-5 md:border-b-0 md:border-r">
          {contextText ? <div className="mb-3 rounded-xl bg-surface-hover p-3 text-xs text-text-secondary">{contextText}</div> : null}
          <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{sourceText}</p>
        </div>
        <div className="min-h-32 bg-[#FBFCFF] p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{resultText}</p>
        </div>
      </div>
    </article>
  );
}

export function PromptEditor({
  title,
  value,
  onChange
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h4 className="text-sm font-medium text-text-primary">{title}</h4>
        <div className="flex items-center gap-1 text-text-secondary">
          <IconButton title="复制提示词" onClick={() => void navigator.clipboard?.writeText(value)}>
            <Copy size={16} />
          </IconButton>
        </div>
      </div>
      <Textarea
        className="min-h-72 rounded-none border-0 font-mono text-xs leading-6 focus:ring-0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function TranslateResultSection({
  title,
  content,
  accent
}: {
  title: string;
  content: string;
  accent?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm", accent && "bg-accent-soft/40")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-accent">{title}</h4>
        <IconButton title="复制本段" onClick={() => void navigator.clipboard?.writeText(content)}>
          <Copy size={16} />
        </IconButton>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{content}</p>
    </section>
  );
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
      <TextInput className="pl-9" {...props} />
    </div>
  );
}
