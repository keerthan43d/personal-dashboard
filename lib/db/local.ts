"use client";
/**
 * LocalRepository — Dexie (IndexedDB) implementation.
 * Same interface as DataRepository; Supabase adapter plugs in identically.
 */
import Dexie, { type Table } from "dexie";
import { v4 as uuid } from "uuid";
import type {
  Client,    ClientInput,
  Project,   ProjectInput,
  Task,      TaskInput,
  TimeLog,   TimeLogInput,
  Deliverable, DeliverableInput,
  Book,      BookInput,
  Movie,     MovieInput,
  TvShow,    TvShowInput,
  JournalEntry,  JournalEntryInput,
  ProblemLog,    ProblemLogInput,
  JournalHabit,  JournalHabitInput,
  ExportSnapshot,
} from "./schemas";
import type { DataRepository } from "./repository";

// ─── Dexie schema ─────────────────────────────────────────────
class CommandChamberDB extends Dexie {
  clients!:       Table<Client>;
  projects!:      Table<Project>;
  tasks!:         Table<Task>;
  timeLogs!:      Table<TimeLog>;
  deliverables!:  Table<Deliverable>;
  books!:         Table<Book>;
  movies!:        Table<Movie>;
  tvShows!:       Table<TvShow>;
  journalEntries!: Table<JournalEntry>;
  problemLogs!:   Table<ProblemLog>;
  journalHabits!: Table<JournalHabit>;

  constructor() {
    super("CommandChamberDB");
    this.version(1).stores({
      clients:      "id, status, createdAt",
      projects:     "id, clientId, status, deadline, createdAt",
      tasks:        "id, projectId, clientId, done, order, createdAt",
      timeLogs:     "id, clientId, projectId, date, createdAt",
      deliverables: "id, clientId, projectId, deliveredAt, createdAt",
      books:        "id, status, createdAt, finishedAt",
      movies:       "id, status, createdAt, watchedAt",
    });
    this.version(2).stores({
      clients:       "id, status, createdAt",
      projects:      "id, clientId, status, deadline, createdAt",
      tasks:         "id, projectId, clientId, done, order, createdAt",
      timeLogs:      "id, clientId, projectId, date, createdAt",
      deliverables:  "id, clientId, projectId, deliveredAt, createdAt",
      books:         "id, status, createdAt, finishedAt",
      movies:        "id, status, createdAt, watchedAt",
      journalEntries: "id, date, updatedAt",
      problemLogs:   "id, entryDate, createdAt, *tags",
      journalHabits: "id, order, active",
    });
    this.version(3).stores({
      clients:       "id, status, createdAt",
      projects:      "id, clientId, status, deadline, createdAt",
      tasks:         "id, projectId, clientId, done, order, createdAt",
      timeLogs:      "id, clientId, projectId, date, createdAt",
      deliverables:  "id, clientId, projectId, deliveredAt, createdAt",
      books:         "id, status, createdAt, finishedAt",
      movies:        "id, status, createdAt, watchedAt",
      tvShows:       "id, status, createdAt, watchedAt",
      journalEntries: "id, date, updatedAt",
      problemLogs:   "id, entryDate, createdAt, *tags",
      journalHabits: "id, order, active",
    });
  }
}

export const db = new CommandChamberDB();

// ─── Helper ───────────────────────────────────────────────────
const now = () => new Date().toISOString();

// ─── LocalRepository ──────────────────────────────────────────
export class LocalRepository implements DataRepository {
  // ── Clients ─────────────────────────────────────────────────
  async listClients(opts?: { status?: Client["status"] }): Promise<Client[]> {
    let q = db.clients.orderBy("createdAt");
    const all = await q.toArray();
    return opts?.status ? all.filter((c) => c.status === opts.status) : all;
  }

  async getClient(id: string): Promise<Client | undefined> {
    return db.clients.get(id);
  }

  async createClient(data: ClientInput): Promise<Client> {
    const client: Client = { ...data, id: uuid(), createdAt: now() };
    await db.clients.add(client);
    return client;
  }

  async updateClient(id: string, data: Partial<ClientInput>): Promise<Client> {
    await db.clients.update(id, data);
    return (await db.clients.get(id))!;
  }

  async deleteClient(id: string): Promise<void> {
    // cascade delete
    const projectIds = (await db.projects.where("clientId").equals(id).toArray()).map(p => p.id);
    await db.tasks.where("projectId").anyOf(projectIds).delete();
    await db.projects.where("clientId").equals(id).delete();
    await db.timeLogs.where("clientId").equals(id).delete();
    await db.deliverables.where("clientId").equals(id).delete();
    await db.clients.delete(id);
  }

