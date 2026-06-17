import { useEffect, useState } from "react";
import { Download, History as HistoryIcon, RefreshCw, Trash2 } from "lucide-react";
import type { HistoryEntry } from "../../../types/config";
import { clearHistoryEntries, getHistoryEntries } from "../../../utils/history";
import { Button } from "../../ui/Button";
import { EmptyState, PageHeader } from "../../ui/Material";

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      setEntries(await getHistoryEntries());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "linguaflow-history.json";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const clearAll = async () => {
    setLoading(true);
    setError("");
    try {
      await clearHistoryEntries();
      setEntries([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="历史记录"
        actions={
          <>
            <Button size="sm" variant="secondary" icon={<RefreshCw size={15} />} disabled={loading} onClick={() => void loadHistory()}>
              刷新
            </Button>
            <Button size="sm" variant="secondary" icon={<Download size={15} />} disabled={!entries.length} onClick={exportJson}>
              导出
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={15} />} disabled={!entries.length || loading} onClick={() => void clearAll()}>
              清空
            </Button>
          </>
        }
      />

      {error ? <div className="mb-4 rounded-lg border border-danger-soft bg-danger-soft p-3 text-sm text-danger">{error}</div> : null}

      {entries.length ? (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface text-text-primary shadow-sm dark:bg-surface">
          <div className="max-h-[calc(100vh-190px)] overflow-auto">
            {entries.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                onDelete={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<HistoryIcon size={22} />}
          title="没有历史记录"
          description="完成一次翻译、OCR 或 AI 回复后，记录会显示在这里。"
        />
      )}
    </>
  );
}

function HistoryRow({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  return (
    <div className="group grid min-h-[44px] grid-cols-1 items-center gap-3 border-b border-border-subtle px-4 py-2 text-sm last:border-b-0 hover:bg-surface-hover lg:grid-cols-[28px_minmax(0,1fr)_92px_minmax(0,1fr)_150px_32px]">
      <div className="hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-hover text-xs font-semibold text-text-primary lg:grid">
        {serviceMark(entry.serviceName)}
      </div>
      <button
        type="button"
        className="min-w-0 truncate text-left font-medium text-text-primary"
        title={entry.sourceText}
        onClick={() => void navigator.clipboard?.writeText(entry.sourceText)}
      >
        {entry.sourceText}
      </button>
      <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
        <span>{languageMark(entry.sourceLanguage)}</span>
        <span className="text-text-muted">→</span>
        <span>{languageMark(entry.targetLanguage)}</span>
      </div>
      <button
        type="button"
        className="min-w-0 truncate text-left font-semibold text-text-primary"
        title={entry.resultText}
        onClick={() => void navigator.clipboard?.writeText(entry.resultText)}
      >
        {entry.resultText}
      </button>
      <div className="whitespace-nowrap text-xs font-medium text-text-secondary">{formatDate(entry.createdAt)}</div>
      <button
        type="button"
        aria-label="删除记录"
        title="删除记录"
        className="grid h-8 w-8 place-items-center rounded-full text-text-muted opacity-100 transition hover:bg-danger-soft hover:text-danger lg:opacity-0 lg:group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function serviceMark(serviceName: string) {
  const normalized = serviceName.trim();
  if (!normalized) return "AI";
  if (normalized.toLowerCase().includes("google")) return "G";
  if (normalized.toLowerCase().includes("bing")) return "B";
  return normalized.slice(0, 2).toUpperCase();
}

function languageMark(language: string) {
  const normalized = language.toLowerCase();
  if (normalized.startsWith("zh") || normalized.includes("chinese")) return "🇨🇳";
  if (normalized.startsWith("en") || normalized.includes("english")) return "🇬🇧";
  if (normalized.startsWith("ja") || normalized.includes("japanese")) return "🇯🇵";
  if (normalized.startsWith("ko") || normalized.includes("korean")) return "🇰🇷";
  if (normalized.startsWith("fr")) return "FR";
  if (normalized.startsWith("de")) return "DE";
  if (normalized.startsWith("es")) return "ES";
  return language.toUpperCase();
}

function formatDate(value: string) {
  const numeric = Number(value);
  const date = Number.isFinite(numeric) && numeric > 0 ? new Date(numeric) : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
}
