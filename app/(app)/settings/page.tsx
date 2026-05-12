"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download, Upload, Trash2, Database, CloudOff,
  Info, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button }   from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Topbar }   from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { repo }     from "@/lib/db";
import { ExportSnapshotSchema } from "@/lib/db/schemas";

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [clearing,  setClearing]  = useState(false);

  async function handleExport() {
    try {
      const snapshot = await repo.exportAll();
      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `command-chamber-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Export failed");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text     = await file.text();
      const parsed   = JSON.parse(text);
      const snapshot = ExportSnapshotSchema.parse(parsed);
      const merge    = confirm(
        "Merge with existing data?\n\nOK = merge (keep existing + add imported)\nCancel = replace all data with import"
      );
      await repo.importAll(snapshot, merge);
      toast.success(`Import complete — ${snapshot.clients.length} clients, ${snapshot.books.length} books, ${snapshot.movies.length} movies`);
      window.location.reload();
    } catch (err) {
      toast.error("Import failed — invalid backup file");
      console.error(err);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleClearAll() {
    const confirmed = confirm(
      "⚠️ Delete ALL your data?\n\nThis permanently removes every client, project, book, and movie.\nThis cannot be undone. Export a backup first."
    );
    if (!confirmed) return;
    const double = confirm("Are you absolutely sure? All data will be lost.");
    if (!double) return;
    setClearing(true);
    try {
      await repo.clearAll();
      toast.success("All data cleared");
      window.location.reload();
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Data management & preferences" />

      <PageShell>
        <div className="max-w-xl mx-auto space-y-6">

          {/* ── Data export / import ───────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h2 className="font-display font-semibold text-[#f5f5f5] mb-1">Data Backup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your data lives in this browser. Export a backup before clearing data or switching devices.
            </p>

            <div className="rounded-xl border border-white/6 bg-[#111111] divide-y divide-white/5">
              {/* Export */}
              <div className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">Export Backup</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Download all data as a JSON file
                    </p>
                  </div>
                </div>
                <Button onClick={handleExport} variant="outline" size="sm"
                  className="border-emerald-800/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50 flex-shrink-0">
                  Export
                </Button>
              </div>

              {/* Import */}
              <div className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">Import Backup</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Restore from a previously exported JSON file
                    </p>
                  </div>
                </div>
                <div>
                  <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                  <Button onClick={() => fileRef.current?.click()} disabled={importing}
                    variant="outline" size="sm"
                    className="border-indigo-800/40 bg-indigo-950/30 text-indigo-400 hover:bg-indigo-950/50 flex-shrink-0">
                    {importing ? "Importing…" : "Import"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Supabase migration teaser ───────────────────── */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
            <h2 className="font-display font-semibold text-[#f5f5f5] mb-1">Cloud Sync</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Currently running local-only (IndexedDB). Cloud sync with Supabase keeps your data across devices.
            </p>

            <div className="rounded-xl border border-white/6 bg-[#111111] p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/25 flex items-center justify-center flex-shrink-0">
                  <CloudOff className="w-4 h-4 text-[#06b6d4]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f5f5f5]">Migrate to Supabase</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When ready: create a Supabase project, set <code className="text-[#06b6d4] bg-white/5 px-1 rounded text-[10px]">NEXT_PUBLIC_DB=supabase</code> in
                    {" "}<code className="text-[#06b6d4] bg-white/5 px-1 rounded text-[10px]">.env.local</code>, then run the migration script.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { step: "1", label: "Create Supabase project at supabase.com", done: false },
                  { step: "2", label: "Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local", done: false },
                  { step: "3", label: "Set NEXT_PUBLIC_DB=supabase in .env.local", done: false },
                  { step: "4", label: "Export backup above, then run migration script", done: false },
                ].map(({ step, label, done }) => (
                  <div key={step} className="flex items-center gap-2.5 text-muted-foreground">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-numeric ${
                      done ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400" : "border-white/10 text-zinc-600"
                    }`}>
                      {done ? "✓" : step}
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <Button disabled className="mt-4 w-full opacity-40 cursor-not-allowed" variant="outline">
                Coming soon — Cloud Sync
              </Button>
            </div>
          </motion.section>

          {/* ── Storage info ────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
            <div className="rounded-xl border border-white/5 bg-[#0d0d0d] p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Data is stored in your browser's IndexedDB (via Dexie). It persists across sessions and
                survives page refreshes. Clearing your browser's site data will erase it — always keep a backup.
              </p>
            </div>
          </motion.section>

          {/* ── Danger zone ─────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
            <h2 className="font-display font-semibold text-rose-400 mb-1">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Permanent and irreversible actions. Export a backup first.
            </p>

            <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">Clear All Data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete every client, project, book, and movie.
                    </p>
                  </div>
                </div>
                <Button onClick={handleClearAll} disabled={clearing} variant="outline" size="sm"
                  className="border-rose-800/40 bg-rose-950/30 text-rose-400 hover:bg-rose-950/60 flex-shrink-0">
                  {clearing ? "Clearing…" : "Clear All"}
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Version */}
          <p className="text-center text-[10px] text-muted-foreground/40 pb-4">
            Command Chamber · v0.1.0 · Local mode
          </p>
        </div>
      </PageShell>
    </>
  );
}
