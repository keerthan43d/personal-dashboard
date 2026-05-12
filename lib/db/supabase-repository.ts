"use client";
import { v4 as uuid } from "uuid";
import { supabase } from "./supabase-client";
import type {
  Client,      ClientInput,
  Project,     ProjectInput,
  Task,        TaskInput,
  TimeLog,     TimeLogInput,
  Deliverable, DeliverableInput,
  Book,        BookInput,
  Movie,       MovieInput,
  ExportSnapshot,
} from "./schemas";
import type { DataRepository } from "./repository";

const now = () => new Date().toISOString();

// ─── DB row types (snake_case Postgres columns) ───────────────
type ClientRow = {
  id: string; name: string; company: string | null; email: string | null;
  avatar: string | null; status: string; hourly_rate: number | null;
  currency: string; notes: string | null; created_at: string; archived_at: string | null;
};
type ProjectRow = {
  id: string; client_id: string; title: string; description: string | null;
  status: string; deadline: string | null; payment_amount: number | null;
  payment_status: string; notes: string | null; created_at: string; completed_at: string | null;
};
type TaskRow = {
  id: string; project_id: string; client_id: string; title: string;
  done: boolean; order: number; created_at: string; completed_at: string | null;
};
type TimeLogRow = {
  id: string; client_id: string; project_id: string | null;
  date: string; hours: number; description: string | null; created_at: string;
};
type DeliverableRow = {
  id: string; client_id: string; project_id: string | null; title: string;
  type: string; url: string | null; delivered_at: string; notes: string | null; created_at: string;
};
type BookRow = {
  id: string; title: string; author: string; cover_url: string | null;
  isbn: string | null; genre: string | null; status: string; rating: number | null;
  takeaways: string[]; started_at: string | null; finished_at: string | null;
  notes: string | null; pages: number | null; created_at: string;
};
type MovieRow = {
  id: string; title: string; director: string | null; year: number | null;
  poster_url: string | null; tmdb_id: number | null; genres: string[]; status: string;
  rating: number | null; notes: string | null; watched_at: string | null;
  runtime: number | null; created_at: string;
};

