import type { ReactNode } from "react";
import { WindowControls } from "./WindowControls";

interface WindowFrameProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerCenter?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  hideHeader?: boolean;
}

export function WindowFrame({ title, subtitle, headerCenter, children, actions, compact, hideHeader }: WindowFrameProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-app text-text-primary">
      {!hideHeader && (
        <header className="drag-region relative flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-surface pl-6 pr-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white shadow-sm">
              LF
            </div>
            <div className="flex min-w-0 flex-col">
              {title && <div className="truncate text-base font-semibold tracking-tight text-text-primary">{title}</div>}
              {subtitle && <div className="truncate text-xs text-text-muted">{subtitle}</div>}
            </div>
          </div>

          {headerCenter && (
            <div className="no-drag absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              {headerCenter}
            </div>
          )}

          <div className="no-drag z-10 flex h-full items-center gap-3">
            {actions}
            {actions ? <div className="h-6 w-px bg-border-subtle" /> : null}
            <WindowControls />
          </div>
        </header>
      )}
      <main className={compact ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-auto"}>{children}</main>
    </div>
  );
}
