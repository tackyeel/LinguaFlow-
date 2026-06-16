import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { Copy, Download, Heart, Search, Trash2 } from "lucide-react";
import { demoHistory } from "../../../constants/defaultConfig";
import type { HistoryEntry, HistoryType } from "../../../types/config";
import { Button } from "../../ui/Button";
import { Field, Section, SelectInput, TextInput } from "../../ui/Form";
import { PageHeader } from "./GeneralSettings";

type HistoryFilter = "all" | HistoryType;

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>(demoHistory);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<HistoryFilter>("all");
  const [language, setLanguage] = useState("all");
  const [service, setService] = useState("all");
  const [date, setDate] = useState("");

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const haystack = `${entry.sourceText} ${entry.resultText}`.toLowerCase();
        const matchesQuery = !query || haystack.includes(query.toLowerCase());
        const matchesType = type === "all" || entry.type === type;
        const matchesLanguage =
          language === "all" || entry.sourceLanguage === language || entry.targetLanguage === language;
        const matchesService = service === "all" || entry.serviceName === service;
        const matchesDate = !date || entry.createdAt.startsWith(date);
        return matchesQuery && matchesType && matchesLanguage && matchesService && matchesDate;
      }),
    [date, entries, language, query, service, type]
  );

  const services = Array.from(new Set(entries.map((entry) => entry.serviceName)));
  const languages = Array.from(new Set(entries.flatMap((entry) => [entry.sourceLanguage, entry.targetLanguage])));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filteredEntries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "linguaflow-history.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="历史记录" description="第一阶段使用本地假数据结构，字段已按 SQLite 后续落库预留。" />
      <Section title="筛选">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="搜索" alignTop>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
              <TextInput className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </Field>
          <Field label="类型筛选">
            <SelectInput value={type} onChange={(event) => setType(event.target.value as HistoryFilter)}>
              <option value="all">全部</option>
              <option value="translation">翻译</option>
              <option value="ocr">OCR</option>
              <option value="aiReply">AI 回复</option>
            </SelectInput>
          </Field>
          <Field label="语言筛选">
            <SelectInput value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="all">全部语言</option>
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="服务筛选">
            <SelectInput value={service} onChange={(event) => setService(event.target.value)}>
              <option value="all">全部服务</option>
              {services.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="日期筛选">
            <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-md border border-line/10 bg-panel2/50 p-3">
            <Button icon={<Download size={16} />} onClick={exportJson}>
              导出 JSON
            </Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setEntries([])}>
              清空历史
            </Button>
          </div>
        </div>
      </Section>

      <Section title="记录">
        <div className="grid gap-3">
          {filteredEntries.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} setEntries={setEntries} />
          ))}
          {filteredEntries.length === 0 ? <div className="rounded-md bg-panel2/50 p-6 text-center text-sm text-muted">没有匹配记录</div> : null}
        </div>
      </Section>
    </>
  );
}

function HistoryCard({
  entry,
  setEntries
}: {
  entry: HistoryEntry;
  setEntries: Dispatch<SetStateAction<HistoryEntry[]>>;
}) {
  const copy = (text: string) => void navigator.clipboard?.writeText(text);

  return (
    <article className="rounded-md border border-line/10 bg-panel2/50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="rounded-md bg-app px-2 py-1">{typeLabel(entry.type)}</span>
          <span>
            {entry.sourceLanguage} {"->"} {entry.targetLanguage}
          </span>
          <span>{entry.serviceName}</span>
          <span>{new Date(entry.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            icon={<Heart size={16} className={entry.isFavorite ? "fill-danger text-danger" : ""} />}
            title="收藏"
            onClick={() =>
              setEntries((current) =>
                current.map((item) => (item.id === entry.id ? { ...item, isFavorite: !item.isFavorite } : item))
              )
            }
          />
          <Button variant="ghost" icon={<Copy size={16} />} title="复制原文" onClick={() => copy(entry.sourceText)} />
          <Button variant="ghost" icon={<Copy size={16} />} title="复制译文" onClick={() => copy(entry.resultText)} />
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            title="删除"
            onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md bg-app p-3 text-sm leading-6 text-muted">{entry.sourceText}</div>
        <div className="rounded-md bg-app p-3 text-sm leading-6 text-text">{entry.resultText}</div>
      </div>
    </article>
  );
}

function typeLabel(type: HistoryType) {
  if (type === "translation") return "翻译";
  if (type === "ocr") return "OCR";
  return "AI 回复";
}