// ─── Row → Entity ─────────────────────────────────────────────
function fromClientRow(r: ClientRow): Client {
  return {
    id: r.id, name: r.name, status: r.status as Client["status"],
    currency: r.currency, createdAt: r.created_at,
    ...(r.company     != null && { company:    r.company }),
    ...(r.email       != null && { email:      r.email }),
    ...(r.avatar      != null && { avatar:     r.avatar }),
    ...(r.hourly_rate != null && { hourlyRate: r.hourly_rate }),
    ...(r.notes       != null && { notes:      r.notes }),
    ...(r.archived_at != null && { archivedAt: r.archived_at }),
  };
}
function fromProjectRow(r: ProjectRow): Project {
  return {
    id: r.id, clientId: r.client_id, title: r.title,
    status: r.status as Project["status"],
    paymentStatus: r.payment_status as Project["paymentStatus"],
    createdAt: r.created_at,
    ...(r.description    != null && { description:   r.description }),
    ...(r.deadline       != null && { deadline:       r.deadline }),
    ...(r.payment_amount != null && { paymentAmount:  r.payment_amount }),
    ...(r.notes          != null && { notes:          r.notes }),
    ...(r.completed_at   != null && { completedAt:    r.completed_at }),
  };
}
function fromTaskRow(r: TaskRow): Task {
  return {
    id: r.id, projectId: r.project_id, clientId: r.client_id,
    title: r.title, done: r.done, order: r.order, createdAt: r.created_at,
    ...(r.completed_at != null && { completedAt: r.completed_at }),
  };
}
function fromTimeLogRow(r: TimeLogRow): TimeLog {
  return {
    id: r.id, clientId: r.client_id, date: r.date,
    hours: r.hours, createdAt: r.created_at,
    ...(r.project_id  != null && { projectId:   r.project_id }),
    ...(r.description != null && { description: r.description }),
  };
}
function fromDeliverableRow(r: DeliverableRow): Deliverable {
  return {
    id: r.id, clientId: r.client_id, title: r.title,
    type: r.type as Deliverable["type"], deliveredAt: r.delivered_at, createdAt: r.created_at,
    ...(r.project_id != null && { projectId: r.project_id }),
    ...(r.url        != null && { url:       r.url }),
    ...(r.notes      != null && { notes:     r.notes }),
  };
}
function fromBookRow(r: BookRow): Book {
  return {
    id: r.id, title: r.title, author: r.author,
    status: r.status as Book["status"], takeaways: r.takeaways ?? [], createdAt: r.created_at,
    ...(r.cover_url   != null && { coverUrl:   r.cover_url }),
    ...(r.isbn        != null && { isbn:       r.isbn }),
    ...(r.genre       != null && { genre:      r.genre }),
    ...(r.rating      != null && { rating:     r.rating }),
    ...(r.started_at  != null && { startedAt:  r.started_at }),
    ...(r.finished_at != null && { finishedAt: r.finished_at }),
    ...(r.notes       != null && { notes:      r.notes }),
    ...(r.pages       != null && { pages:      r.pages }),
  };
}
function fromMovieRow(r: MovieRow): Movie {
  return {
    id: r.id, title: r.title, status: r.status as Movie["status"],
    genres: r.genres ?? [], createdAt: r.created_at,
    ...(r.director  != null && { director:  r.director }),
    ...(r.year      != null && { year:      r.year }),
    ...(r.poster_url!= null && { posterUrl: r.poster_url }),
    ...(r.tmdb_id   != null && { tmdbId:    r.tmdb_id }),
    ...(r.rating    != null && { rating:    r.rating }),
    ...(r.notes     != null && { notes:     r.notes }),
    ...(r.watched_at!= null && { watchedAt: r.watched_at }),
    ...(r.runtime   != null && { runtime:   r.runtime }),
  };
}

