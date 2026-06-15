"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, Plus, Trash2, Loader2, BookOpen,
  Globe, FileText, ClipboardPaste, ChevronRight, Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

type MarketingGod = {
  id: string;
  name: string;
  title: string;
  tagline: string | null;
  avatarUrl: string | null;
  systemInstructions: string;
  createdAt: string;
  sourceCount: number;
};

function GodCard({ god, onDelete, onClick }: {
  god: MarketingGod;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="group relative border border-white/10 bg-[#0c0c0c] hover:border-[#FFD600]/40 transition-colors duration-200 cursor-pointer flex flex-col overflow-hidden"
      onClick={() => !confirming && onClick(god.id)}
    >
      {/* ── Portrait ── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-white/[0.04] to-transparent">
        {god.avatarUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={god.avatarUrl}
            alt={god.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-500 ease-out"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-black text-[#FFD600]/20 group-hover:text-[#FFD600]/40 transition-colors duration-300">
              {god.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Bottom gradient so name is readable over any image */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/80 to-transparent" />

        {/* Name overlaid on portrait */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[15px] font-black tracking-[0.06em] uppercase text-white leading-tight drop-shadow group-hover:text-[#FFD600] transition-colors duration-200">
            {god.name}
          </p>
          {god.title && (
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#FFD600]/80 mt-1">
              {god.title}
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirming) { onDelete(god.id); }
            else { setConfirming(true); setTimeout(() => setConfirming(false), 3000); }
          }}
          className={cn(
            "absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center transition-all duration-150 z-10 backdrop-blur-sm",
            confirming
              ? "bg-red-500/30 border border-red-500/50 text-red-300 opacity-100"
              : "bg-black/40 text-white/60 hover:text-red-400 hover:bg-black/70 opacity-0 group-hover:opacity-100"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {confirming && (
          <div className="absolute top-3 right-11 text-[9px] font-black tracking-[0.1em] uppercase text-red-300 whitespace-nowrap bg-black/60 backdrop-blur-sm px-1.5 py-1 z-10" onClick={(e) => e.stopPropagation()}>
            CONFIRM?
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 flex flex-col gap-2 flex-1">
        {god.tagline && (
          <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2 italic">
            “{god.tagline}”
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.12em] uppercase text-white/35">
            <BookOpen className="w-3 h-3" />
            {god.sourceCount} {god.sourceCount === 1 ? "SOURCE" : "SOURCES"}
          </span>
          <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.14em] uppercase text-[#FFD600]/0 group-hover:text-[#FFD600] transition-colors duration-200">
            CONSULT <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Two-step creation dialog ──────────────────────────────────

const BLANK = { name: "", title: "", tagline: "", avatarUrl: "", systemInstructions: "" };

type Step = "identity" | "sources";

function CreateGodDialog({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (god: MarketingGod) => void;
}) {
  const [step, setStep] = useState<Step>("identity");
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [createdGod, setCreatedGod] = useState<MarketingGod | null>(null);

  // Source add state
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [resTopic, setResTopic] = useState("");
  const [resResult, setResResult] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [researching, setResearching] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [sourcesAdded, setSourcesAdded] = useState(0);

  function resetDialog() {
    setStep("identity");
    setForm(BLANK);
    setCreatedGod(null);
    setPasteTitle(""); setPasteContent("");
    setFileTitle(""); setFileContent(""); setFileName("");
    setResTopic(""); setResResult(""); setResTitle("");
    setSourcesAdded(0);
  }

  function handleClose() {
    if (createdGod) onCreated({ ...createdGod, sourceCount: sourcesAdded });
    resetDialog();
    onClose();
  }

  async function handleCreateGod(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/gods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { god: MarketingGod; error?: string };
      if (data.error) throw new Error(data.error);
      setCreatedGod(data.god);
      setStep("sources");
      toast.success(`${data.god.name} created — add their source material below`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function addSource(title: string, kind: "paste" | "file" | "web", content: string) {
    if (!createdGod) return;
    const res = await fetch(`/api/gods/${createdGod.id}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, kind, content }),
    });
    if (!res.ok) throw new Error("Failed to add source");
    setSourcesAdded((n) => n + 1);
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) { toast.error("Title and content required"); return; }
    setAddingSource(true);
    try {
      await addSource(pasteTitle, "paste", pasteContent);
      setPasteTitle(""); setPasteContent("");
      toast.success("Source added + embedded");
    } catch { toast.error("Failed to add source"); }
    finally { setAddingSource(false); }
  }

  async function handleFile(e: React.FormEvent) {
    e.preventDefault();
    if (!fileTitle.trim() || !fileContent.trim()) { toast.error("Title and file required"); return; }
    setAddingSource(true);
    try {
      await addSource(fileTitle, "file", fileContent);
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

  async function handleResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!createdGod) return;
    setResearching(true); setResResult("");
    try {
      const res = await fetch(`/api/gods/${createdGod.id}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ godName: createdGod.name, topic: resTopic }),
      });
      const data = await res.json() as { research?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setResResult(data.research ?? "");
      setResTitle(`${createdGod.name}${resTopic ? ` — ${resTopic}` : " — Biography & Philosophy"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Research failed");
    } finally { setResearching(false); }
  }

  async function handleSaveResearch() {
    if (!resResult || !resTitle) return;
    setAddingSource(true);
    try {
      await addSource(resTitle, "web", resResult);
      setResTopic(""); setResResult(""); setResTitle("");
      toast.success("Research saved + embedded");
    } catch { toast.error("Failed to save"); }
    finally { setAddingSource(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="bg-black border border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("flex items-center gap-1.5 text-[9px] font-black tracking-[0.12em] uppercase", step === "identity" ? "text-[#FFD600]" : "text-white/30")}>
            <span className={cn("w-5 h-5 flex items-center justify-center border text-[8px]", step === "identity" ? "border-[#FFD600] text-[#FFD600]" : "border-white/20 text-white/30")}>
              {step === "sources" ? <Check className="w-3 h-3" /> : "1"}
            </span>
            IDENTITY
          </div>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <div className={cn("flex items-center gap-1.5 text-[9px] font-black tracking-[0.12em] uppercase", step === "sources" ? "text-[#FFD600]" : "text-white/30")}>
            <span className={cn("w-5 h-5 flex items-center justify-center border text-[8px]", step === "sources" ? "border-[#FFD600] text-[#FFD600]" : "border-white/20 text-white/30")}>
              2
            </span>
            SOURCES
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-[12px] font-black tracking-[0.15em] uppercase text-[#FFD600]">
            {step === "identity" ? "ADD A MARKETING GOD" : `ADD SOURCES FOR ${createdGod?.name?.toUpperCase()}`}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Identity ── */}
        {step === "identity" && (
          <form onSubmit={handleCreateGod} className="flex flex-col gap-4 mt-2">
            <div>
              <label className="block text-[9px] font-black tracking-[0.12em] uppercase text-white/40 mb-1.5">NAME *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="David Ogilvy"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[12px]"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-black tracking-[0.12em] uppercase text-white/40 mb-1.5">TITLE</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Father of Advertising"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[12px]"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black tracking-[0.12em] uppercase text-white/40 mb-1.5">TAGLINE</label>
              <Input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Research first. Sell always."
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[12px]"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black tracking-[0.12em] uppercase text-white/40 mb-1.5">
                IMAGE URL
              </label>
              <div className="flex gap-2 items-start">
                <Input
                  value={form.avatarUrl}
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://… paste any image link"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[11px]"
                />
                {form.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatarUrl}
                    alt="preview"
                    className="w-9 h-9 object-cover border border-white/20 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                  />
                )}
              </div>
              <p className="text-[9px] text-white/25 mt-1">Paste any public image URL — Wikipedia, Wikimedia, etc.</p>
            </div>

            <div>
              <label className="block text-[9px] font-black tracking-[0.12em] uppercase text-white/40 mb-1.5">PERSONA INSTRUCTIONS</label>
              <Textarea
                value={form.systemInstructions}
                onChange={(e) => setForm((f) => ({ ...f, systemInstructions: e.target.value }))}
                placeholder={`How should this person speak and think?\n\nExample: You believe research is the foundation of all great advertising. You speak plainly and directly. You have strong opinions and don't hedge...`}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 text-[12px] resize-none min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => { resetDialog(); onClose(); }} className="text-[10px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white px-3 h-8">
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 h-8 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {saving ? "CREATING..." : "NEXT: ADD SOURCES"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Sources ── */}
        {step === "sources" && (
          <div className="mt-2 flex flex-col gap-4">
            {sourcesAdded > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black tracking-[0.1em] uppercase text-emerald-400">
                  {sourcesAdded} SOURCE{sourcesAdded > 1 ? "S" : ""} EMBEDDED
                </span>
              </div>
            )}

            <Tabs defaultValue="paste">
              <TabsList className="bg-transparent border border-white/8 rounded-none h-8 gap-0 w-full p-0">
                {(["paste", "upload", "research"] as const).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="flex-1 text-[9px] font-black tracking-[0.1em] uppercase data-[state=active]:text-black data-[state=active]:bg-[#FFD600] rounded-none h-8"
                  >
                    {t === "paste" ? "PASTE TEXT" : t === "upload" ? "PDF / TXT" : "AI RESEARCH"}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Paste */}
              <TabsContent value="paste" className="mt-3">
                <form onSubmit={handlePaste} className="flex flex-col gap-2.5">
                  <Input
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="Source title (e.g. Confessions of an Advertising Man)"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[11px]"
                  />
                  <Textarea
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder="Paste book excerpts, essays, interviews, ad copy, quotes…"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 text-[11px] resize-none min-h-[160px]"
                  />
                  <button type="submit" disabled={addingSource} className="w-full h-9 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {addingSource ? "EMBEDDING..." : "ADD + EMBED"}
                  </button>
                </form>
              </TabsContent>

              {/* File */}
              <TabsContent value="upload" className="mt-3">
                <form onSubmit={handleFile} className="flex flex-col gap-2.5">
                  <label className="flex flex-col items-center justify-center gap-2 h-20 border border-dashed border-white/15 hover:border-[#FFD600]/30 cursor-pointer transition-colors">
                    {parsingPdf
                      ? <Loader2 className="w-5 h-5 text-[#FFD600] animate-spin" />
                      : <FileText className="w-5 h-5 text-white/30" />}
                    <span className="text-[10px] text-white/40">
                      {parsingPdf ? "Parsing PDF…" : fileName || "Click to select a .pdf or .txt file"}
                    </span>
                    <input type="file" accept=".pdf,.txt" onChange={handleFileChange} className="hidden" disabled={parsingPdf} />
                  </label>
                  <Input
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="Source title"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[11px]"
                  />
                  <button type="submit" disabled={addingSource || parsingPdf || !fileContent} className="w-full h-9 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {addingSource ? "EMBEDDING..." : "ADD + EMBED"}
                  </button>
                </form>
              </TabsContent>

              {/* Research */}
              <TabsContent value="research" className="mt-3">
                <form onSubmit={handleResearch} className="flex flex-col gap-2.5">
                  <Input
                    value={resTopic}
                    onChange={(e) => setResTopic(e.target.value)}
                    placeholder={`Topic (optional — blank = full bio + philosophy)`}
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[11px]"
                  />
                  <button type="submit" disabled={researching} className="w-full h-9 border border-[#FFD600]/30 text-[#FFD600] text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/5 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {researching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                    {researching ? "RESEARCHING THE WEB..." : "RESEARCH WITH AI"}
                  </button>
                </form>

                {resResult && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="border border-white/8 bg-white/[0.02] p-3 max-h-40 overflow-y-auto">
                      <p className="text-[10px] text-white/55 leading-relaxed whitespace-pre-wrap">{resResult}</p>
                    </div>
                    <Input
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      placeholder="Save as…"
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#FFD600]/40 h-9 text-[11px]"
                    />
                    <button onClick={handleSaveResearch} disabled={addingSource} className="w-full h-9 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {addingSource ? "EMBEDDING..." : "SAVE + EMBED"}
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-between pt-2 border-t border-white/8 mt-1">
              <p className="text-[9px] text-white/30 self-center">You can also add sources anytime from the chat page</p>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 px-4 h-8 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90"
              >
                <Check className="w-3.5 h-3.5" />
                DONE
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function GodsPage() {
  const router = useRouter();
  const [gods, setGods] = useState<MarketingGod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetchGods(); }, []);

  async function fetchGods() {
    setLoading(true);
    try {
      const res = await fetch("/api/gods");
      const data = await res.json() as { gods: MarketingGod[] };
      setGods(data.gods ?? []);
    } catch { toast.error("Failed to load Gods of Marketing"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    const god = gods.find((g) => g.id === id);
    try {
      await fetch(`/api/gods/${id}`, { method: "DELETE" });
      setGods((prev) => prev.filter((g) => g.id !== id));
      toast.success(`${god?.name ?? "God"} removed`);
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <Topbar
        title="GODS OF MARKETING"
        subtitle="YOUR PERSONAL PANTHEON OF MARKETING LEGENDS"
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW GOD
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#FFD600] animate-spin" />
                <p className="text-[10px] font-black tracking-[0.14em] uppercase text-white/30">SUMMONING THE GODS</p>
              </div>
            </div>
          ) : gods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-16 h-16 flex items-center justify-center border border-white/10">
                <Crown className="w-7 h-7 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-black tracking-[0.12em] uppercase text-white/40">THE PANTHEON IS EMPTY</p>
                <p className="text-[11px] text-white/25 mt-1">Add your first marketing legend to begin</p>
              </div>
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 border border-[#FFD600]/40 text-[#FFD600] text-[10px] font-black tracking-[0.12em] uppercase hover:bg-[#FFD600]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD YOUR FIRST GOD
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              <AnimatePresence>
                {gods.map((god) => (
                  <GodCard key={god.id} god={god} onDelete={handleDelete} onClick={(id) => router.push(`/gods/${id}`)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <CreateGodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(god) => setGods((prev) => [...prev, god])}
      />
    </div>
  );
}
