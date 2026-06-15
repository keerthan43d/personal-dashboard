"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Send, Loader2, Plus, Trash2, Globe,
  FileText, ClipboardPaste, RefreshCw, PanelRight, X, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MarketingGod = {
  id: string;
  name: string;
  title: string;
  tagline: string | null;
  avatarUrl: string | null;
  systemInstructions: string;
};

type GodSource = {
  id: string;
  godId: string;
  kind: "paste" | "file" | "web";
  title: string;
  createdAt: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function GodAvatar({ god, size = "sm" }: { god: Pick<MarketingGod, "name" | "avatarUrl">; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  if (god.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={god.avatarUrl} alt={god.name} className={cn(dim, "object-cover border border-[#FFD600]/20 flex-shrink-0")}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <div className={cn(dim, "flex items-center justify-center bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] font-black flex-shrink-0")}>
      {god.name.charAt(0).toUpperCase()}
    </div>
  );
}

const KIND_ICON = {
  paste: <ClipboardPaste className="w-3 h-3" />,
  file: <FileText className="w-3 h-3" />,
  web: <Globe className="w-3 h-3" />,
};

const KIND_LABEL = { paste: "PASTE", file: "FILE", web: "WEB" };

function SourceItem({
  source,
  onDelete,
}: {
  source: GodSource;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 border-b border-white/5 group hover:bg-white/[0.02]">
      <span className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black tracking-[0.1em] flex-shrink-0 mt-0.5",
        source.kind === "web" ? "bg-blue-500/15 text-blue-400" :
        source.kind === "file" ? "bg-emerald-500/15 text-emerald-400" :
        "bg-amber-500/15 text-amber-400"
      )}>
        {KIND_ICON[source.kind]}
        {KIND_LABEL[source.kind]}
      </span>
      <p className="flex-1 text-[11px] text-white/60 leading-snug min-w-0 truncate">
        {source.title}
      </p>
      <button
        onClick={() => {
          if (confirming) {
            onDelete(source.id);
          } else {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 3000);
          }
        }}
        className={cn(
          "flex-shrink-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
          confirming ? "text-red-400" : "text-white/30 hover:text-red-400"
        )}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function GodChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [god, setGod] = useState<MarketingGod | null>(null);
  const [sources, setSources] = useState<GodSource[]>([]);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [panelOpen, setPanelOpen] = useState(true);

  // Source add form state
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [resTopic, setResTopic] = useState("");
  const [resResult, setResResult] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [researching, setResearching] = useState(false);

  useEffect(() => {
    fetchGod();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchGod() {
    setLoading(true);
    try {
      const res = await fetch(`/api/gods/${id}`);
      if (!res.ok) { router.push("/gods"); return; }
      const data = await res.json() as { god: MarketingGod; sources: GodSource[] };
      setGod(data.god);
      setSources(data.sources ?? []);
      // Seed the opening message
      setMessages([{
        role: "assistant",
        content: `I am ${data.god.name}${data.god.title ? `, the ${data.god.title}` : ""}. Ask me anything.`,
      }]);
    } catch {
      toast.error("Failed to load persona");
      router.push("/gods");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/gods/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-12),
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMsg.content);
    } finally {
      setSending(false);
    }
  }

  async function addPasteSource(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) { toast.error("Title and content required"); return; }
    setAddingSource(true);
    try {
      const res = await fetch(`/api/gods/${id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pasteTitle, kind: "paste", content: pasteContent }),
      });
      const data = await res.json() as { source: GodSource };
      setSources((prev) => [...prev, data.source]);
      setPasteTitle(""); setPasteContent("");
      toast.success("Source added + embedded");
    } catch { toast.error("Failed to add source"); }
    finally { setAddingSource(false); }
  }

  async function addFileSource(e: React.FormEvent) {
    e.preventDefault();
    if (!fileTitle.trim() || !fileContent.trim()) { toast.error("Title and file content required"); return; }
    setAddingSource(true);
    try {
      const res = await fetch(`/api/gods/${id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fileTitle, kind: "file", content: fileContent }),
      });
      const data = await res.json() as { source: GodSource };
      setSources((prev) => [...prev, data.source]);
      setFileTitle(""); setFileContent(""); setFileName("");
      toast.success("File embedded as source");
    } catch { toast.error("Failed to add source"); }
    finally { setAddingSource(false); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!fileTitle) setFileTitle(file.name.replace(/\.[^.]+$/, ""));

    if (file.name.toLowerCase().endsWith(".pdf")) {
      setParsingPdf(true);
      setFileContent("");
      try {
        const { extractPdfText } = await import("@/lib/gods/pdf-client");
        const { text, pages } = await extractPdfText(file);
        if (!text) throw new Error("No text found (PDF may be scanned/image-only)");
        setFileContent(text);
        toast.success(`PDF parsed — ${pages} page${pages > 1 ? "s" : ""} extracted`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "PDF parse failed");
      } finally {
        setParsingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setFileContent(ev.target?.result as string ?? "");
      reader.readAsText(file);
    }
  }

  async function runResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!god) return;
    setResearching(true);
    setResResult("");
    try {
      const res = await fetch(`/api/gods/${id}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ godName: god.name, topic: resTopic }),
      });
      const data = await res.json() as { research?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setResResult(data.research ?? "");
      setResTitle(`${god.name}${resTopic ? ` — ${resTopic}` : " — Biography & Philosophy"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Research failed");
    } finally {
      setResearching(false);
    }
  }

  async function saveResearch() {
    if (!resResult || !resTitle) return;
    setAddingSource(true);
    try {
      const res = await fetch(`/api/gods/${id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: resTitle, kind: "web", content: resResult }),
      });
      const data = await res.json() as { source: GodSource };
      setSources((prev) => [...prev, data.source]);
      setResTopic(""); setResResult(""); setResTitle("");
      toast.success("Research saved + embedded");
    } catch { toast.error("Failed to save research"); }
    finally { setAddingSource(false); }
  }

  async function deleteSource(sourceId: string) {
    try {
      await fetch(`/api/gods/${id}/sources/${sourceId}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      toast.success("Source removed");
    } catch { toast.error("Failed to remove source"); }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-[#FFD600] animate-spin" />
          <p className="text-[10px] font-black tracking-[0.14em] uppercase text-white/30">
            CALLING THE ORACLE
          </p>
        </div>
      </div>
    );
  }

  if (!god) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-black px-4 flex-shrink-0">
        <button
          onClick={() => router.push("/gods")}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[9px] font-black tracking-[0.12em] uppercase">PANTHEON</span>
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <GodAvatar god={god} size="sm" />
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-[0.1em] uppercase text-white truncate">
              {god.name}
            </p>
            {god.title && (
              <p className="text-[9px] tracking-[0.1em] uppercase text-white/35 truncate">
                {god.title}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setPanelOpen((p) => !p)}
          className={cn(
            "flex items-center gap-1.5 h-7 px-2.5 text-[9px] font-black tracking-[0.1em] uppercase transition-all border",
            panelOpen
              ? "border-[#FFD600]/30 text-[#FFD600] bg-[#FFD600]/5"
              : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
          )}
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SOURCES</span>
          {sources.length > 0 && (
            <span className="bg-[#FFD600] text-black text-[8px] font-black w-4 h-4 flex items-center justify-center">
              {sources.length}
            </span>
          )}
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ── Chat ── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3 max-w-2xl",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  {msg.role === "assistant" && (
                    <GodAvatar god={god} size="sm" />
                  )}
                  <div
                    className={cn(
                      "px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-white/[0.06] border border-white/10 text-white/90"
                        : "bg-[#FFD600]/5 border border-[#FFD600]/15 text-white/85"
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 max-w-2xl"
              >
                <GodAvatar god={god} size="sm" />
                <div className="px-4 py-3 bg-[#FFD600]/5 border border-[#FFD600]/15 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#FFD600] animate-spin" />
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#FFD600]/60">
                    THINKING...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex-shrink-0 flex gap-2 px-4 py-3 border-t border-white/8"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${god.name} anything…`}
              disabled={sending}
              className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder:text-white/25 focus:border-[#FFD600]/40 focus:outline-none px-4 py-2.5 text-[13px] h-10 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-[#FFD600] text-black hover:bg-[#FFD600]/90 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        </div>

        {/* ── Sources Panel ── */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-shrink-0 border-l border-white/8 bg-black flex flex-col min-h-0 overflow-hidden"
              style={{ width: 300 }}
            >
              <div className="flex-shrink-0 px-3 py-3 border-b border-white/8 flex items-center justify-between">
                <p className="text-[9px] font-black tracking-[0.14em] uppercase text-white/40">
                  SOURCE MATERIAL
                </p>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-white/30 hover:text-white/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="sources" className="flex flex-col h-full">
                  <TabsList className="flex-shrink-0 bg-transparent border-b border-white/8 rounded-none h-9 px-3 gap-1">
                    <TabsTrigger
                      value="sources"
                      className="text-[9px] font-black tracking-[0.1em] uppercase data-[state=active]:text-[#FFD600] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#FFD600] rounded-none h-9 px-2"
                    >
                      SOURCES ({sources.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="add"
                      className="text-[9px] font-black tracking-[0.1em] uppercase data-[state=active]:text-[#FFD600] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#FFD600] rounded-none h-9 px-2"
                    >
                      + ADD
                    </TabsTrigger>
                  </TabsList>

                  {/* Sources list */}
                  <TabsContent value="sources" className="flex-1 overflow-y-auto mt-0">
                    {sources.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <BookOpen className="w-6 h-6 text-white/15" />
                        <p className="text-[10px] font-black tracking-[0.1em] uppercase text-white/20 text-center px-4">
                          NO SOURCES YET
                        </p>
                        <p className="text-[10px] text-white/25 text-center px-6">
                          Add books, essays, or research to ground {god.name}&apos;s answers
                        </p>
                      </div>
                    ) : (
                      sources.map((s) => (
                        <SourceItem key={s.id} source={s} onDelete={deleteSource} />
                      ))
                    )}
                  </TabsContent>

                  {/* Add source */}
                  <TabsContent value="add" className="flex-1 overflow-y-auto mt-0">
                    <Tabs defaultValue="paste" className="h-full">
                      <TabsList className="bg-transparent border-b border-white/5 rounded-none h-8 px-3 gap-1 w-full">
                        {(["paste", "upload", "research"] as const).map((t) => (
                          <TabsTrigger
                            key={t}
                            value={t}
                            className="text-[8px] font-black tracking-[0.1em] uppercase data-[state=active]:text-[#FFD600] data-[state=active]:bg-transparent rounded-none h-8 px-1.5 flex-1"
                          >
                            {t === "paste" ? "PASTE" : t === "upload" ? "PDF/TXT" : "RESEARCH"}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {/* Paste */}
                      <TabsContent value="paste" className="p-3">
                        <form onSubmit={addPasteSource} className="flex flex-col gap-2.5">
                          <div>
                            <label className="block text-[8px] font-black tracking-[0.12em] uppercase text-white/35 mb-1">
                              TITLE
                            </label>
                            <Input
                              value={pasteTitle}
                              onChange={(e) => setPasteTitle(e.target.value)}
                              placeholder="Confessions of an Advertising Man"
                              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-8 text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black tracking-[0.12em] uppercase text-white/35 mb-1">
                              CONTENT
                            </label>
                            <Textarea
                              value={pasteContent}
                              onChange={(e) => setPasteContent(e.target.value)}
                              placeholder="Paste book excerpts, essays, interviews, ad copy…"
                              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 text-[11px] resize-none min-h-[160px]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={addingSource}
                            className="w-full flex items-center justify-center gap-1.5 h-8 bg-[#FFD600] text-black text-[9px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 transition-colors"
                          >
                            {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            {addingSource ? "EMBEDDING..." : "ADD + EMBED"}
                          </button>
                        </form>
                      </TabsContent>

                      {/* File upload (.pdf / .txt) */}
                      <TabsContent value="upload" className="p-3">
                        <form onSubmit={addFileSource} className="flex flex-col gap-2.5">
                          <div>
                            <label className="block text-[8px] font-black tracking-[0.12em] uppercase text-white/35 mb-1">
                              FILE (PDF or TXT)
                            </label>
                            <label className="flex items-center justify-center gap-2 h-16 border border-dashed border-white/15 hover:border-[#FFD600]/30 cursor-pointer transition-colors">
                              {parsingPdf
                                ? <Loader2 className="w-4 h-4 text-[#FFD600] animate-spin" />
                                : <FileText className="w-4 h-4 text-white/30" />}
                              <span className="text-[10px] text-white/40">
                                {parsingPdf ? "Parsing PDF…" : fileName || "Click to select a .pdf or .txt file"}
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={parsingPdf}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block text-[8px] font-black tracking-[0.12em] uppercase text-white/35 mb-1">
                              TITLE
                            </label>
                            <Input
                              value={fileTitle}
                              onChange={(e) => setFileTitle(e.target.value)}
                              placeholder="Source title"
                              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-8 text-[11px]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={addingSource || parsingPdf || !fileContent}
                            className="w-full flex items-center justify-center gap-1.5 h-8 bg-[#FFD600] text-black text-[9px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 transition-colors"
                          >
                            {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            {addingSource ? "EMBEDDING..." : "ADD + EMBED"}
                          </button>
                        </form>
                      </TabsContent>

                      {/* Research (Perplexity) */}
                      <TabsContent value="research" className="p-3">
                        <form onSubmit={runResearch} className="flex flex-col gap-2.5">
                          <div>
                            <label className="block text-[8px] font-black tracking-[0.12em] uppercase text-white/35 mb-1">
                              TOPIC (optional)
                            </label>
                            <Input
                              value={resTopic}
                              onChange={(e) => setResTopic(e.target.value)}
                              placeholder={`${god.name}'s philosophy, campaigns…`}
                              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-8 text-[11px]"
                            />
                            <p className="text-[9px] text-white/25 mt-1">
                              Leave blank to research full biography + philosophy
                            </p>
                          </div>
                          <button
                            type="submit"
                            disabled={researching}
                            className="w-full flex items-center justify-center gap-1.5 h-8 border border-[#FFD600]/30 text-[#FFD600] text-[9px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/5 disabled:opacity-50 transition-colors"
                          >
                            {researching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                            {researching ? "RESEARCHING..." : "RESEARCH WITH AI"}
                          </button>
                        </form>

                        {resResult && (
                          <div className="mt-4 flex flex-col gap-2.5">
                            <div className="border border-white/8 bg-white/[0.02] p-3 max-h-48 overflow-y-auto">
                              <p className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap">
                                {resResult}
                              </p>
                            </div>
                            <div>
                              <label className="block text-[8px] font-black tracking-[0.12em] uppercase text-white/35 mb-1">
                                SAVE AS
                              </label>
                              <Input
                                value={resTitle}
                                onChange={(e) => setResTitle(e.target.value)}
                                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-8 text-[11px]"
                              />
                            </div>
                            <button
                              onClick={saveResearch}
                              disabled={addingSource}
                              className="w-full flex items-center justify-center gap-1.5 h-8 bg-[#FFD600] text-black text-[9px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 transition-colors"
                            >
                              {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              {addingSource ? "EMBEDDING..." : "SAVE + EMBED"}
                            </button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