// ─── Entity → Row (only defined keys, no undefined) ──────────
function toClientRow(d: Partial<ClientInput>): Partial<ClientRow> {
  const r: Partial<ClientRow> = {};
  if (d.name       !== undefined) r.name        = d.name;
  if (d.company    !== undefined) r.company     = d.company    ?? null;
  if (d.email      !== undefined) r.email       = d.email      ?? null;
  if (d.avatar     !== undefined) r.avatar      = d.avatar     ?? null;
  if (d.status     !== undefined) r.status      = d.status;
  if (d.hourlyRate !== undefined) r.hourly_rate = d.hourlyRate ?? null;
  if (d.currency   !== undefined) r.currency    = d.currency;
  if (d.notes      !== undefined) r.notes       = d.notes      ?? null;
  if (d.archivedAt !== undefined) r.archived_at = d.archivedAt ?? null;
  return r;
}
function toProjectRow(d: Partial<ProjectInput>): Partial<ProjectRow> {
  const r: Partial<ProjectRow> = {};
  if (d.clientId      !== undefined) r.client_id      = d.clientId;
  if (d.title         !== undefined) r.title          = d.title;
  if (d.description   !== undefined) r.description    = d.description   ?? null;
  if (d.status        !== undefined) r.status         = d.status;
  if (d.deadline      !== undefined) r.deadline       = d.deadline      ?? null;
  if (d.paymentAmount !== undefined) r.payment_amount = d.paymentAmount ?? null;
  if (d.paymentStatus !== undefined) r.payment_status = d.paymentStatus;
  if (d.notes         !== undefined) r.notes          = d.notes         ?? null;
  if (d.completedAt   !== undefined) r.completed_at   = d.completedAt   ?? null;
  return r;
}
function toTaskRow(d: Partial<TaskInput & { order?: number }>): Partial<TaskRow> {
  const r: Partial<TaskRow> = {};
  if (d.projectId   !== undefined) r.project_id  = d.projectId;
  if (d.clientId    !== undefined) r.client_id   = d.clientId;
  if (d.title       !== undefined) r.title       = d.title;
  if (d.done        !== undefined) r.done        = d.done;
  if (d.order       !== undefined) r.order       = d.order;
  if (d.completedAt !== undefined) r.completed_at = d.completedAt ?? null;
  return r;
}
function toTimeLogRow(d: Partial<TimeLogInput>): Partial<TimeLogRow> {
  const r: Partial<TimeLogRow> = {};
  if (d.clientId    !== undefined) r.client_id  = d.clientId;
  if (d.projectId   !== undefined) r.project_id = d.projectId  ?? null;
  if (d.date        !== undefined) r.date        = d.date;
  if (d.hours       !== undefined) r.hours       = d.hours;
  if (d.description !== undefined) r.description = d.description ?? null;
  return r;
}
function toDeliverableRow(d: Partial<DeliverableInput>): Partial<DeliverableRow> {
  const r: Partial<DeliverableRow> = {};
  if (d.clientId    !== undefined) r.client_id   = d.clientId;
  if (d.projectId   !== undefined) r.project_id  = d.projectId  ?? null;
  if (d.title       !== undefined) r.title        = d.title;
  if (d.type        !== undefined) r.type         = d.type;
  if (d.url         !== undefined) r.url          = d.url        ?? null;
  if (d.deliveredAt !== undefined) r.delivered_at = d.deliveredAt;
  if (d.notes       !== undefined) r.notes        = d.notes      ?? null;
  return r;
}
function toBookRow(d: Partial<BookInput>): Partial<BookRow> {
  const r: Partial<BookRow> = {};
  if (d.title      !== undefined) r.title      = d.title;
  if (d.author     !== undefined) r.author     = d.author;
  if (d.coverUrl   !== undefined) r.cover_url  = d.coverUrl   ?? null;
  if (d.isbn       !== undefined) r.isbn       = d.isbn       ?? null;
  if (d.genre      !== undefined) r.genre      = d.genre      ?? null;
  if (d.status     !== undefined) r.status     = d.status;
  if (d.rating     !== undefined) r.rating     = d.rating     ?? null;
  if (d.takeaways  !== undefined) r.takeaways  = d.takeaways  ?? [];
  if (d.startedAt  !== undefined) r.started_at = d.startedAt  ?? null;
  if (d.finishedAt !== undefined) r.finished_at= d.finishedAt ?? null;
  if (d.notes      !== undefined) r.notes      = d.notes      ?? null;
  if (d.pages      !== undefined) r.pages      = d.pages      ?? null;
  return r;
}
function toMovieRow(d: Partial<MovieInput>): Partial<MovieRow> {
  const r: Partial<MovieRow> = {};
  if (d.title     !== undefined) r.title      = d.title;
  if (d.director  !== undefined) r.director   = d.director  ?? null;
  if (d.year      !== undefined) r.year       = d.year      ?? null;
  if (d.posterUrl !== undefined) r.poster_url = d.posterUrl ?? null;
  if (d.tmdbId    !== undefined) r.tmdb_id    = d.tmdbId    ?? null;
  if (d.genres    !== undefined) r.genres     = d.genres    ?? [];
  if (d.status    !== undefined) r.status     = d.status;
  if (d.rating    !== undefined) r.rating     = d.rating    ?? null;
  if (d.notes     !== undefined) r.notes      = d.notes     ?? null;
  if (d.watchedAt !== undefined) r.watched_at = d.watchedAt ?? null;
  if (d.runtime   !== undefined) r.runtime    = d.runtime   ?? null;
  return r;
}

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[Supabase] ${ctx}: ${error?.message ?? "unknown error"}`);
}

// ─── SupabaseRepository ───────────────────────────────────────
export class SupabaseRepository implements DataRepository {
  // ── Clients ─────────────────────────────────────────────────
  async listClients(opts?: { status?: Client["status"] }): Promise<Client[]> {
    let q = supabase.from("clients").select("*").order("created_at");
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) fail(error, "listClients");
    return (data as ClientRow[]).map(fromClientRow);
  }
  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getClient");
    return data ? fromClientRow(data as ClientRow) : undefined;
  }
  async createClient(input: ClientInput): Promise<Client> {
    const row = { id: uuid(), created_at: now(), ...toClientRow(input) };
    const { data, error } = await supabase.from("clients").insert(row).select().single();
    if (error) fail(error, "createClient");
    return fromClientRow(data as ClientRow);
  }
  async updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
    const { data, error } = await supabase.from("clients").update(toClientRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateClient");
    return fromClientRow(data as ClientRow);
  }
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) fail(error, "deleteClient");
  }

  // ── Projects ─────────────────────────────────────────────────
  async listProjects(opts?: { clientId?: string; status?: Project["status"] }): Promise<Project[]> {
    let q = supabase.from("projects").select("*").order("created_at");
    if (opts?.clientId) q = q.eq("client_id", opts.clientId);
    if (opts?.status)   q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) fail(error, "listProjects");
    return (data as ProjectRow[]).map(fromProjectRow);
  }
  async getProject(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getProject");
    return data ? fromProjectRow(data as ProjectRow) : undefined;
  }
  async createProject(input: ProjectInput): Promise<Project> {
    const row = { id: uuid(), created_at: now(), ...toProjectRow(input) };
    const { data, error } = await supabase.from("projects").insert(row).select().single();
    if (error) fail(error, "createProject");
    return fromProjectRow(data as ProjectRow);
  }
  async updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
    const { data, error } = await supabase.from("projects").update(toProjectRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateProject");
    return fromProjectRow(data as ProjectRow);
  }
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) fail(error, "deleteProject");
  }

  // ── Tasks ────────────────────────────────────────────────────
  async listTasks(opts?: { projectId?: string; clientId?: string; done?: boolean }): Promise<Task[]> {
    let q = supabase.from("tasks").select("*").order("order");
    if (opts?.projectId)           q = q.eq("project_id", opts.projectId);
    else if (opts?.clientId)       q = q.eq("client_id", opts.clientId);
    if (typeof opts?.done === "boolean") q = q.eq("done", opts.done);
    const { data, error } = await q;
    if (error) fail(error, "listTasks");
    return (data as TaskRow[]).map(fromTaskRow);
  }
  async getTask(id: string): Promise<Task | undefined> {
    const { data, error } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getTask");
    return data ? fromTaskRow(data as TaskRow) : undefined;
  }
  async createTask(input: TaskInput): Promise<Task> {
    const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("project_id", input.projectId);
    const row = { id: uuid(), created_at: now(), order: count ?? 0, ...toTaskRow(input) };
    const { data, error } = await supabase.from("tasks").insert(row).select().single();
    if (error) fail(error, "createTask");
    return fromTaskRow(data as TaskRow);
  }
  async updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
    const { data, error } = await supabase.from("tasks").update(toTaskRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateTask");
    return fromTaskRow(data as TaskRow);
  }
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) fail(error, "deleteTask");
  }
  async reorderTasks(_projectId: string, orderedIds: string[]): Promise<void> {
    const results = await Promise.all(
      orderedIds.map((id, i) => supabase.from("tasks").update({ order: i }).eq("id", id))
    );
    const failed = results.find(r => r.error);
    if (failed?.error) fail(failed.error, "reorderTasks");
  }

  // ── Time Logs ────────────────────────────────────────────────
  async listTimeLogs(opts?: { clientId?: string; projectId?: string; since?: string; until?: string }): Promise<TimeLog[]> {
    let q = supabase.from("time_logs").select("*").order("date");
    if (opts?.clientId)       q = q.eq("client_id", opts.clientId);
    else if (opts?.projectId) q = q.eq("project_id", opts.projectId);
    if (opts?.since) q = q.gte("date", opts.since);
    if (opts?.until) q = q.lte("date", opts.until);
    const { data, error } = await q;
    if (error) fail(error, "listTimeLogs");
    return (data as TimeLogRow[]).map(fromTimeLogRow);
  }
  async createTimeLog(input: TimeLogInput): Promise<TimeLog> {
    const row = { id: uuid(), created_at: now(), ...toTimeLogRow(input) };
    const { data, error } = await supabase.from("time_logs").insert(row).select().single();
    if (error) fail(error, "createTimeLog");
    return fromTimeLogRow(data as TimeLogRow);
  }
  async updateTimeLog(id: string, input: Partial<TimeLogInput>): Promise<TimeLog> {
    const { data, error } = await supabase.from("time_logs").update(toTimeLogRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateTimeLog");
    return fromTimeLogRow(data as TimeLogRow);
  }
  async deleteTimeLog(id: string): Promise<void> {
    const { error } = await supabase.from("time_logs").delete().eq("id", id);
    if (error) fail(error, "deleteTimeLog");
  }

  // ── Deliverables ─────────────────────────────────────────────
  async listDeliverables(opts?: { clientId?: string; projectId?: string }): Promise<Deliverable[]> {
    let q = supabase.from("deliverables").select("*").order("delivered_at", { ascending: false });
    if (opts?.clientId)       q = q.eq("client_id", opts.clientId);
    else if (opts?.projectId) q = q.eq("project_id", opts.projectId);
    const { data, error } = await q;
    if (error) fail(error, "listDeliverables");
    return (data as DeliverableRow[]).map(fromDeliverableRow);
  }
  async createDeliverable(input: DeliverableInput): Promise<Deliverable> {
    const row = { id: uuid(), created_at: now(), ...toDeliverableRow(input) };
    const { data, error } = await supabase.from("deliverables").insert(row).select().single();
    if (error) fail(error, "createDeliverable");
    return fromDeliverableRow(data as DeliverableRow);
  }
  async updateDeliverable(id: string, input: Partial<DeliverableInput>): Promise<Deliverable> {
    const { data, error } = await supabase.from("deliverables").update(toDeliverableRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateDeliverable");
    return fromDeliverableRow(data as DeliverableRow);
  }
  async deleteDeliverable(id: string): Promise<void> {
    const { error } = await supabase.from("deliverables").delete().eq("id", id);
    if (error) fail(error, "deleteDeliverable");
  }

  // ── Books ────────────────────────────────────────────────────
  async listBooks(opts?: { status?: Book["status"] }): Promise<Book[]> {
    let q = supabase.from("books").select("*").order("created_at", { ascending: false });
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) fail(error, "listBooks");
    return (data as BookRow[]).map(fromBookRow);
  }
  async getBook(id: string): Promise<Book | undefined> {
    const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getBook");
    return data ? fromBookRow(data as BookRow) : undefined;
  }
  async createBook(input: BookInput): Promise<Book> {
    const row = { id: uuid(), created_at: now(), ...toBookRow(input) };
    const { data, error } = await supabase.from("books").insert(row).select().single();
    if (error) fail(error, "createBook");
    return fromBookRow(data as BookRow);
  }
  async updateBook(id: string, input: Partial<BookInput>): Promise<Book> {
    const { data, error } = await supabase.from("books").update(toBookRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateBook");
    return fromBookRow(data as BookRow);
  }
  async deleteBook(id: string): Promise<void> {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) fail(error, "deleteBook");
  }

  // ── Movies ───────────────────────────────────────────────────
  async listMovies(opts?: { status?: Movie["status"] }): Promise<Movie[]> {
    let q = supabase.from("movies").select("*").order("created_at", { ascending: false });
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) fail(error, "listMovies");
    return (data as MovieRow[]).map(fromMovieRow);
  }
  async getMovie(id: string): Promise<Movie | undefined> {
    const { data, error } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getMovie");
    return data ? fromMovieRow(data as MovieRow) : undefined;
  }
  async createMovie(input: MovieInput): Promise<Movie> {
    const row = { id: uuid(), created_at: now(), ...toMovieRow(input) };
    const { data, error } = await supabase.from("movies").insert(row).select().single();
    if (error) fail(error, "createMovie");
    return fromMovieRow(data as MovieRow);
  }
  async updateMovie(id: string, input: Partial<MovieInput>): Promise<Movie> {
    const { data, error } = await supabase.from("movies").update(toMovieRow(input)).eq("id", id).select().single();
    if (error) fail(error, "updateMovie");
    return fromMovieRow(data as MovieRow);
  }
  async deleteMovie(id: string): Promise<void> {
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) fail(error, "deleteMovie");
  }

  // ── Export / Import ──────────────────────────────────────────
  async exportAll(): Promise<ExportSnapshot> {
    const [c, p, t, l, d, b, m] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("time_logs").select("*"),
      supabase.from("deliverables").select("*"),
      supabase.from("books").select("*"),
      supabase.from("movies").select("*"),
    ]);
    return {
      version: 1, exportedAt: now(),
      clients:      ((c.data ?? []) as ClientRow[]).map(fromClientRow),
      projects:     ((p.data ?? []) as ProjectRow[]).map(fromProjectRow),
      tasks:        ((t.data ?? []) as TaskRow[]).map(fromTaskRow),
      timeLogs:     ((l.data ?? []) as TimeLogRow[]).map(fromTimeLogRow),
      deliverables: ((d.data ?? []) as DeliverableRow[]).map(fromDeliverableRow),
      books:        ((b.data ?? []) as BookRow[]).map(fromBookRow),
      movies:       ((m.data ?? []) as MovieRow[]).map(fromMovieRow),
    };
  }

  async importAll(snapshot: ExportSnapshot, merge = false): Promise<void> {
    if (!merge) await this.clearAll();
    await Promise.all([
      supabase.from("clients").upsert(
        snapshot.clients.map(e => ({ ...toClientRow(e), id: e.id, created_at: e.createdAt }))
      ),
      supabase.from("books").upsert(
        snapshot.books.map(e => ({ ...toBookRow(e), id: e.id, created_at: e.createdAt }))
      ),
      supabase.from("movies").upsert(
        snapshot.movies.map(e => ({ ...toMovieRow(e), id: e.id, created_at: e.createdAt }))
      ),
    ]);
    // projects/tasks/timeLogs/deliverables depend on clients — insert after
    await Promise.all([
      supabase.from("projects").upsert(
        snapshot.projects.map(e => ({ ...toProjectRow(e), id: e.id, created_at: e.createdAt }))
      ),
    ]);
    await Promise.all([
      supabase.from("tasks").upsert(
        snapshot.tasks.map(e => ({ ...toTaskRow(e), id: e.id, order: e.order, created_at: e.createdAt }))
      ),
      supabase.from("time_logs").upsert(
        snapshot.timeLogs.map(e => ({ ...toTimeLogRow(e), id: e.id, created_at: e.createdAt }))
      ),
      supabase.from("deliverables").upsert(
        snapshot.deliverables.map(e => ({ ...toDeliverableRow(e), id: e.id, created_at: e.createdAt }))
      ),
    ]);
  }

  async clearAll(): Promise<void> {
    // respect FK order: tasks/time_logs/deliverables before projects before clients
    await supabase.from("tasks").delete().not("id", "is", null);
    await supabase.from("time_logs").delete().not("id", "is", null);
    await supabase.from("deliverables").delete().not("id", "is", null);
    await supabase.from("projects").delete().not("id", "is", null);
    await supabase.from("clients").delete().not("id", "is", null);
    await supabase.from("books").delete().not("id", "is", null);
    await supabase.from("movies").delete().not("id", "is", null);
  }
}

export const supabaseRepo: DataRepository = new SupabaseRepository();
