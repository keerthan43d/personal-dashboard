"use client";
import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, Timer, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDeepWork } from "@/lib/hooks/use-deep-work";

interface Props {
  entryDate: string;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function DeepWorkSection({ entryDate }: Props) {
  const {
    timer,
    logs,
    loadLogs,
    deleteLog,
    setTimerField,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useDeepWork();

  const [displayTime, setDisplayTime] = useState(0);

  // Load logs on mount and date change
  useEffect(() => {
    loadLogs(entryDate);
  }, [entryDate, loadLogs]);

  // Live timer tick
  useEffect(() => {
    if (!timer.running) {
      // When paused or stopped, show the accumulated elapsed time
      setDisplayTime(timer.elapsed);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const live = timer.elapsed + (timer.startedAt ? now - timer.startedAt : 0);

      if (timer.mode === "pomodoro") {
        const target = timer.pomoDuration * 60000;
        const remaining = target - live;
        if (remaining <= 0) {
          // Auto-stop when pomodoro completes
          stopTimer(entryDate);
          return;
        }
        setDisplayTime(remaining);
      } else {
        setDisplayTime(live);
      }
    };

    tick(); // immediate first tick
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [timer.running, timer.startedAt, timer.elapsed, timer.mode, timer.pomoDuration, entryDate, stopTimer]);

  // For pomodoro mode when paused, show remaining time
  useEffect(() => {
    if (!timer.running && timer.paused && timer.mode === "pomodoro") {
      const remaining = timer.pomoDuration * 60000 - timer.elapsed;
      setDisplayTime(Math.max(0, remaining));
    }
  }, [timer.running, timer.paused, timer.mode, timer.pomoDuration, timer.elapsed]);

  const handleStop = useCallback(async () => {
    await stopTimer(entryDate);
  }, [stopTimer, entryDate]);

  const isIdle = !timer.running && !timer.paused;
  const isRunning = timer.running;
  const isPaused = timer.paused;

  // Summary calculations
  const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  const projectMinutes = logs
    .filter((l) => l.category === "project")
    .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  const clientMinutes = logs
    .filter((l) => l.category === "client")
    .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  const splitPct = totalMinutes > 0 ? (projectMinutes / totalMinutes) * 100 : 50;

  return (
    <div className="space-y-5">
      {/* ── Mode Toggle ────────────────────────────────────────── */}
      <div className="flex gap-2">
        {(["stopwatch", "pomodoro"] as const).map((mode) => {
          const active = timer.mode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                if (!isIdle) return; // don't switch while running
                setTimerField("mode", mode);
              }}
              disabled={!isIdle}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-black tracking-[0.1em] uppercase transition-all duration-150",
                active
                  ? "border-[#00D9FF]/50 text-[#00D9FF] bg-[#00D9FF]/10"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60",
                !isIdle && !active && "opacity-30 cursor-not-allowed"
              )}
            >
              {mode === "stopwatch" ? (
                <Clock className="w-3 h-3" />
              ) : (
                <Timer className="w-3 h-3" />
              )}
              {mode}
            </button>
          );
        })}
      </div>

      {/* ── Timer Display ──────────────────────────────────────── */}
      <div className="flex flex-col items-center py-4">
        <span
          className={cn(
            "font-mono text-3xl font-bold tabular-nums tracking-wider",
            isRunning ? "text-white" : isPaused ? "text-[#FFD600]" : "text-white/50"
          )}
        >
          {formatMs(displayTime)}
        </span>
        {timer.mode === "pomodoro" && isIdle && (
          <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/40 mt-1.5">
            {timer.pomoDuration}min session
          </span>
        )}
        {isRunning && (
          <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#00D9FF]/60 mt-1.5">
            {timer.mode === "pomodoro" ? "remaining" : "elapsed"}
          </span>
        )}
        {isPaused && (
          <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#FFD600]/60 mt-1.5">
            paused
          </span>
        )}
      </div>

      {/* ── Pomodoro Presets ────────────────────────────────────── */}
      {timer.mode === "pomodoro" && isIdle && (
        <div className="flex justify-center gap-2">
          {[25, 50, 90].map((mins) => {
            const active = timer.pomoDuration === mins;
            return (
              <button
                key={mins}
                onClick={() => setTimerField("pomoDuration", mins)}
                className={cn(
                  "px-3 py-1 border text-[10px] font-black tracking-[0.08em] uppercase transition-all duration-150",
                  active
                    ? "border-[#00D9FF]/50 text-[#00D9FF] bg-[#00D9FF]/10"
                    : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                )}
              >
                {mins}min
              </button>
            );
          })}
        </div>
      )}

      {/* ── Category Toggle ────────────────────────────────────── */}
      <div className="flex gap-2">
        {(["project", "client"] as const).map((cat) => {
          const active = timer.category === cat;
          const isProject = cat === "project";
          return (
            <button
              key={cat}
              onClick={() => setTimerField("category", cat)}
              className={cn(
                "px-3 py-1.5 border text-[10px] font-black tracking-[0.08em] uppercase transition-all duration-150",
                active && isProject && "border-[#00C9A7]/50 text-[#00C9A7] bg-[#00C9A7]/8",
                active && !isProject && "border-white/30 text-white/70 bg-white/5",
                !active && "border-white/8 text-white/30 hover:border-white/15 hover:text-white/50"
              )}
            >
              {isProject ? "My Project" : "Client Work"}
            </button>
          );
        })}
      </div>

      {/* ── Description Input ──────────────────────────────────── */}
      <input
        type="text"
        value={timer.description}
        onChange={(e) => setTimerField("description", e.target.value)}
        placeholder="What are you working on?"
        className={cn(
          "w-full px-3 py-2 bg-transparent border border-white/8 text-sm text-white",
          "placeholder:text-white/25 outline-none transition-colors",
          "focus:border-[#00D9FF]/30 focus:bg-[#00D9FF]/[0.02]"
        )}
      />

      {/* ── Control Buttons ────────────────────────────────────── */}
      <div className="flex gap-2">
        {isIdle && (
          <button
            onClick={startTimer}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 border border-emerald-500/50 text-emerald-400",
              "text-[10px] font-black tracking-[0.08em] uppercase",
              "hover:bg-emerald-500/10 transition-all duration-150 cursor-pointer"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={pauseTimer}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 border border-yellow-500/50 text-yellow-400",
                "text-[10px] font-black tracking-[0.08em] uppercase",
                "hover:bg-yellow-500/10 transition-all duration-150 cursor-pointer"
              )}
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
            <button
              onClick={handleStop}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 border border-rose-500/50 text-rose-400",
                "text-[10px] font-black tracking-[0.08em] uppercase",
                "hover:bg-rose-500/10 transition-all duration-150 cursor-pointer"
              )}
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={resumeTimer}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 border border-emerald-500/50 text-emerald-400",
                "text-[10px] font-black tracking-[0.08em] uppercase",
                "hover:bg-emerald-500/10 transition-all duration-150 cursor-pointer"
              )}
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
            <button
              onClick={handleStop}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 border border-rose-500/50 text-rose-400",
                "text-[10px] font-black tracking-[0.08em] uppercase",
                "hover:bg-rose-500/10 transition-all duration-150 cursor-pointer"
              )}
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
            <button
              onClick={resetTimer}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 border border-white/15 text-white/40",
                "text-[10px] font-black tracking-[0.08em] uppercase",
                "hover:border-white/25 hover:text-white/60 transition-all duration-150 cursor-pointer"
              )}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="h-px bg-white/8" />

      {/* ── Summary Bar ────────────────────────────────────────── */}
      {logs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Today&apos;s Total
            </span>
            <span className="text-sm font-mono font-bold text-white">
              {formatMinutes(totalMinutes)}
            </span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden bg-white/5">
            <div
              className="h-full bg-[#00C9A7] transition-all duration-300"
              style={{ width: `${splitPct}%` }}
            />
            <div
              className="h-full bg-white/30 transition-all duration-300"
              style={{ width: `${100 - splitPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] font-black tracking-[0.1em] uppercase">
            <span className="text-[#00C9A7]">
              Project {formatMinutes(projectMinutes)}
            </span>
            <span className="text-white/50">
              Client {formatMinutes(clientMinutes)}
            </span>
          </div>
        </div>
      )}

      {/* ── Sessions Log ───────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
          Sessions
        </span>

        {logs.length === 0 && (
          <p className="text-xs text-white/30 italic py-2">
            No deep work sessions logged today.
          </p>
        )}

        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-3 py-2 px-3 border border-white/5 hover:border-white/12 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
            >
              {/* Time range */}
              <span className="text-[11px] font-mono text-white/50 shrink-0">
                {log.startTime}–{log.endTime}
              </span>

              {/* Duration */}
              <span className="text-[11px] font-mono font-bold text-white shrink-0">
                {log.durationMinutes ? formatMinutes(log.durationMinutes) : "—"}
              </span>

              {/* Description */}
              <span className="text-xs text-white/60 flex-1 truncate">
                {log.description || "—"}
              </span>

              {/* Category badge */}
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[8px] font-black tracking-[0.1em] uppercase border shrink-0",
                  log.category === "project"
                    ? "border-[#00C9A7]/40 text-[#00C9A7]/80"
                    : "border-white/20 text-white/50"
                )}
              >
                {log.category === "project" ? "PRJ" : "CLT"}
              </span>

              {/* Delete */}
              <button
                onClick={() => deleteLog(log.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-rose-400 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
