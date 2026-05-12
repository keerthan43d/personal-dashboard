"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Clock, Package, CheckSquare,
  ExternalLink, ChevronLeft, Timer, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Topbar }   from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ClientDialog }      from "@/components/clients/client-dialog";
import { ProjectDialog }     from "@/components/clients/project-dialog";
import { LogHoursDialog }    from "@/components/clients/log-hours-dialog";
import { DeliverableDialog } from "@/components/clients/deliverable-dialog";
import { useClients } from "@/lib/hooks/use-clients";
import { repo }       from "@/lib/db";
import { fmt, isOverdue, isDueSoon } from "@/lib/utils/date";
import { formatCurrency, formatHours, initials, taskProgress, DELIVERABLE_TYPE_LABELS } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Client, Project, Task } from "@/lib/db/schemas";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const {
    clients, projects, tasks, timeLogs, deliverables, loading,
    loadClients, loadClient,
    editClient, removeClient,
    addTask, toggleTask, removeTask,
    removeProject, removeTimeLog, removeDeliverable,
  } = useClients();

  const [client, setClient] = useState<Client | undefined>();
  const [activeTab, setActiveTab] = useState("projects");

  // dialogs
  const [editClientOpen, setEditClientOpen]     = useState(false);
  const [newProjectOpen, setNewProjectOpen]     = useState(false);
  const [editProject,   setEditProject]         = useState<Project | undefined>();
  const [logHoursOpen,  setLogHoursOpen]        = useState(false);
  const [deliverableOpen, setDeliverableOpen]   = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);
  const [newTaskTitle,     setNewTaskTitle]     = useState("");

  useEffect(() => {
    loadClient(id);
    repo.getClient(id).then(setClient);
  }, [id]);

  const reload = () => { loadClient(id); repo.getClient(id).then(setClient); };

  if (!client && !loading) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Client not found.</p>
      </PageShell>
    );
  }

  const totalHours = timeLogs.reduce((s, l) => s + l.hours, 0);
  const totalOwed  = projects
    .filter((p) => p.paymentStatus !== "paid")
    .reduce((s, p) => s + (p.paymentAmount ?? 0), 0);

  // Add inline task
  async function submitNewTask(projectId: string) {
    if (!newTaskTitle.trim()) return;
    await addTask({ projectId, clientId: id, title: newTaskTitle.trim(), done: false });
    setNewTaskTitle("");
    setNewTaskProjectId(null);
    toast.success("Task added");
  }

  async function handleDeleteClient() {
    if (!confirm(`Delete ${client?.name}? This removes all their projects, tasks, and logs.`)) return;
    await removeClient(id);
    toast.success("Client deleted");
    router.push("/clients");
  }

  return (
    <>
      <Topbar
        title={client?.name ?? "…"}
        subtitle={client?.company}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/clients")}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setEditClientOpen(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500/70 hover:text-rose-400"
              onClick={handleDeleteClient}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        }
      />

      <PageShell>
        {client && (
          <>
            {/* ── Hero strip ────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-6 p-5 rounded-xl border border-white/6 bg-[#111111]"
            >
              <Avatar className="w-14 h-14 rounded-xl border border-white/10 flex-shrink-0">
                <AvatarFallback className="rounded-xl bg-[#FFD600]/10 text-[#FFD600] text-lg font-semibold">
                  {initials(client.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-display text-xl font-semibold text-[#f5f5f5]">{client.name}</h2>
                  <StatusBadge status={client.status} />
                </div>
                {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                {client.email   && <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>}
                {client.notes   && <p className="text-sm text-[#a1a1aa] mt-2 leading-relaxed">{client.notes}</p>}
              </div>

              {/* KPI pills */}
              <div className="flex sm:flex-col gap-2 sm:gap-1.5 flex-wrap sm:text-right">
                <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2 text-center sm:min-w-[100px]">
                  <p className="font-numeric text-lg font-semibold text-[#f5f5f5]">{projects.length}</p>
                  <p className="text-[10px] text-muted-foreground">Projects</p>
                </div>
                <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2 text-center sm:min-w-[100px]">
                  <p className="font-numeric text-lg font-semibold text-[#FFD600]">{formatHours(totalHours)}</p>
                  <p className="text-[10px] text-muted-foreground">Hours</p>
                </div>
                {totalOwed > 0 && (
                  <div className="rounded-lg bg-rose-950/40 border border-rose-800/30 px-3 py-2 text-center sm:min-w-[100px]">
                    <p className="font-numeric text-lg font-semibold text-rose-400">{formatCurrency(totalOwed, client.currency)}</p>
                    <p className="text-[10px] text-muted-foreground">Owed</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Tabs ──────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-white/5 border border-white/8 h-9">
                  {[
                    { v: "projects",     l: "Projects" },
                    { v: "time",         l: `Time (${formatHours(totalHours)})` },
                    { v: "deliverables", l: `Deliverables (${deliverables.length})` },
                  ].map(({ v, l }) => (
                    <TabsTrigger key={v} value={v}
                      className="text-xs data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#f5f5f5]">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex gap-2">
                  {activeTab === "projects" && (
                    <Button onClick={() => setNewProjectOpen(true)} size="sm"
                      className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Project
                    </Button>
                  )}
                  {activeTab === "time" && (
                    <Button onClick={() => setLogHoursOpen(true)} size="sm"
                      className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Log Hours
                    </Button>
                  )}
                  {activeTab === "deliverables" && (
                    <Button onClick={() => setDeliverableOpen(true)} size="sm"
                      className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Deliverable
                    </Button>
                  )}
                </div>
              </div>

              {/* ── Projects tab ─────────────────────────── */}
              <TabsContent value="projects" className="space-y-4 mt-0">
                {projects.length === 0 ? (
                  <EmptyState icon={<Package className="w-6 h-6" />} title="No projects yet"
                    description="Create a project to start tracking tasks and progress."
                    action={
                      <Button onClick={() => setNewProjectOpen(true)} size="sm"
                        className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> New Project
                      </Button>
                    }
                  />
                ) : projects.map((project, pi) => {
                  const projectTasks  = tasks.filter((t) => t.projectId === project.id);
                  const doneTasks     = projectTasks.filter((t) => t.done);
                  const progress      = taskProgress(projectTasks.length, doneTasks.length);
                  const overdue       = project.deadline && isOverdue(project.deadline) && project.status !== "done";
                  const dueSoon       = project.deadline && isDueSoon(project.deadline);

                  return (
                    <motion.div key={project.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pi * 0.04 }}
                      className="rounded-xl border border-white/6 bg-[#111111] p-4"
                    >
                      {/* Project header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h4 className="font-medium text-[#f5f5f5] text-sm">{project.title}</h4>
                            <StatusBadge status={project.status} />
                            <StatusBadge status={project.paymentStatus} />
                          </div>
                          {project.description && (
                            <p className="text-xs text-muted-foreground">{project.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
                            onClick={() => setEditProject(project)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-400"
                            onClick={async () => {
                              if (!confirm("Delete this project?")) return;
                              await removeProject(project.id);
                              toast.success("Project deleted");
                            }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                        {project.paymentAmount && (
                          <span className={cn(
                            "font-numeric font-medium",
                            project.paymentStatus === "paid" ? "text-emerald-400" : "text-[#FFD600]"
                          )}>
                            {formatCurrency(project.paymentAmount, client.currency)}
                          </span>
                        )}
                        {project.deadline && (
                          <span className={cn(
                            overdue ? "text-rose-400" :
                            dueSoon ? "text-[#FFD600]" : ""
                          )}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {fmt.date(project.deadline)}
                            {overdue ? " · Overdue" : dueSoon ? " · Due soon" : ""}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {projectTasks.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                            <span>{doneTasks.length}/{projectTasks.length} tasks</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-[#FFD600]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Task list */}
                      <div className="space-y-1">
                        {projectTasks.map((task) => (
                          <div key={task.id}
                            className="group flex items-center gap-2.5 py-1 rounded hover:bg-white/3 px-1 transition-colors"
                          >
                            <button
                              onClick={() => toggleTask(task.id, !task.done)}
                              className={cn(
                                "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer",
                                task.done
                                  ? "bg-[#FFD600] border-[#FFD600]"
                                  : "border-white/20 hover:border-[#FFD600]/60"
                              )}
                            >
                              {task.done && (
                                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 10 10">
                                  <path d="M1.5 5.5L4 8l4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            <span className={cn(
                              "text-xs flex-1",
                              task.done ? "line-through text-muted-foreground" : "text-[#d4d4d8]"
                            )}>
                              {task.title}
                            </span>
                            <button onClick={() => removeTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-rose-400 transition-all cursor-pointer">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Add task inline */}
                        {newTaskProjectId === project.id ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                            <input
                              autoFocus
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitNewTask(project.id);
                                if (e.key === "Escape") { setNewTaskProjectId(null); setNewTaskTitle(""); }
                              }}
                              onBlur={() => submitNewTask(project.id)}
                              placeholder="Task title… (Enter to save)"
                              className="flex-1 bg-transparent text-xs text-[#d4d4d8] placeholder:text-muted-foreground/50 outline-none border-b border-white/10 pb-0.5"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => { setNewTaskProjectId(project.id); setNewTaskTitle(""); }}
                            className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground mt-1.5 transition-colors cursor-pointer px-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add task
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* ── Time tab ──────────────────────────────── */}
              <TabsContent value="time" className="mt-0">
                {timeLogs.length === 0 ? (
                  <EmptyState icon={<Timer className="w-6 h-6" />} title="No time logged yet"
                    action={
                      <Button onClick={() => setLogHoursOpen(true)} size="sm"
                        className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Log Hours
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {[...timeLogs].reverse().map((log, li) => {
                      const proj = projects.find((p) => p.id === log.projectId);
                      return (
                        <motion.div key={log.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: li * 0.03 }}
                          className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-white/5 bg-[#111111] hover:border-white/8"
                        >
                          <span className="font-numeric text-sm font-medium text-[#FFD600] w-10 flex-shrink-0">
                            {log.hours}h
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#d4d4d8]">
                              {log.description ?? (proj?.title ?? "General work")}
                            </p>
                            {proj && log.description && (
                              <p className="text-xs text-muted-foreground">{proj.title}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{fmt.date(log.date)}</span>
                          <button onClick={() => removeTimeLog(log.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-rose-400 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 mt-2">
                      <span className="text-xs text-muted-foreground">Total logged:</span>
                      <span className="font-numeric font-semibold text-[#FFD600]">{formatHours(totalHours)}</span>
                      {client.hourlyRate && (
                        <span className="text-xs text-muted-foreground">
                          · {formatCurrency(totalHours * client.hourlyRate, client.currency)} value
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Deliverables tab ──────────────────────── */}
              <TabsContent value="deliverables" className="mt-0">
                {deliverables.length === 0 ? (
                  <EmptyState icon={<Package className="w-6 h-6" />} title="No deliverables yet"
                    action={
                      <Button onClick={() => setDeliverableOpen(true)} size="sm"
                        className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add Deliverable
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {deliverables.map((d, di) => {
                      const proj = projects.find((p) => p.id === d.projectId);
                      return (
                        <motion.div key={d.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: di * 0.03 }}
                          className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-white/5 bg-[#111111] hover:border-white/8"
                        >
                          <Badge variant="outline" className="badge-blue text-[10px] flex-shrink-0">
                            {DELIVERABLE_TYPE_LABELS[d.type]}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#d4d4d8]">{d.title}</p>
                            {proj && <p className="text-xs text-muted-foreground">{proj.title}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{fmt.date(d.deliveredAt)}</span>
                          {d.url && (
                            <a href={d.url} target="_blank" rel="noreferrer"
                              className="text-muted-foreground/60 hover:text-[#FFD600] transition-colors cursor-pointer">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button onClick={() => removeDeliverable(d.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-rose-400 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageShell>

      {/* Dialogs */}
      {client && (
        <>
          <ClientDialog open={editClientOpen} onClose={() => { setEditClientOpen(false); reload(); }} existing={client} />
          <ProjectDialog open={newProjectOpen} onClose={() => { setNewProjectOpen(false); reload(); }} clientId={id} />
          {editProject && (
            <ProjectDialog open={!!editProject} onClose={() => { setEditProject(undefined); reload(); }}
              clientId={id} existing={editProject} />
          )}
          <LogHoursDialog open={logHoursOpen} onClose={() => { setLogHoursOpen(false); reload(); }}
            clientId={id} projects={projects} />
          <DeliverableDialog open={deliverableOpen} onClose={() => { setDeliverableOpen(false); reload(); }}
            clientId={id} projects={projects} />
        </>
      )}
    </>
  );
}
