import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { hideWindow } from "../../utils/tauri";

interface WindowFrameProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
}

export function WindowFrame({ title, subtitle, children, actions, compact }: WindowFrameProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-app text-text">
      <header className="drag-region flex h-14 shrink-0 items-center justify-between border-b border-line/10 bg-panel/80 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
        <div className="no-drag flex items-center gap-2">
          {actions}
          <Button
            aria-label="隐藏窗口"
            title="隐藏窗口"
            variant="ghost"
            className="h-8 w-8 px-0"
            icon={<X size={16} />}
            onClick={() => void hideWindow()}
          />
        </div>
      </header>
      <main className={compact ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-auto"}>{children}</main>
    </div>
  );
}
