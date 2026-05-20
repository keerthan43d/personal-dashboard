"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Pencil, Calendar, Plus } from "lucide-react";
import { useOneProject } from "@/lib/hooks/use-one-project";
import { OneProjectDialog } from "./one-project-dialog";
import type { OneProject, Milestone, OneProjectInput } from "@/lib/db/schemas";

export function OneProjectBanner() {
  const { project, loading, load, create, update } = useOneProject();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(data: OneProjectInput) {
    if (project) {
      await update(project.id, data);
    } else {
      await create(data);
    }
  }

  function toggleMilestone(milestone: Milestone) {
    if (!project) return;
    const updated = project.milestones.map((m) =>
      m.id === milestone.id ? { ...m, done: !m.done } : m
    );
    update(project.id, { milestones: updated });
  }

  const doneMilestones = project?.milestones.filter((m) => m.done).length ?? 0;
  const totalMilestones = project?.milestones.length ?? 0;
  const progress = totalMilestones > 0 ? (doneMilestones / totalMilestones) * 100 : 0;

  function daysRemaining(): number | null {
    if (!project?.targetDate) return null;
    const target = new Date(project.targetDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const days = daysRemaining();

  if (loading) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {!project ? (
          /* ── Empty state ── */
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full border border-[#FFD600]/30 bg-[#FFD600]/[0.03] px-5 py-4 flex items-center gap-3 hover:bg-[#FFD600]/[0.06] transition-colors group"
          >
            <Target className="w-5 h-5 text-[#FFD600]/60 group-hover:text-[#FFD600] transition-colors" />
            <div className="flex-1 text-left">
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60 group-hover:text-white/80 transition-colors">
                The ONE Project
              </span>
              <p className="text-sm font-semibold text-[#FFD600]/70 group-hover:text-[#FFD600] mt-0.5 transition-colors flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Set your ONE project
              </p>
            </div>
          </button>
        ) : (
          /* ── Active state ── */
          <div className="border border-[#FFD600]/30 bg-[#FFD600]/[0.03] px-5 py-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Target className="w-5 h-5 text-[#FFD600] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60 block">
                    The ONE Project
                  </span>
                  <h3 className="text-lg font-black tracking-[0.06em] uppercase text-white truncate mt-0.5">
                    {project.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDialogOpen(true)}
                className="text-white/25 hover:text-white/60 transition-colors shrink-0 mt-1"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Target date */}
            {project.targetDate && (
              <div className="flex items-center gap-1.5 mt-2.5 ml-8">
                <Calendar className="w-3 h-3 text-white/40" />
                <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60">
                  {project.targetDate}
                </span>
                {days !== null && (
                  <span
                    className={`text-[10px] font-black tracking-[0.1em] uppercase ml-1 ${
                      days <= 0
                        ? "text-rose-400"
                        : days <= 7
                          ? "text-amber-400"
                          : "text-[#FFD600]/80"
                    }`}
                  >
                    {days <= 0
                      ? days === 0
                        ? "// TODAY"
                        : `// ${Math.abs(days)}d OVERDUE`
                      : `// ${days}d LEFT`}
                  </span>
                )}
              </div>
            )}

            {/* Milestones */}
            {totalMilestones > 0 && (
              <div className="mt-4 ml-8 space-y-2">
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#FFD600]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60 shrink-0">
                    {doneMilestones}/{totalMilestones}
                  </span>
                </div>

                {/* Checklist */}
                <div className="space-y-1">
                  {project.milestones.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMilestone(m)}
                      className="flex items-center gap-2.5 w-full text-left group/ms hover:bg-white/[0.02] px-1 py-0.5 -mx-1 transition-colors"
                    >
                      <div
                        className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center transition-colors ${
                          m.done
                            ? "border-[#FFD600] bg-[#FFD600]"
                            : "border-white/25 group-hover/ms:border-white/40"
                        }`}
                      >
                        {m.done && (
                          <svg
                            className="w-2.5 h-2.5 text-black"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="square"
                          >
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs transition-colors ${
                          m.done
                            ? "text-white/40 line-through"
                            : "text-white/80 group-hover/ms:text-white"
                        }`}
                      >
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <OneProjectDialog
        key={project?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        existing={project ?? undefined}
        onSave={handleSave}
      />
    </>
  );
}