  // ── Projects ─────────────────────────────────────────────────
  async listProjects(opts?: { clientId?: string; status?: Project["status"] }): Promise<Project[]> {
    let all: Project[];
    if (opts?.clientId) {
      all = await db.projects.where("clientId").equals(opts.clientId).toArray();
    } else {
      all = await db.projects.orderBy("createdAt").toArray();
    }
    return opts?.status ? all.filter((p) => p.status === opts.status) : all;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  async createProject(data: ProjectInput): Promise<Project> {
    const project: Project = { ...data, id: uuid(), createdAt: now() };
    await db.projects.add(project);
    return project;
  }

  async updateProject(id: string, data: Partial<ProjectInput>): Promise<Project> {
    await db.projects.update(id, data);
    return (await db.projects.get(id))!;
  }

  async deleteProject(id: string): Promise<void> {
    await db.tasks.where("projectId").equals(id).delete();
    await db.timeLogs.where("projectId").equals(id).delete();
    await db.deliverables.where("projectId").equals(id).delete();
    await db.projects.delete(id);
  }

  // ── Tasks ────────────────────────────────────────────────────
  async listTasks(opts?: { projectId?: string; clientId?: string; done?: boolean }): Promise<Task[]> {
    let all: Task[];
    if (opts?.projectId) {
      all = await db.tasks.where("projectId").equals(opts.projectId).sortBy("order");
    } else if (opts?.clientId) {
      all = await db.tasks.where("clientId").equals(opts.clientId).toArray();
    } else {
      all = await db.tasks.orderBy("order").toArray();
    }
    if (typeof opts?.done === "boolean") {
      all = all.filter((t) => t.done === opts.done);
    }
    return all;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async createTask(data: TaskInput): Promise<Task> {
    const count = await db.tasks.where("projectId").equals(data.projectId).count();
    const task: Task = { ...data, id: uuid(), order: count, createdAt: now() };
    await db.tasks.add(task);
    return task;
  }

  async updateTask(id: string, data: Partial<TaskInput>): Promise<Task> {
    await db.tasks.update(id, data);
    return (await db.tasks.get(id))!;
  }

  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  }

  async reorderTasks(projectId: string, orderedIds: string[]): Promise<void> {
    await db.transaction("rw", db.tasks, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.tasks.update(orderedIds[i], { order: i });
      }
    });
  }

  // ── Time Logs ────────────────────────────────────────────────
  async listTimeLogs(opts?: { clientId?: string; projectId?: string; since?: string; until?: string }): Promise<TimeLog[]> {
    let all: TimeLog[];
    if (opts?.clientId) {
      all = await db.timeLogs.where("clientId").equals(opts.clientId).toArray();
    } else if (opts?.projectId) {
      all = await db.timeLogs.where("projectId").equals(opts.projectId).toArray();
    } else {
      all = await db.timeLogs.orderBy("date").toArray();
    }
    if (opts?.since) all = all.filter((t) => t.date >= opts.since!);
    if (opts?.until) all = all.filter((t) => t.date <= opts.until!);
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }

  async createTimeLog(data: TimeLogInput): Promise<TimeLog> {
    const log: TimeLog = { ...data, id: uuid(), createdAt: now() };
    await db.timeLogs.add(log);
    return log;
  }

  async updateTimeLog(id: string, data: Partial<TimeLogInput>): Promise<TimeLog> {
    await db.timeLogs.update(id, data);
    return (await db.timeLogs.get(id))!;
  }

  async deleteTimeLog(id: string): Promise<void> {
    await db.timeLogs.delete(id);
  }

  // ── Deliverables ─────────────────────────────────────────────
  async listDeliverables(opts?: { clientId?: string; projectId?: string }): Promise<Deliverable[]> {
    let all: Deliverable[];
    if (opts?.clientId) {
      all = await db.deliverables.where("clientId").equals(opts.clientId).toArray();
    } else if (opts?.projectId) {
      all = await db.deliverables.where("projectId").equals(opts.projectId).toArray();
    } else {
      all = await db.deliverables.orderBy("deliveredAt").toArray();
    }
    return all.sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt));
  }

  async createDeliverable(data: DeliverableInput): Promise<Deliverable> {
    const d: Deliverable = { ...data, id: uuid(), createdAt: now() };
    await db.deliverables.add(d);
    return d;
  }

  async updateDeliverable(id: string, data: Partial<DeliverableInput>): Promise<Deliverable> {
    await db.deliverables.update(id, data);
    return (await db.deliverables.get(id))!;
  }

  async deleteDeliverable(id: string): Promise<void> {
    await db.deliverables.delete(id);
  }

  // ── Books ────────────────────────────────────────────────────
  async listBooks(opts?: { status?: Book["status"] }): Promise<Book[]> {
    const all = await db.books.orderBy("createdAt").reverse().toArray();
    return opts?.status ? all.filter((b) => b.status === opts.status) : all;
  }

  async getBook(id: string): Promise<Book | undefined> {
    return db.books.get(id);
  }

  async createBook(data: BookInput): Promise<Book> {
    const book: Book = { ...data, id: uuid(), createdAt: now() };
    await db.books.add(book);
    return book;
  }

  async updateBook(id: string, data: Partial<BookInput>): Promise<Book> {
    await db.books.update(id, data);
    return (await db.books.get(id))!;
  }

  async deleteBook(id: string): Promise<void> {
    await db.books.delete(id);
  }

  // ── Movies ───────────────────────────────────────────────────
  async listMovies(opts?: { status?: Movie["status"] }): Promise<Movie[]> {
    const all = await db.movies.orderBy("createdAt").reverse().toArray();
    return opts?.status ? all.filter((m) => m.status === opts.status) : all;
  }

  async getMovie(id: string): Promise<Movie | undefined> {
    return db.movies.get(id);
  }

  async createMovie(data: MovieInput): Promise<Movie> {
    const movie: Movie = { ...data, id: uuid(), createdAt: now() };
    await db.movies.add(movie);
    return movie;
  }

  async updateMovie(id: string, data: Partial<MovieInput>): Promise<Movie> {
    await db.movies.update(id, data);
    return (await db.movies.get(id))!;
  }

  async deleteMovie(id: string): Promise<void> {
    await db.movies.delete(id);
  }

  // ── TV Shows ─────────────────────────────────────────────────
  async listTvShows(opts?: { status?: TvShow["status"] }): Promise<TvShow[]> {
    const all = await db.tvShows.orderBy("createdAt").reverse().toArray();
    return opts?.status ? all.filter((s) => s.status === opts.status) : all;
  }

  async getTvShow(id: string): Promise<TvShow | undefined> {
    return db.tvShows.get(id);
  }

  async createTvShow(data: TvShowInput): Promise<TvShow> {
    const show: TvShow = { ...data, id: uuid(), createdAt: now() };
    await db.tvShows.add(show);
    return show;
  }

  async updateTvShow(id: string, data: Partial<TvShowInput>): Promise<TvShow> {
    await db.tvShows.update(id, data);
    return (await db.tvShows.get(id))!;
  }

  async deleteTvShow(id: string): Promise<void> {
    await db.tvShows.delete(id);
  }

  // ── Journal Entries ──────────────────────────────────────────
  async listJournalEntries(opts?: { since?: string; until?: string }): Promise<JournalEntry[]> {
    let all = await db.journalEntries.orderBy("date").toArray();
    if (opts?.since) all = all.filter((e) => e.date >= opts.since!);
    if (opts?.until) all = all.filter((e) => e.date <= opts.until!);
    return all.reverse();
  }

  async getJournalEntry(date: string): Promise<JournalEntry | undefined> {
    return db.journalEntries.where("date").equals(date).first();
  }

  async upsertJournalEntry(data: JournalEntryInput & { id?: string }): Promise<JournalEntry> {
    const existing = await db.journalEntries.where("date").equals(data.date).first();
    if (existing) {
      const updated: JournalEntry = { ...existing, ...data, updatedAt: now() };
      await db.journalEntries.put(updated);
      return updated;
    }
    const entry: JournalEntry = { ...data, id: data.id ?? uuid(), createdAt: now(), updatedAt: now() };
    await db.journalEntries.add(entry);
    return entry;
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.journalEntries.delete(id);
  }

  // ── Problem Logs ─────────────────────────────────────────────
  async listProblemLogs(opts?: { entryDate?: string; tag?: string; search?: string }): Promise<ProblemLog[]> {
    let all: ProblemLog[];
    if (opts?.tag) {
      all = await db.problemLogs.where("tags").equals(opts.tag).toArray();
    } else if (opts?.entryDate) {
      all = await db.problemLogs.where("entryDate").equals(opts.entryDate).toArray();
    } else {
      all = await db.problemLogs.orderBy("createdAt").reverse().toArray();
    }
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      all = all.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.whatTheProblemWas?.toLowerCase().includes(q) ||
        p.context?.toLowerCase().includes(q) ||
        p.whatSolvedIt?.toLowerCase().includes(q) ||
        p.whyItWorked?.toLowerCase().includes(q)
      );
    }
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getProblemLog(id: string): Promise<ProblemLog | undefined> {
    return db.problemLogs.get(id);
  }

  async createProblemLog(data: ProblemLogInput): Promise<ProblemLog> {
    const problem: ProblemLog = { ...data, id: uuid(), createdAt: now(), updatedAt: now() };
    await db.problemLogs.add(problem);
    return problem;
  }

  async updateProblemLog(id: string, data: Partial<ProblemLogInput>): Promise<ProblemLog> {
    await db.problemLogs.update(id, { ...data, updatedAt: now() });
    return (await db.problemLogs.get(id))!;
  }

  async deleteProblemLog(id: string): Promise<void> {
    await db.problemLogs.delete(id);
  }

  // ── Journal Habits ───────────────────────────────────────────
  async listJournalHabits(): Promise<JournalHabit[]> {
    return db.journalHabits.orderBy("order").toArray();
  }

  async createJournalHabit(data: JournalHabitInput): Promise<JournalHabit> {
    const count = await db.journalHabits.count();
    const habit: JournalHabit = { ...data, order: data.order ?? count, id: uuid(), createdAt: now() };
    await db.journalHabits.add(habit);
    return habit;
  }

  async updateJournalHabit(id: string, data: Partial<JournalHabitInput>): Promise<JournalHabit> {
    await db.journalHabits.update(id, data);
    return (await db.journalHabits.get(id))!;
  }

  async deleteJournalHabit(id: string): Promise<void> {
    await db.journalHabits.delete(id);
  }

  async reorderJournalHabits(orderedIds: string[]): Promise<void> {
    await db.transaction("rw", db.journalHabits, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.journalHabits.update(orderedIds[i], { order: i });
      }
    });
  }

  // ── Export / Import ──────────────────────────────────────────
  async exportAll(): Promise<ExportSnapshot> {
    const [clients, projects, tasks, timeLogs, deliverables, books, movies, tvShows, journalEntries, problemLogs, journalHabits] =
      await Promise.all([
        db.clients.toArray(),
        db.projects.toArray(),
        db.tasks.toArray(),
        db.timeLogs.toArray(),
        db.deliverables.toArray(),
        db.books.toArray(),
        db.movies.toArray(),
        db.tvShows.toArray(),
        db.journalEntries.toArray(),
        db.problemLogs.toArray(),
        db.journalHabits.toArray(),
      ]);
    return { version: 3, exportedAt: now(), clients, projects, tasks, timeLogs, deliverables, books, movies, tvShows, journalEntries, problemLogs, journalHabits };
  }

  async importAll(snapshot: ExportSnapshot, merge = false): Promise<void> {
    await db.transaction("rw", [
      db.clients, db.projects, db.tasks, db.timeLogs, db.deliverables,
      db.books, db.movies, db.tvShows, db.journalEntries, db.problemLogs, db.journalHabits,
    ], async () => {
      if (!merge) await this.clearAll();
      await db.clients.bulkPut(snapshot.clients);
      await db.projects.bulkPut(snapshot.projects);
      await db.tasks.bulkPut(snapshot.tasks);
      await db.timeLogs.bulkPut(snapshot.timeLogs);
      await db.deliverables.bulkPut(snapshot.deliverables);
      await db.books.bulkPut(snapshot.books);
      await db.movies.bulkPut(snapshot.movies);
      if (snapshot.tvShows)        await db.tvShows.bulkPut(snapshot.tvShows);
      if (snapshot.journalEntries) await db.journalEntries.bulkPut(snapshot.journalEntries);
      if (snapshot.problemLogs)    await db.problemLogs.bulkPut(snapshot.problemLogs);
      if (snapshot.journalHabits)  await db.journalHabits.bulkPut(snapshot.journalHabits);
    });
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      db.clients.clear(), db.projects.clear(), db.tasks.clear(),
      db.timeLogs.clear(), db.deliverables.clear(), db.books.clear(),
      db.movies.clear(), db.tvShows.clear(),
      db.journalEntries.clear(), db.problemLogs.clear(), db.journalHabits.clear(),
    ]);
  }
}

// Singleton
export const repo: DataRepository = new LocalRepository();
