import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronDown, Copy, Eraser, Image as ImageIcon, Languages, Lightbulb, MessageSquareReply, Repeat2, Sparkles } from "lucide-react";
import { MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../constants/languages";
import type { useTranslatorEngine } from "../../hooks/useTranslatorEngine";
import { getActiveAiModelName } from "../../utils/aiModel";
import { DynamicIslandResult } from "./DynamicIslandResult";

type TabId = "translation" | "explanation" | "reply" | "vision";

interface DynamicIslandPanelProps {
  engine: ReturnType<typeof useTranslatorEngine>;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  translationText: string;
  aiExplanationText: string;
  aiReplyText: string;
  imageTranslationText: string;
  imageTranslationPreview: string;
  imageTranslationSize: string;
  error: string;
  onCopy: () => void;
  onClear: () => void;
  onImageTranslate: () => void;
  onExplain: () => void;
  onReply: () => void;
}

const tabs: Array<{ id: TabId; label: string; icon: JSX.Element }> = [
  { id: "translation", label: "翻译", icon: <Sparkles size={15} /> },
  { id: "explanation", label: "AI 解释", icon: <Lightbulb size={15} /> },
  { id: "reply", label: "AI 回复", icon: <MessageSquareReply size={15} /> },
  { id: "vision", label: "AI 识图", icon: <ImageIcon size={15} /> }
];

export function DynamicIslandPanel({
  engine,
  activeTab,
  onTabChange,
  translationText,
  aiExplanationText,
  aiReplyText,
  imageTranslationText,
  imageTranslationPreview,
  imageTranslationSize,
  error,
  onCopy,
  onClear,
  onImageTranslate,
  onExplain,
  onReply
}: DynamicIslandPanelProps) {
  const aiModelName = getActiveAiModelName(engine.config, activeTab === "vision" ? "vision" : "text");
  const showAiModel = activeTab === "explanation" || activeTab === "reply" || activeTab === "vision";

  return (
    <motion.div
      className="dynamic-island-panel no-drag"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
    >
      <div className="flex h-12 items-center border-b border-border-subtle bg-surface/80 px-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-accent-soft text-accent" : "text-text-secondary hover:bg-surface-hover"
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {showAiModel ? (
          <span
            className="ml-3 min-w-0 max-w-[210px] truncate rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
            title={aiModelName}
          >
            {aiModelName}
          </span>
        ) : null}
      </div>

      <div className="dynamic-island-result-pane h-[224px] min-h-0 overflow-hidden px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="h-full min-h-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
          >
            <DynamicIslandResult
              tab={activeTab}
              hasInput={Boolean(engine.sourceText.trim())}
              translationText={translationText}
              aiExplanationText={aiExplanationText}
              aiReplyText={aiReplyText}
              imageTranslationText={imageTranslationText}
              imageTranslationPreview={imageTranslationPreview}
              imageTranslationSize={imageTranslationSize}
              error={error}
              translationRunning={engine.translationRunning}
              aiExplanationRunning={engine.aiExplanationRunning}
              aiReplyRunning={engine.aiReplyRunning}
              imageTranslationRunning={engine.imageTranslationRunning}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="dynamic-island-footer flex h-[52px] items-center justify-between gap-2 border-t border-border-subtle px-4">
        <div className="flex shrink-0 items-center gap-1.5 text-text-secondary">
          <button type="button" title="复制" className="dynamic-island-icon-button" onClick={onCopy}>
            <Copy size={16} />
          </button>
          <button type="button" title="清空" className="dynamic-island-icon-button" onClick={onClear}>
            <Eraser size={16} />
          </button>
          <button type="button" title="截图识图翻译" className="dynamic-island-icon-button" onClick={onImageTranslate}>
            <Camera size={16} />
          </button>
        </div>

        <div className="dynamic-island-footer-actions">
          <button
            type="button"
            className={`dynamic-island-ai-toggle ${engine.aiEnabled ? "dynamic-island-ai-toggle-active" : ""}`}
            onClick={() => void engine.toggleAi(!engine.aiEnabled)}
          >
            <Languages size={15} />
            AI 自动
          </button>
          <button type="button" className="dynamic-island-secondary-action" onClick={onExplain}>
            <Lightbulb size={15} />
            AI 解释
          </button>
          <button type="button" className="dynamic-island-primary-action" onClick={onReply}>
            <MessageSquareReply size={15} />
            帮我回复
          </button>
          <div className="dynamic-island-language-controls">
            <LanguageSelect
              value={engine.settings.sourceLanguage}
              onChange={(value) =>
                void engine.updateConfig((draft) => {
                  draft.translationSettings.sourceLanguage = value;
                })
              }
              options={MAINSTREAM_LANGUAGES}
            />
            <button type="button" title="切换语言" className="dynamic-island-mini-button" onClick={() => void engine.swapLanguages()}>
              <Repeat2 size={15} />
            </button>
            <LanguageSelect
              value={engine.settings.targetLanguage}
              onChange={(value) =>
                void engine.updateConfig((draft) => {
                  draft.translationSettings.targetLanguage = value;
                })
              }
              options={TARGET_LANGUAGES}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LanguageSelect({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ code: string; label: string }>;
}) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="dynamic-island-language-select"
      >
        {options.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
    </label>
  );
}
