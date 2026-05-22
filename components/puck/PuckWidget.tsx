"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, ChevronDown } from "lucide-react";
import { repo } from "@/lib/db";
import { buildDataContext, type PuckDataContext } from "@/lib/puck/context-builder";

const PUCK_IMG = "https://i1-e.pinimg.com/736x/01/ff/93/01ff93fa48499c9d0bfe90ea101fe9b0.jpg";
const MEMORY_KEY = "puck_memory_docs";
const MEMORY_MAX = 12; // keep last 12 weeks

interface MemoryDoc {
  weekStart:   string;
  content:     string;
  generatedAt: string;
}

interface Message {
  role:    "user" | "assistant";
  content: string;
}

function getThisWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function loadMemoryDocs(): MemoryDoc[] {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveMemoryDocs(docs: MemoryDoc[]) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(docs.slice(-MEMORY_MAX)));
}

function formatMemoryDocs(docs: MemoryDoc[]): string {
  if (!docs.length) return "";
  return docs
    .slice(-8)
    .map(d => `[Week of ${d.weekStart}]\n${d.content}`)
    .join("\n\n");
}

export function PuckWidget() {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [dataLoaded,  setDataLoaded]  = useState(false);
  const [imgError,    setImgError]    = useState(false);
  const [pulse,       setPulse]       = useState(false);

  const dataCtxRef    = useRef<string>("");
  const memoryDocsRef = useRef<MemoryDoc[]>([]);
  const bottomRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  // Load all dashboard data once
  const loadData = useCallback(async () => {
    if (dataLoaded) return;
    try {
      const [
        entries, problems, movies, tvShows, books,
        clients, projects, tasks, timeLogs, habits, shipLogs,
      ] = await Promise.all([
        repo.listJournalEntries(),
        repo.listProblemLogs(),
        repo.listMovies(),
        repo.listTvShows(),
        repo.listBooks(),
        repo.listClients(),
        repo.listProjects(),
        repo.listTasks(),
        repo.listTimeLogs(),
        repo.listJournalHabits(),
        repo.listShipLogs(),
      ]);

      const ctx: PuckDataContext = {
        entries, problems, movies, tvShows, books,
        clients, projects, tasks, timeLogs, habits, shipLogs,
      };
      dataCtxRef.current = buildDataContext(ctx);
      setDataLoaded(true);

      // Check if memory doc is stale (older than 7 days or missing for this week)
      const docs = loadMemoryDocs();
      memoryDocsRef.current = docs;
      const weekStart = getThisWeekStart();
      const hasThisWeek = docs.some(d => d.weekStart === weekStart);

      if (!hasThisWeek && dataCtxRef.current) {
        generateMemoryDoc(weekStart, dataCtxRef.current, docs);
      }
    } catch (err) {
      console.error("[Puck] failed to load data:", err);
    }
  }, [dataLoaded]);

  async function generateMemoryDoc(weekStart: string, dataContext: string, existingDocs: MemoryDoc[]) {
    try {
      const res = await fetch("/api/puck/memory", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dataContext, weekStart }),
      });
      if (!res.ok) return;
      const { doc } = await res.json();
      if (!doc) return;
      const newDoc: MemoryDoc = { weekStart, content: doc, generatedAt: new Date().toISOString() };
      const updated = [...existingDocs.filter(d => d.weekStart !== weekStart), newDoc];
      memoryDocsRef.current = updated;
      saveMemoryDocs(updated);
    } catch {
      // silent fail — memory is bonus, not critical
    }
  }

  // Open panel
  function handleOpen() {
    setOpen(true);
    loadData();
    if (messages.length === 0) {
      setMessages([{
        role:    "assistant",
        content: "Hmph! You finally showed up. I've been sitting on your shoulder this whole time, y'know. What do you want, big dummy? I'm ready to dig through all your data — movies, habits, journal, work... ask me anything!",
      }]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Pulse button when not open (subtle attention)
  useEffect(() => {
    if (open) return;
    const id = setInterval(() => {
      setPulse(p => !p);
    }, 4000);
    return () => clearInterval(id);
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0);
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/puck/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:    text,
          history:    history.slice(-10),
          dataContext: dataCtxRef.current,
          memoryDocs: formatMemoryDocs(memoryDocsRef.current),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages(prev => [...prev, { role: "assistant", content: `Waaah! Something broke! "${err}" — this is SO not my fault.` }]);
        return;
      }

      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: reply ?? "..." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Eeeek! Connection died. That's not on me, I swear. Try again?" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="Open Puck chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD600]"
        style={{
          boxShadow: pulse && !open
            ? "0 0 0 4px rgba(255,214,0,0.35), 0 0 20px rgba(255,214,0,0.2)"
            : "0 0 0 2px rgba(255,214,0,0.6), 0 4px 20px rgba(0,0,0,0.5)",
          transition: "box-shadow 1.5s ease",
        }}
      >
        {imgError ? (
          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[#FFD600] font-black text-xl">
            P
          </div>
        ) : (
          <img
            src={PUCK_IMG}
            alt="Puck"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col"
          style={{
            width:        "360px",
            height:       "500px",
            background:   "rgba(14,14,14,0.97)",
            border:       "1px solid rgba(255,214,0,0.2)",
            borderRadius: "16px",
            backdropFilter: "blur(20px)",
            boxShadow:    "0 0 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,214,0,0.08)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: "1.5px solid rgba(255,214,0,0.5)" }}>
              {imgError ? (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[#FFD600] font-black text-sm">P</div>
              ) : (
                <img src={PUCK_IMG} alt="Puck" className="w-full h-full object-cover" onError={() => setImgError(true)} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-sm tracking-wide">PUCK</div>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">
                {dataLoaded ? "Fully loaded — ask me anything" : "Loading your data…"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/30 hover:text-white/70 transition-colors cursor-pointer p-1"
              aria-label="Close"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1">
                    {imgError ? (
                      <div className="w-full h-full bg-[#222] flex items-center justify-center text-[#FFD600] text-[9px] font-black">P</div>
                    ) : (
                      <img src={PUCK_IMG} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
                <div
                  className="max-w-[78%] text-sm leading-relaxed"
                  style={{
                    padding:      "8px 12px",
                    borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background:   msg.role === "user"
                      ? "rgba(255,214,0,0.12)"
                      : "rgba(255,255,255,0.05)",
                    border: msg.role === "user"
                      ? "1px solid rgba(255,214,0,0.2)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color:        msg.role === "user" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.75)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1">
                  {imgError ? (
                    <div className="w-full h-full bg-[#222] flex items-center justify-center text-[#FFD600] text-[9px] font-black">P</div>
                  ) : (
                    <img src={PUCK_IMG} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px 12px 12px 2px" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask Puck anything…"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 focus:outline-none disabled:opacity-50"
              style={{ padding: "6px 2px" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
              style={{ background: "rgba(255,214,0,0.9)" }}
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                : <Send className="w-3.5 h-3.5 text-black" />
              }
            </button>
          </div>
        </div>
      )}
    </>
  );
}
