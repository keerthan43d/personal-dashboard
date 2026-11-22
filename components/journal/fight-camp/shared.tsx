"use client";
/** Shared constants + tiny presentational helpers for the Fight Camp section. */
import { cn } from "@/lib/utils";

// ─── Palette (dark red / copper Command Chamber look) ─────────
export const RED = "#E60012";
export const COPPER = "#C57B4E";
export const GREEN = "#6BD98A";
export const AMBER = "#FFD600";
export const BLUE = "#4F9DFF";

export const FOCUS_OPTIONS = ["Striking", "Wrestling", "BJJ", "Sparring", "Conditioning"] as const;
export const MUSCLES = ["chest", "back", "legs", "shoulders", "arms", "core", "full"] as const;
export const FOOD_SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;

export const RESULT_COLOR: Record<string, string> = { win: GREEN, even: AMBER, loss: RED };
export const RESULT_LABEL: Record<string, string> = { win: "W", even: "E", loss: "L" };

export const LEARNING_COLOR: Record<string, string> = { mistake: RED, fix: AMBER, technique: GREEN };

// ─── Micro label ──────────────────────────────────────────────
export function Micro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[8px] font-black tracking-[0.16em] uppercase text-white/35", className)}>
      {children}
    </span>
  );
}

// ─── Stat card (the top strip) ────────────────────────────────
export function StatCard({
  label, children, accent, className,
}: { label: string; children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div
      className={cn("flex-1 min-w-[88px] border border-white/10 bg-white/[0.02] px-3 py-2.5", className)}
      style={accent ? { borderColor: `${accent}55` } : undefined}
    >
      <Micro>{label}</Micro>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// ─── A small inline button used across the loggers ────────────
export function Chip({
  on, onClick, children, color, title,
}: {
  on?: boolean; onClick?: () => void; children: React.ReactNode; color?: string; title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "px-2.5 py-1.5 border text-[9px] font-black tracking-[0.1em] uppercase transition-all cursor-pointer",
        on
          ? "text-white"
          : "border-white/12 text-white/40 hover:border-white/30 hover:text-white/70"
      )}
      style={on ? { borderColor: color ?? RED, backgroundColor: `${color ?? RED}26` } : undefined}
    >
      {children}
    </button>
  );
}

// ─── Primary / ghost action buttons ───────────────────────────
export function PrimaryBtn({
  onClick, disabled, children, className,
}: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 bg-[#E60012] text-white text-[9px] font-black tracking-[0.14em] uppercase",
        "hover:bg-[#ff1a2b] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({
  value, onChange, min = 0, max = 999, suffix,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <div className="flex items-center border border-white/12">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-black"
      >
        −
      </button>
      <span className="min-w-[2rem] px-1 text-center text-[13px] font-black tabular-nums text-white">
        {value}{suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-black"
      >
        +
      </button>
    </div>
  );
}

/** The bordered container a day-slot (MMA / gym) renders inside. */
export function SlotShell({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="border bg-white/[0.015] px-3.5 py-3 h-full"
      style={{ borderColor: accent ? `${accent}66` : "rgba(255,255,255,0.08)" }}
    >
      {children}
    </div>
  );
}

/** Square bordered icon button (edit / delete / remove-row). */
export function IconBtn({
  children, onClick, title, danger, disabled,
}: { children: React.ReactNode; onClick?: () => void; title?: string; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 transition-all cursor-pointer disabled:opacity-30",
        danger ? "hover:text-[#E60012] hover:border-[#E60012]/40" : "hover:text-white/80 hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}

/** A bare numeric/text field matching the dark inputs used site-wide. */
export function Field({
  value, onChange, placeholder, type = "text", className, ...rest
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      value={value}
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      data-1p-ignore
      className={cn(
        "bg-white/[0.02] border border-white/10 px-2.5 py-1.5 text-sm text-white/85",
        "placeholder:text-white/20 outline-none focus:border-white/25 transition-colors",
        className
      )}
      {...rest}
    />
  );
}
