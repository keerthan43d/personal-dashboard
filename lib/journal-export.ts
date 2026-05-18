import { MOOD_LABELS, ENERGY_LABELS } from "@/lib/journal-constants";
import type { JournalEntry, ProblemLog, JournalHabit } from "@/lib/db/schemas";

export function exportEntryAsMarkdown(
  entry: JournalEntry,
  problems: ProblemLog[],
  habitList: JournalHabit[]
): string {
  const lines: string[] = [];

  lines.push(`# Journal — ${entry.date}`);
  lines.push("");

  if (entry.mood || entry.energy) {
    if (entry.mood)   lines.push(`**Mood:** ${entry.mood} / 5 · ${MOOD_LABELS[entry.mood]}`);
    if (entry.energy) lines.push(`**Energy:** ${entry.energy} / 5 · ${ENERGY_LABELS[entry.energy]}`);
    lines.push("");
  }

  if (entry.freeWrite) {
    lines.push("## Free Write");
    lines.push(entry.freeWrite);
    lines.push("");
  }

  if (entry.wins.length > 0) {
    lines.push("## Wins");
    entry.wins.forEach((w) => lines.push(`- ${w}`));
    lines.push("");
  }

  if (problems.length > 0) {
    lines.push("## Problem Log");
    problems.forEach((p) => {
      lines.push(`### ${p.title}`);
      if (p.whatTheProblemWas) lines.push(`**What happened:** ${p.whatTheProblemWas}`);
      if (p.context)           lines.push(`**Context:** ${p.context}`);
      if (p.whatDidntWork)     lines.push(`**What I tried:** ${p.whatDidntWork}`);
      if (p.whatSolvedIt)      lines.push(`**What worked:** ${p.whatSolvedIt}`);
      if (p.whyItWorked)       lines.push(`**Why it worked:** ${p.whyItWorked}`);
      if (p.tags.length > 0)   lines.push(`**Tags:** ${p.tags.map((t) => `#${t}`).join(" ")}`);
      lines.push("");
    });
  }

  if (entry.ideas.length > 0) {
    lines.push("## Ideas");
    entry.ideas.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }

  if (entry.tomorrowFocus) {
    lines.push("## Tomorrow's Focus");
    lines.push(entry.tomorrowFocus);
    lines.push("");
  }

  if (habitList.length > 0) {
    lines.push("## Habits");
    habitList
      .filter((h) => h.active)
      .forEach((h) => {
        const checked = entry.habits[h.name] ? "x" : " ";
        lines.push(`- [${checked}] ${h.name}`);
      });
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
