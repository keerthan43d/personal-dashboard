"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bot, Send, Loader2, Check, ChevronDown, Plus, Trash2,
  Sparkles, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ArenaModel = { id: string; name: string };
type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "cc_arena_models";

const DEFAULT_MODELS: ArenaModel[] = [
  { id: "poolside/laguna-xs-2.1:free", name: "Poolside: Laguna XS 2.1 (free)" },
];

function loadModels(): ArenaModel[] {
  if (typeof window === "undefined") return DEFAULT_MODELS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MODELS;
    const parsed = JSON.parse(raw) as ArenaModel[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
}

function saveModels(models: ArenaModel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch {
    /* ignore quota errors */
  }
}

// ── Model picker (Claude-style dropdown) ──────────────────────

function ModelPicker({
  models,
  selected,
  onSelect,
  onAdd,
  onRemove,
}: {
  models: ArenaModel[];
  selected: ArenaModel;
  onSelect: (m: ArenaModel) => void;
  onAdd: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  function submitAdd() {
    const id = newId.trim();
    if (!id) { toast.error("Paste an OpenRouter model ID"); return; }
    onAdd(id, newName.trim() || id);
    setNewId(""); setNewName(""); setAdding(false);
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setAdding(false); }}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 h-9 px-3 bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors max-w-full">
          <Bot className="w-4 h-4 text-[#FFD600] flex-shrink-0" />
          <span className="text-[12px] font-bold text-white truncate">{selected.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 bg-[#0c0c0c] border-none ring-1 ring-white/10 p-1.5 flex flex-col gap-0.5"
      >
        <p className="text-[9px] font-black tracking-[0.14em] uppercase text-white/30 px-2 py-1.5">
          MODELS
        </p>

        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
          {models.map((m) => {
            const active = m.id === selected.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors",
                  active ? "bg-[#FFD600]/10" : "hover:bg-white/[0.04]"
                )}
                onClick={() => { onSelect(m); setOpen(false); }}
              >
                <div className="w-4 flex-shrink-0 flex justify-center">
                  {active && <Check className="w-3.5 h-3.5 text-[#FFD600]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[12px] font-bold truncate", active ? "text-[#FFD600]" : "text-white")}>
                    {m.name}
                  </p>
                  <p className="text-[10px] text-white/35 font-mono truncate">{m.id}</p>
                </div>
                {models.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(m.id); }}
                    className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all flex-shrink-0"
                    aria-label="Remove model"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-px bg-white/8 my-1" />

        {adding ? (
          <div className="flex flex-col gap-2 p-2">
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="provider/model-id:free"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              className="h-8 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 text-[11px] font-mono"
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Display name (optional)"
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              className="h-8 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 text-[11px]"
            />
            <div className="flex gap-1.5">
              <button
                onClick={submitAdd}
                className="flex-1 h-7 bg-[#FFD600] text-black text-[9px] font-black tracking-[0.1em] uppercase hover:bg-[#FFD600]/90 flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> ADD
              </button>
              <button
                onClick={() => { setAdding(false); setNewId(""); setNewName(""); }}
                className="h-7 px-3 text-white/40 hover:text-white text-[9px] font-black tracking-[0.1em] uppercase"
              >
                CANCEL
              </button>
            </div>
            <p className="text-[9px] text-white/25 leading-relaxed">
              Paste any model ID from openrouter.ai/models — e.g. a <span className="text-white/40 font-mono">:free</span> model.
            </p>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-2 py-2 text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-4 flex justify-center"><Plus className="w-3.5 h-3.5" /></div>
            <span className="text-[11px] font-bold tracking-[0.04em] uppercase">Add a model</span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function LlmArenaPage() {
  const [models, setModels] = useState<ArenaModel[]>(DEFAULT_MODELS);
  const [selected, setSelected] = useState<ArenaModel>(DEFAULT_MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = loadModels();
    setModels(m);
    setSelected(m[0]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addModel(id: string, name: string) {
    if (models.some((m) => m.id === id)) {
      toast.info("That model is already added");
      const existing = models.find((m) => m.id === id)!;
      setSelected(existing);
      return;
    }
    const next = [...models, { id, name }];
    setModels(next);
    saveModels(next);
    setSelected({ id, name });
    toast.success(`Added ${name}`);
  }

  function removeModel(id: string) {
    const next = models.filter((m) => m.id !== id);
    setModels(next);
    saveModels(next);
    if (selected.id === id && next.length) setSelected(next[0]);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/arena/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selected.id, messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error ?? "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + text,
          };
          return next;
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get response");
      // drop the empty assistant bubble + restore the prompt
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMsg.content);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b border-white/10 bg-black px-4 h-14 flex-shrink-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Bot className="w-5 h-5 text-[#FFD600]" strokeWidth={1.75} />
          <div className="hidden sm:block">
            <p className="text-[11px] font-black tracking-[0.12em] uppercase text-white leading-none">LLM ARENA</p>
            <p className="text-[9px] tracking-[0.1em] uppercase text-white/35 mt-1">TEST ANY OPENROUTER MODEL</p>
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        <ModelPicker
          models={models}
          selected={selected}
          onSelect={setSelected}
          onAdd={addModel}
          onRemove={removeModel}
        />

        <div className="flex-1" />

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 h-8 px-2.5 text-[9px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> <span className="hidden sm:inline">NEW CHAT</span>
          </button>
        )}
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-14 h-14 flex items-center justify-center border border-white/10">
              <Sparkles className="w-6 h-6 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-black tracking-[0.1em] uppercase text-white/40">
                {selected.name}
              </p>
              <p className="text-[11px] text-white/25 mt-1 font-mono">{selected.id}</p>
              <p className="text-[11px] text-white/30 mt-3 max-w-xs">
                Ask anything to test this model. Switch or add models from the picker above.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 flex items-center justify-center bg-[#FFD600]/10 border border-[#FFD600]/20 flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-[#FFD600]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-white/[0.06] border border-white/10 text-white/90 max-w-[80%]"
                        : "bg-[#FFD600]/[0.04] border border-[#FFD600]/15 text-white/85 max-w-full flex-1"
                    )}
                  >
                    {msg.content || (
                      streaming && i === messages.length - 1 ? (
                        <span className="inline-flex items-center gap-2 text-[#FFD600]/60">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[10px] font-black tracking-[0.1em] uppercase">THINKING…</span>
                        </span>
                      ) : ""
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <form onSubmit={sendMessage} className="flex-shrink-0 border-t border-white/8 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${selected.name}…`}
            disabled={streaming}
            className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder:text-white/25 focus:border-[#FFD600]/40 focus:outline-none px-4 h-11 text-[13px] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="w-11 h-11 flex items-center justify-center bg-[#FFD600] text-black hover:bg-[#FFD600]/90 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
