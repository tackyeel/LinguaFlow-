import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DynamicIsland } from "./DynamicIsland";
import { DynamicIslandPanel } from "./DynamicIslandPanel";
import { useTranslatorEngine, type TranslatorStatus } from "../../hooks/useTranslatorEngine";
import { hideWindow, resizeDynamicIslandWindow, switchTranslatorWindowMode } from "../../utils/tauri";

type TabId = "translation" | "explanation" | "reply";

export function DynamicIslandWindow() {
  const engine = useTranslatorEngine();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("translation");
  const collapseTimerRef = useRef<number>();
  const hoverTimerRef = useRef<number>();
  const resizeTimerRef = useRef<number>();

  const status = useMemo<TranslatorStatus>(() => {
    if (engine.running) return "translating";
    if (engine.error) return "error";
    if (engine.completed) return "success";
    if (expanded) return "expanded";
    return "idle";
  }, [engine.completed, engine.error, engine.running, expanded]);

  useLayoutEffect(() => {
    document.documentElement.dataset.window = "dynamic-island";
    document.body.dataset.window = "dynamic-island";
    void resizeDynamicIslandWindow(false);
    return () => {
      delete document.documentElement.dataset.window;
      delete document.body.dataset.window;
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(resizeTimerRef.current);
    if (expanded) {
      void resizeDynamicIslandWindow(true);
      return;
    }

    resizeTimerRef.current = window.setTimeout(() => void resizeDynamicIslandWindow(false), 180);
    return () => window.clearTimeout(resizeTimerRef.current);
  }, [expanded]);

  const primaryCopyText =
    activeTab === "reply" ? engine.aiReplyText : activeTab === "explanation" ? engine.aiExplanationText : engine.translationText;

  const switchToNormal = async () => {
    await engine.updateConfig((draft) => {
      draft.translatorWindowMode = "normal";
    });
    await switchTranslatorWindowMode("normal");
  };

  const closeTranslator = async () => {
    setExpanded(false);
    await hideWindow("dynamic-island");
  };

  const expandIsland = async (delay = 0) => {
    window.clearTimeout(collapseTimerRef.current);
    window.clearTimeout(hoverTimerRef.current);
    if (expanded) return;

    const run = async () => {
      await resizeDynamicIslandWindow(true);
      window.requestAnimationFrame(() => setExpanded(true));
    };

    if (delay > 0) {
      hoverTimerRef.current = window.setTimeout(() => void run(), delay);
      return;
    }

    await run();
  };

  const collapseIsland = (delay = 0) => {
    window.clearTimeout(hoverTimerRef.current);
    window.clearTimeout(collapseTimerRef.current);
    if (!expanded) return;

    const run = () => setExpanded(false);
    if (delay > 0) {
      collapseTimerRef.current = window.setTimeout(run, delay);
      return;
    }

    run();
  };

  useEffect(() => {
    const onBlur = () => collapseIsland();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") collapseIsland();
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  return (
    <div className={`dynamic-island-window ${expanded ? "dynamic-island-window-expanded" : ""}`}>
      <div
        className="dynamic-island-content"
        onMouseEnter={() => window.clearTimeout(collapseTimerRef.current)}
        onMouseLeave={() => collapseIsland(220)}
      >
        <DynamicIsland
          engine={engine}
          expanded={expanded}
          status={status}
          onHoverExpand={() => void expandIsland(180)}
          onExpand={() => void expandIsland()}
          onCollapse={() => collapseIsland()}
          onClose={() => void closeTranslator()}
          onSwitchToNormal={() => void switchToNormal()}
        />

        <AnimatePresence>
          {expanded ? (
            <DynamicIslandPanel
              engine={engine}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              translationText={engine.translationText}
              aiExplanationText={engine.aiExplanationText}
              aiReplyText={engine.aiReplyText}
              error={engine.error}
              running={engine.running}
              onCopy={() => void engine.copy(primaryCopyText)}
              onClear={engine.clearAll}
              onExplain={() => {
                setActiveTab("explanation");
                void engine.performTranslate();
              }}
              onReply={() => {
                setActiveTab("reply");
                void engine.performTranslate();
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
