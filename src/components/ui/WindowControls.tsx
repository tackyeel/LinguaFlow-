import { Minus, Square, X } from "lucide-react";
import { hideWindow, minimizeWindow, toggleMaximizeWindow } from "../../utils/tauri";
import { cn } from "../../utils/cn";

export function WindowControls({ className }: { className?: string }) {
  return (
    <div className={cn("no-drag flex h-full items-center", className)}>
      <button
        type="button"
        aria-label="最小化"
        title="最小化"
        className="grid h-10 w-11 place-items-center text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
        onClick={() => void minimizeWindow()}
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        aria-label="最大化"
        title="最大化"
        className="grid h-10 w-11 place-items-center text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
        onClick={() => void toggleMaximizeWindow()}
      >
        <Square size={13} />
      </button>
      <button
        type="button"
        aria-label="关闭"
        title="关闭"
        className="grid h-10 w-11 place-items-center text-text-secondary transition hover:bg-danger hover:text-white"
        onClick={() => void hideWindow()}
      >
        <X size={17} />
      </button>
    </div>
  );
}
