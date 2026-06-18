import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, PanelTopOpen, Sparkles, X } from "lucide-react";
import type { TranslatorStatus, useTranslatorEngine } from "../../hooks/useTranslatorEngine";

interface DynamicIslandProps {
  engine: ReturnType<typeof useTranslatorEngine>;
  expanded: boolean;
  status: TranslatorStatus;
  onHoverExpand: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
  onSwitchToNormal: () => void;
}

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

export function DynamicIsland({
  engine,
  expanded,
  status,
  onHoverExpand,
  onExpand,
  onCollapse,
  onClose,
  onSwitchToNormal
}: DynamicIslandProps) {
  return (
    <motion.div
      className={`dynamic-island-capsule no-drag ${expanded ? "dynamic-island-capsule-expanded" : ""}`}
      initial={false}
      animate={{
        width: expanded ? 684 : 300,
        height: 50,
        scale: status === "success" && !expanded ? 1.015 : 1
      }}
      transition={spring}
      onMouseEnter={onHoverExpand}
      onClick={() => {
        if (!expanded) onExpand();
      }}
    >
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            className="relative grid h-full w-full grid-cols-[minmax(0,1fr)_32px_32px] items-center gap-2 px-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {engine.copyNotice ? <div className="dynamic-island-copy-notice">{engine.copyNotice}</div> : null}
            <textarea
              className="dynamic-island-input"
              value={engine.sourceText}
              placeholder="输入或粘贴要翻译的内容..."
              onChange={(event) => engine.setSourceText(event.target.value)}
              onFocus={onExpand}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void engine.performTranslate();
                }
                if (event.key === "Escape") onCollapse();
              }}
            />
            <button type="button" title="普通窗口" className="dynamic-island-mini-button" onClick={onSwitchToNormal}>
              <PanelTopOpen size={15} />
            </button>
            <button type="button" title="关闭翻译器" className="dynamic-island-mini-button" onClick={onClose}>
              <X size={15} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={status}
            className="relative flex h-full w-full items-center justify-between overflow-hidden px-5"
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.18 }}
          >
            <CollapsedStatus status={status} copyNotice={engine.copyNotice} />
            {status === "translating" ? <div className="dynamic-island-progress absolute bottom-0 left-0 h-[2px]" /> : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CollapsedStatus({ status, copyNotice }: { status: TranslatorStatus; copyNotice: string }) {
  if (copyNotice) {
    return (
      <div className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2 size={18} />
        <span className="text-text-primary">{copyNotice}</span>
      </div>
    );
  }

  if (status === "translating") {
    return (
      <>
        <span className="w-6" />
        <span className="dynamic-island-pulse-text text-xs font-semibold">正在翻译...</span>
        <Loader2 className="animate-spin text-accent" size={18} />
      </>
    );
  }

  if (status === "success") {
    return (
      <div className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2 size={18} />
        <span className="text-text-primary">翻译完成</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-danger">
        <AlertCircle size={18} />
        <span>翻译失败</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-text-secondary">
      <Sparkles size={16} className="text-accent" />
      <span>准备翻译</span>
    </div>
  );
}
