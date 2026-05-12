"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users, BookOpen, Film, Clock, DollarSign,
  TrendingUp, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Topbar }    from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { StarRating } from "@/components/shared/star-rating";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress }  from "@/components/ui/progress";
import { repo }      from "@/lib/db";
import { fmt, isDueSoon, isOverdue, lastNDays } from "@/lib/utils/date";
import { formatCurrency, formatHours, initials, taskProgress } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Client, Project, Book, Movie, TimeLog, Task } from "@/lib/db/schemas";

interface DashData {
  clients:  Client[];
  projects: Project[];
  tasks:    Task[];
  timeLogs: TimeLog[];
  books:    Book[];
  movies:   Movie[];
}

export default function DashboardPage() {
  const [data, setData]     = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      repo.listClients(),
      repo.listProjects(),
      repo.listTasks(),
      repo.listTimeLogs(),
      repo.listBooks(),
      repo.listMovies(),
    ]).then(([clients, projects, tasks, timeLogs, books, movies]) => {
      setData({ clients, projects, tasks, timeLogs, books, movies });
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <>
        <Topbar title="Dashboard" />
        <PageShell>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 skeleton" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 skeleton" />
            ))}
          </div>
        </PageShell>
      </>
    );
  }

  const { clients, projects, tasks, timeLogs, books, movies } = data;

  // ── Computed stats ──────────────────────────────────────────
  const activeClients  = clients.filter((c) => c.status === "active");
  const activeProjects = projects.filter((p) => p.status === "active");
  const totalOwed      = projects
    .filter((p) => p.paymentStatus !== "paid" && p.paymentAmount)
    .reduce((s, p) => s + (p.paymentAmount ?? 0), 0);

  const today  = fmt.iso(new Date());
  const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return fmt.iso(d); })();
  const weekHours  = timeLogs.filter((l) => l.date >= weekStart && l.date <= today)
                             .reduce((s, l) => s + l.hours, 0);

  const upcomingDeadlines = projects
    .filter((p) => p.deadline && p.status !== "done" && (isDueSoon(p.deadline, 7) || isOverdue(p.deadline)))
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 5);

  const pendingTasks = tasks.filter((t) => !t.done).slice(0, 8);

  const recentBooks  = [...books]
    .filter((b) => b.status === "finished" || b.status === "reading")
    .sort((a, b) => (b.finishedAt ?? b.createdAt) > (a.finishedAt ?? a.createdAt) ? 1 : -1)
    .slice(0, 4);

  const recentMovies = [...movies]
    .filter((m) => m.status === "watched")
    .sort((a, b) => (b.watchedAt ?? b.createdAt) > (a.watchedAt ?? a.createdAt) ? 1 : -1)
    .slice(0, 4);

  const heatDays = lastNDays(35);
  const heatMap: Record<string, number> = {};
  for (const l of timeLogs) { heatMap[l.date] = (heatMap[l.date] ?? 0) + l.hours; }
  const maxHeat = Math.max(...Object.values(heatMap), 0.1);

  const kpis = [
    { label: "Active Clients",  value: activeClients.length,  icon: Users,      color: "text-[#FFD600]", href: "/clients" },
    { label: "Active Projects", value: activeProjects.length, icon: TrendingUp,  color: "text-white/70",  href: "/clients" },
    { label: "This Week",       value: formatHours(weekHours), icon: Clock,      color: "text-[#FFD600]", href: "/clients" },
    { label: "Owed",            value: totalOwed > 0 ? formatCurrency(totalOwed) : "—",
      icon: DollarSign, color: totalOwed > 0 ? "text-[#E60012]" : "text-white/30", href: "/clients" },
  ];

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`${fmt.date(new Date())} · ${activeClients.length} active client${activeClients.length !== 1 ? "s" : ""}`}
      />

      <PageShell>
        {/* ── KPI row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map(({ label, value, icon: Icon, color, href }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2, ease: "linear" }}
            >
              <Link href={href}>
                <div className="card-hover group border border-white/10 bg-[#080808] p-4 hover:border-white/18 transition-all duration-150 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-8 h-8 bg-white/[0.04] flex items-center justify-center", color)}>
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors duration-150" />
                  </div>
                  <p className={cn("font-numeric text-2xl font-black", color)}>{value}</p>
                  <p className="text-[10px] font-black tracking-[0.1em] uppercase text-white/35 mt-1">{label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Main 3-col grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Col 1: Upcoming deadlines + Tasks */}
          <div className="space-y-4">
            {/* Deadlines */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ease: "linear" }}
              className="border border-white/10 bg-[#080808] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-black text-[11px] tracking-[0.1em] uppercase text-white">Upcoming Deadlines</h3>
                <Link href="/clients" className="text-[10px] text-white/35 hover:text-[#FFD600] transition-colors duration-150 link-draw">
                  View all →
                </Link>
              </div>

              {upcomingDeadlines.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-white/35 py-3">
                  <CheckCircle2 className="w-4 h-4 text-white/20" />
                  No upcoming deadlines
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.map((proj) => {
                    const client   = clients.find((c) => c.id === proj.clientId);
                    const overdue  = isOverdue(proj.deadline!);
                    const dueSoon  = isDueSoon(proj.deadline!);
                    return (
                      <Link key={proj.id} href={`/clients/${proj.clientId}`}>
                        <div className="group flex items-center gap-2.5 p-2.5 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer">
                          <div className={cn(
                            "w-1.5 h-1.5 flex-shrink-0",
                            overdue ? "bg-[#E60012]" : dueSoon ? "bg-[#FFD600]" : "bg-white/20"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/80 truncate">{proj.title}</p>
                            <p className="text-[10px] text-white/35 truncate">{client?.name}</p>
                          </div>
                          <span className={cn(
                            "text-[10px] font-numeric flex-shrink-0",
                            overdue ? "text-[#E60012]" : dueSoon ? "text-[#FFD600]" : "text-white/35"
                          )}>
                            {fmt.short(proj.deadline!)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Pending tasks */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, ease: "linear" }}
              className="border border-white/10 bg-[#080808] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-black text-[11px] tracking-[0.1em] uppercase text-white">Open Tasks</h3>
                <span className="text-[10px] text-white/35">{tasks.filter((t) => !t.done).length} pending</span>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-white/35 py-3">
                  <CheckCircle2 className="w-4 h-4 text-white/20" />
                  All tasks complete
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pendingTasks.map((task) => {
                    const proj   = projects.find((p) => p.id === task.projectId);
                    const client = clients.find((c) => c.id === task.clientId);
                    return (
                      <Link key={task.id} href={`/clients/${task.clientId}`}>
                        <div className="flex items-start gap-2 py-1.5 px-1 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group">
                          <div className="w-3.5 h-3.5 border border-white/20 flex-shrink-0 mt-0.5 group-hover:border-[#FFD600]/40 transition-colors duration-150" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/70 leading-snug truncate">{task.title}</p>
                            {(proj || client) && (
                              <p className="text-[10px] text-white/35 truncate">{proj?.title ?? client?.name}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {tasks.filter((t) => !t.done).length > 8 && (
                    <p className="text-[10px] text-white/25 text-center pt-1">
                      +{tasks.filter((t) => !t.done).length - 8} more
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Col 2: Activity heatmap + Active projects */}
          <div className="space-y-4">
            {/* Heatmap */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, ease: "linear" }}
              className="border border-white/10 bg-[#080808] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-black text-[11px] tracking-[0.1em] uppercase text-white">Activity</h3>
                <span className="font-numeric text-[10px] text-[#FFD600]">{formatHours(weekHours)} this week</span>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {["M","T","W","T","F","S","S"].map((d, i) => (
                  <div key={i} className="text-[9px] text-white/25 text-center pb-1">{d}</div>
                ))}
                {heatDays.map((day) => {
                  const h = heatMap[day] ?? 0;
                  const intensity = h === 0 ? 0 : Math.min(1, h / maxHeat);
                  return (
                    <div key={day} title={`${day}: ${h}h`}
                      className="aspect-square cursor-default transition-colors duration-150 hover:brightness-125"
                      style={{
                        backgroundColor: h === 0
                          ? "rgba(255,255,255,0.04)"
                          : `rgba(255,214,0,${0.12 + intensity * 0.85})`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 text-[9px] text-white/25">
                <span>35 days ago</span>
                <span>Today</span>
              </div>
            </motion.div>

            {/* Active projects */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, ease: "linear" }}
              className="border border-white/10 bg-[#080808] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-black text-[11px] tracking-[0.1em] uppercase text-white">Active Projects</h3>
                <span className="text-[10px] text-white/35">{activeProjects.length}</span>
              </div>

              {activeProjects.length === 0 ? (
                <p className="text-xs text-white/35 py-3">No active projects</p>
              ) : (
                <div className="space-y-3">
                  {activeProjects.slice(0, 4).map((proj) => {
                    const client     = clients.find((c) => c.id === proj.clientId);
                    const projTasks  = tasks.filter((t) => t.projectId === proj.id);
                    const doneTasks  = projTasks.filter((t) => t.done);
                    const pct        = taskProgress(projTasks.length, doneTasks.length);
                    return (
                      <Link key={proj.id} href={`/clients/${proj.clientId}`}>
                        <div className="group cursor-pointer">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-white/80 truncate flex-1">{proj.title}</p>
                            <span className="text-[10px] font-numeric text-white/35 ml-2 flex-shrink-0">{pct}%</span>
                          </div>
                          {client && (
                            <p className="text-[10px] text-white/35 mb-1.5">{client.name}</p>
                          )}
                          <div className="h-0.5 bg-white/[0.06] overflow-hidden">
                            <motion.div className="h-full bg-[#FFD600]"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.4, duration: 0.5, ease: "linear" }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Col 3: Recent books + movies */}
          <div className="space-y-4">
            {/* Books */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, ease: "linear" }}
              className="border border-white/10 bg-[#080808] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-black text-[11px] tracking-[0.1em] uppercase text-white flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-white/35" />
                  Library
                </h3>
                <Link href="/books" className="text-[10px] text-white/35 hover:text-[#FFD600] transition-colors duration-150 link-draw">
                  View all →
                </Link>
              </div>

              {recentBooks.length === 0 ? (
                <p className="text-xs text-white/35 py-2">No books yet</p>
              ) : (
                <div className="space-y-2.5">
                  {recentBooks.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <div className="group flex items-center gap-3 hover:bg-white/[0.03] p-1.5 -mx-1.5 transition-colors duration-150 cursor-pointer">
                        <div className="w-8 h-11 border border-white/10 overflow-hidden flex-shrink-0 bg-[#111111]">
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-3 h-3 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/80 truncate">{book.title}</p>
                          <p className="text-[10px] text-white/35 truncate">{book.author}</p>
                          <StarRating value={book.rating ?? 0} readonly />
                        </div>
                        <StatusBadge status={book.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Movies */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, ease: "linear" }}
              className="border border-white/10 bg-[#080808] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-black text-[11px] tracking-[0.1em] uppercase text-white flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-white/35" />
                  Visions
                </h3>
                <Link href="/movies" className="text-[10px] text-white/35 hover:text-[#FFD600] transition-colors duration-150 link-draw">
                  View all →
                </Link>
              </div>

              {recentMovies.length === 0 ? (
                <p className="text-xs text-white/35 py-2">No movies yet</p>
              ) : (
                <div className="space-y-2.5">
                  {recentMovies.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`}>
                      <div className="group flex items-center gap-3 hover:bg-white/[0.03] p-1.5 -mx-1.5 transition-colors duration-150 cursor-pointer">
                        <div className="w-8 h-11 border border-white/10 overflow-hidden flex-shrink-0 bg-[#111111]">
                          {movie.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-3 h-3 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/80 truncate">{movie.title}</p>
                          <p className="text-[10px] text-white/35 truncate">
                            {movie.director ?? ""}{movie.year ? ` · ${movie.year}` : ""}
                          </p>
                          <StarRating value={movie.rating ?? 0} readonly />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
