import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DynamicIsland } from "./DynamicIsland";
import { DynamicIslandPanel } from "./DynamicIslandPanel";
import {
  selectExplanationForCopy,
  selectImageTranslationForCopy,
  selectReplyForCopy,
  selectTranslationForCopy,
  useTranslatorEngine,
  type TranslatorStatus
} from "../../hooks/useTranslatorEngine";
import { hideWindow, listenToTauriEvent, resizeDynamicIslandWindow, switchTranslatorWindowMode } from "../../utils/tauri";

type TabId = "translation" | "explanation" | "reply" | "vision";

export function DynamicIslandWindow() {
  const engine = useTranslatorEngine();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("translation");
  const collapseTimerRef = useRef<number>();
  const hoverTimerRef = useRef<number>();
  const resizeTimerRef = useRef<number>();
  const composingRef = useRef(false);
  const pointerInsideRef = useRef(false);

  const status = useMemo<TranslatorStatus>(() => {
    if (engine.running && !engine.completed) return "translating";
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
    activeTab === "vision"
      ? selectImageTranslationForCopy(engine.imageTranslationText)
      : activeTab === "reply"
        ? selectReplyForCopy(engine.aiReplyText, engine.settings.aiReplyCopyFormat)
        : activeTab === "explanation"
          ? selectExplanationForCopy(engine.aiExplanationText)
          : selectTranslationForCopy(engine.translationText);

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

    const run = () => {
      if (composingRef.current) return;
      setExpanded(false);
    };
    if (delay > 0) {
      collapseTimerRef.current = window.setTimeout(run, delay);
      return;
    }

    run();
  };

  useEffect(() => {
    const onBlur = () => collapseIsland(120);
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

  useEffect(() => {
    const onCompositionStart = () => {
      composingRef.current = true;
    };
    const onCompositionEnd = () => {
      composingRef.current = false;
      if (!pointerInsideRef.current) collapseIsland(220);
    };

    document.addEventListener("compositionstart", onCompositionStart);
    document.addEventListener("compositionend", onCompositionEnd);
    return () => {
      document.removeEventListener("compositionstart", onCompositionStart);
      document.removeEventListener("compositionend", onCompositionEnd);
    };
  }, [expanded]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listenToTauriEvent("dynamic-island:collapse", () => {
      window.clearTimeout(collapseTimerRef.current);
      window.clearTimeout(hoverTimerRef.current);
      setExpanded(false);
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }, []);

  return (
    <div className={`dynamic-island-window ${expanded ? "dynamic-island-window-expanded" : ""}`}>
      <div
        className="dynamic-island-content"
        onMouseEnter={() => {
          pointerInsideRef.current = true;
          window.clearTimeout(collapseTimerRef.current);
        }}
        onMouseLeave={() => {
          pointerInsideRef.current = false;
          collapseIsland(220);
        }}
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
              imageTranslationText={engine.imageTranslationText}
              imageTranslationPreview={engine.imageTranslationPreview}
              imageTranslationSize={engine.imageTranslationSize}
              error={engine.error}
              onCopy={() => void engine.copy(primaryCopyText)}
              onClear={engine.clearAll}
              onImageTranslate={() => {
                setActiveTab("vision");
                void engine.performImageTranslate();
              }}
              onExplain={() => {
                setActiveTab("explanation");
                void engine.performTranslate();
              }}
              onReply={() => {
                setActiveTab("reply");
                void engine.performTranslate(undefined, { forceAiReply: true });
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
