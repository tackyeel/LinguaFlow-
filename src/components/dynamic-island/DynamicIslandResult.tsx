import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { parseReplySections, parseTranslationSections } from "../../hooks/useTranslatorEngine";

interface DynamicIslandResultProps {
  tab: "translation" | "explanation" | "reply";
  hasInput: boolean;
  translationText: string;
  aiExplanationText: string;
  aiReplyText: string;
  error: string;
  running: boolean;
}

export function DynamicIslandResult({
  tab,
  hasInput,
  translationText,
  aiExplanationText,
  aiReplyText,
  error,
  running
}: DynamicIslandResultProps) {
  const hasResult = Boolean(translationText.trim() || aiExplanationText.trim() || aiReplyText.trim());

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-danger">
        <div className="flex max-w-[420px] items-center gap-2 rounded-lg bg-danger-soft px-3 py-2">
          <AlertCircle size={18} />
          <span className="line-clamp-3">{error}</span>
        </div>
      </div>
    );
  }

  if (running && !translationText && !aiExplanationText && !aiReplyText) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
        <div className="dynamic-island-processing-orb">
          <span className="text-lg font-semibold text-accent">A</span>
        </div>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-accent-soft">
          <div className="dynamic-island-progress h-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!hasInput && !hasResult) {
    return (
      <div className="dynamic-island-empty-state">
        <div className="dynamic-island-empty-orb">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">输入内容后开始翻译</div>
          <div className="mt-1 text-xs text-text-muted">结果、AI 解释和回复建议会显示在这里</div>
        </div>
      </div>
    );
  }

  if (tab === "translation") {
    return (
      <div className="dynamic-island-result-scroll">
        <p className="whitespace-pre-wrap text-sm leading-6 text-text-primary">
          {translationText || "等待翻译..."}
        </p>
      </div>
    );
  }

  if (tab === "explanation") {
    const sections = parseTranslationSections(aiExplanationText);
    return (
      <div className="dynamic-island-result-scroll grid gap-2">
        <Section title="自然翻译" content={sections.natural || translationText} />
        <Section title="语气解释" content={sections.tone} muted="暂无语气说明。" />
        <Section title="难点词句" content={sections.slang} muted="暂未发现难点词句。" />
        <Section title="直译参考" content={sections.literal} muted="暂无直译参考。" />
      </div>
    );
  }

  const reply = parseReplySections(aiReplyText);
  return (
    <div className="dynamic-island-result-scroll grid gap-2">
      <Section title="推荐回复" content={reply.recommended} />
      <Section title="随意一点" content={reply.casual} muted="暂无随意版本。" />
      <Section title="礼貌一点" content={reply.polite} muted="暂无礼貌版本。" />
      <Section title="含义解释" content={reply.meaning} muted="暂无含义解释。" />
    </div>
  );
}

function Section({ title, content, muted = "等待 AI..." }: { title: string; content: string; muted?: string }) {
  return (
    <section className="dynamic-island-result-card rounded-lg border border-border-subtle px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
        <CheckCircle2 size={13} className="text-accent" />
        {title}
      </div>
      <p className={`whitespace-pre-wrap text-sm leading-5 ${content ? "text-text-primary" : "text-text-muted"}`}>
        {content || muted}
      </p>
    </section>
  );
}
