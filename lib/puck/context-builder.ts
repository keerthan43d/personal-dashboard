import type {
  JournalEntry, ProblemLog, Movie, TvShow, Book,
  Client, Project, Task, TimeLog, JournalHabit, ShipLog,
} from "@/lib/db/schemas";

export interface PuckDataContext {
  entries:    JournalEntry[];
  problems:   ProblemLog[];
  movies:     Movie[];
  tvShows:    TvShow[];
  books:      Book[];
  clients:    Client[];
  projects:   Project[];
  tasks:      Task[];
  timeLogs:   TimeLog[];
  habits:     JournalHabit[];
  shipLogs:   ShipLog[];
}

export function buildDataContext(ctx: PuckDataContext): string {
  const lines: string[] = [];

  // Journal — last 14 days
  const recentEntries = [...ctx.entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  if (recentEntries.length) {
    lines.push("JOURNAL (last 14 days):");
    for (const e of recentEntries) {
      const parts = [`[${e.date}]`];
      if (e.mood)          parts.push(`Mood:${e.mood}/5`);
      if (e.energy)        parts.push(`Energy:${e.energy}/5`);
      if (e.wins.length)   parts.push(`Wins: ${e.wins.slice(0, 2).join(", ")}`);
      if (e.freeWrite)     parts.push(`Note: ${e.freeWrite.slice(0, 150)}`);
      lines.push("  " + parts.join(" | "));
    }
  }

  // Habits — completion rate from recent entries
  const activeHabits = ctx.habits.filter(h => h.active);
  if (activeHabits.length && recentEntries.length) {
    lines.push("\nHABITS (last 14 days completion):");
    for (const habit of activeHabits) {
      const done = recentEntries.filter(e => e.habits[habit.id]).length;
      lines.push(`  ${habit.name}: ${done}/${recentEntries.length} days`);
    }
  }

  // Movies — watched sorted by rating, then watchlist
  const watchedMovies = ctx.movies
    .filter(m => m.status === "watched")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (watchedMovies.length) {
    lines.push("\nMOVIES (watched, by rating):");
    watchedMovies.slice(0, 12).forEach(m => {
      lines.push(`  ${m.title} (${m.year ?? "?"}) — ${m.rating ? `${m.rating}/10` : "unrated"} — ${m.genres.join(", ") || "no genres"}`);
    });
  }
  const movieWatchlist = ctx.movies.filter(m => m.status === "watchlist");
  if (movieWatchlist.length) {
    lines.push(`  Watchlist: ${movieWatchlist.map(m => m.title).slice(0, 6).join(", ")}`);
  }

  // TV Shows
  const watchedShows = ctx.tvShows
    .filter(s => s.status === "watched")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (watchedShows.length) {
    lines.push("\nTV SHOWS (watched, by rating):");
    watchedShows.slice(0, 8).forEach(s => {
      lines.push(`  ${s.title} — ${s.rating ? `${s.rating}/10` : "unrated"} — ${s.genres.join(", ") || "no genres"}`);
    });
  }

  // Books
  const relevantBooks = ctx.books
    .filter(b => b.status === "finished" || b.status === "reading")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (relevantBooks.length) {
    lines.push("\nBOOKS:");
    relevantBooks.slice(0, 8).forEach(b => {
      const rating = b.rating ? `${b.rating}/5` : "unrated";
      lines.push(`  ${b.title} by ${b.author} — ${b.status} — ${rating}`);
      if (b.takeaways.length) lines.push(`    Takeaways: ${b.takeaways.slice(0, 2).join("; ")}`);
    });
  }

  // Work
  const activeClients = ctx.clients.filter(c => c.status === "active");
  if (activeClients.length) {
    lines.push("\nWORK:");
    lines.push(`  Active clients: ${activeClients.map(c => c.name).join(", ")}`);
    const activeProjects = ctx.projects.filter(p => p.status === "active");
    if (activeProjects.length) lines.push(`  Active projects: ${activeProjects.map(p => p.title).join(", ")}`);
    const openTasks = ctx.tasks.filter(t => !t.done).length;
    lines.push(`  Open tasks: ${openTasks}`);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const hoursThisWeek = ctx.timeLogs
      .filter(l => l.date >= weekStartStr)
      .reduce((sum, l) => sum + l.hours, 0);
    lines.push(`  Hours billed this week: ${hoursThisWeek.toFixed(1)}`);
  }

  // Problem log — recent 5
  if (ctx.problems.length) {
    lines.push("\nPROBLEM LOG (recent):");
    [...ctx.problems]
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
      .slice(0, 5)
      .forEach(p => {
        const solved = p.whatSolvedIt ? ` → ${p.whatSolvedIt.slice(0, 100)}` : "";
        lines.push(`  [${p.entryDate}] ${p.title}${solved}`);
      });
  }

  // Ships — recent 5
  if (ctx.shipLogs.length) {
    lines.push("\nSHIPPED (recent):");
    [...ctx.shipLogs]
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
      .slice(0, 5)
      .forEach(s => lines.push(`  [${s.entryDate}] ${s.title} (${s.type})`));
  }

  return lines.join("\n");
}
