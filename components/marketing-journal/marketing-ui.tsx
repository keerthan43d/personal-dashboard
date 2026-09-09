"use client";
import Link from "next/link";
import { Repeat, Database, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNING_TYPE } from "./marketing-helpers";
import type { MktClient, MktLearning } from "@/lib/db/marketing-repository";

// ─── Numbered section header (mirrors the MMA Journal) ────────────
export function SectionHead({ index, title, meta, children }: {
  index: string; title: string; meta?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-black tabular-nums text-[#FFD600] font-numeric">{index}</span>
      <h2 className="text-[13px] font-black uppercase tracking-[0.16em] text-white whitespace-nowrap">{title}</h2>
      {meta && <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 whitespace-nowrap hidden sm:block">{meta}</span>}
      <div className="flex-1 h-px bg-white/10" />
      {children}
    </div>
  );
}

// ─── Coloured status / verdict pill ───────────────────────────────
export function Pill({ label, color, solid }: { label: string; color: string; solid?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 border"
      style={solid
        ? { background: color, color: "#0a0a0a", borderColor: color }
        : { color, borderColor: `${color}55`, background: `${color}14` }}>
      <i className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Client avatar: logo, else coloured initial ───────────────────
export function ClientAvatar({ client, size = "md" }: { client: Pick<MktClient, "name" | "color" | "logoUrl">; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14 text-2xl" : size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-lg";
  const color = client.color ?? "#FFD600";
  if (client.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={client.logoUrl} alt={client.name}
        className={cn(dim, "object-cover flex-shrink-0 border border-white/10")}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <div className={cn(dim, "flex items-center justify-center font-black flex-shrink-0")}
      style={{ background: `${color}1f`, color, border: `1px solid ${color}44` }}>
      {client.name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── A single result metric — renders nothing when value is null ──
export function Metric({ label, value, accent }: { label: string; value: string | null; accent?: string }) {
  if (value === null) return null;
  return (
    <div>
      <div className="text-xl font-black tabular-nums leading-none font-numeric" style={{ color: accent ?? "#fff" }}>
        {value}
      </div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/35">{label}</div>
    </div>
  );
}

// ─── Learning card (campaign detail + lessons library) ────────────
export function LearningCard({ learning, context, onEdit, onRemove }: {
  learning: MktLearning;
  context?: { clientId: string; clientName: string; campaignName: string };
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const t = LEARNING_TYPE[learning.type];
  return (
    <div className="group relative flex border border-white/12 bg-[#080808] hover:border-white/25 transition-colors duration-150">
      <div className="w-1 flex-shrink-0" style={{ background: t.color }} />
      <div className="flex-1 p-3.5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: t.color }}>
                {t.label}
              </span>
              {learning.repeat && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6BD98A]">
                  <Repeat className="w-2.5 h-2.5" strokeWidth={3} /> Repeat
                </span>
              )}
              {context && (
                <Link href={`/marketing-journal/client/${context.clientId}`}
                  className="text-[9px] font-black uppercase tracking-[0.1em] text-white/30 hover:text-[#FFD600] transition-colors truncate">
                  {context.clientName} · {context.campaignName}
                </Link>
              )}
            </div>
            <p className="text-[13px] text-white/85 leading-relaxed mt-1.5 whitespace-pre-wrap">{learning.lesson}</p>
            {learning.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {learning.tags.map((tag) => (
                  <span key={tag} className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/45 border border-white/10 px-1.5 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {(onEdit || onRemove) && (
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {onEdit && <IconBtn onClick={onEdit} title="Edit"><Pencil className="w-3.5 h-3.5" /></IconBtn>}
              {onRemove && <IconBtn onClick={onRemove} title="Delete" danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small icon button (shared) ───────────────────────────────────
export function IconBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn(
        "w-7 h-7 flex items-center justify-center border border-white/12 bg-transparent transition-colors duration-150 cursor-pointer",
        danger ? "text-white/70 hover:text-white hover:bg-[#E60012] hover:border-[#E60012]"
               : "text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600]")}>
      {children}
    </button>
  );
}

// ─── Migration-not-applied state ──────────────────────────────────
export function MigrationNeeded() {
  return (
    <div className="border border-[#E60012]/30 bg-[#E60012]/5 p-5 text-center">
      <Database className="w-6 h-6 mx-auto text-[#E60012] mb-3" />
      <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white">Database not ready</p>
      <p className="mt-2 text-[11px] text-white/55 leading-relaxed max-w-md mx-auto">
        The Marketing Journal tables don&apos;t exist yet. Apply
        <span className="text-[#FFD600] font-mono"> supabase/migrations/0014_marketing_journal.sql </span>
        in your Supabase SQL editor, then reload this page.
      </p>
    </div>
  );
}
