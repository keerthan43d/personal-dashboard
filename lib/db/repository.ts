/**
 * DataRepository interface — all UI code imports from here.
 * Swap the adapter (local.ts → supabase.ts) without touching any UI.
 */
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
  OneProject,    OneProjectInput,
  DeepWorkLog,   DeepWorkLogInput,
  UrgeLog,       UrgeLogInput,
  WeeklyScorecard, WeeklyScorecardInput,
  ShipLog,       ShipLogInput,
  ExportSnapshot,
} from "./schemas";

export interface DataRepository {
  // ── Clients ─────────────────────────────────────────────────
  listClients(opts?: { status?: Client["status"] }): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(data: ClientInput): Promise<Client>;
  updateClient(id: string, data: Partial<ClientInput>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // ── Projects ─────────────────────────────────────────────────
  listProjects(opts?: { clientId?: string; status?: Project["status"] }): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(data: ProjectInput): Promise<Project>;
  updateProject(id: string, data: Partial<ProjectInput>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // ── Tasks ────────────────────────────────────────────────────
  listTasks(opts?: { projectId?: string; clientId?: string; done?: boolean }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(data: TaskInput): Promise<Task>;
  updateTask(id: string, data: Partial<TaskInput>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  reorderTasks(projectId: string, orderedIds: string[]): Promise<void>;

  // ── Time Logs ────────────────────────────────────────────────
  listTimeLogs(opts?: { clientId?: string; projectId?: string; since?: string; until?: string }): Promise<TimeLog[]>;
  createTimeLog(data: TimeLogInput): Promise<TimeLog>;
  updateTimeLog(id: string, data: Partial<TimeLogInput>): Promise<TimeLog>;
  deleteTimeLog(id: string): Promise<void>;

  // ── Deliverables ─────────────────────────────────────────────
  listDeliverables(opts?: { clientId?: string; projectId?: string }): Promise<Deliverable[]>;
  createDeliverable(data: DeliverableInput): Promise<Deliverable>;
  updateDeliverable(id: string, data: Partial<DeliverableInput>): Promise<Deliverable>;
  deleteDeliverable(id: string): Promise<void>;

  // ── Books ────────────────────────────────────────────────────
  listBooks(opts?: { status?: Book["status"] }): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  createBook(data: BookInput): Promise<Book>;
  updateBook(id: string, data: Partial<BookInput>): Promise<Book>;
  deleteBook(id: string): Promise<void>;

  // ── Movies ───────────────────────────────────────────────────
  listMovies(opts?: { status?: Movie["status"] }): Promise<Movie[]>;
  getMovie(id: string): Promise<Movie | undefined>;
  createMovie(data: MovieInput): Promise<Movie>;
  updateMovie(id: string, data: Partial<MovieInput>): Promise<Movie>;
  deleteMovie(id: string): Promise<void>;

  // ── TV Shows ─────────────────────────────────────────────────
  listTvShows(opts?: { status?: TvShow["status"] }): Promise<TvShow[]>;
  getTvShow(id: string): Promise<TvShow | undefined>;
  createTvShow(data: TvShowInput): Promise<TvShow>;
  updateTvShow(id: string, data: Partial<TvShowInput>): Promise<TvShow>;
  deleteTvShow(id: string): Promise<void>;

  // ── Journal Entries ──────────────────────────────────────────
  listJournalEntries(opts?: { since?: string; until?: string }): Promise<JournalEntry[]>;
  getJournalEntry(date: string): Promise<JournalEntry | undefined>;
  upsertJournalEntry(data: JournalEntryInput & { id?: string }): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<void>;

  // ── Problem Logs ─────────────────────────────────────────────
  listProblemLogs(opts?: { entryDate?: string; tag?: string; search?: string }): Promise<ProblemLog[]>;
  getProblemLog(id: string): Promise<ProblemLog | undefined>;
  createProblemLog(data: ProblemLogInput): Promise<ProblemLog>;
  updateProblemLog(id: string, data: Partial<ProblemLogInput>): Promise<ProblemLog>;
  deleteProblemLog(id: string): Promise<void>;

  // ── Journal Habits ───────────────────────────────────────────
  listJournalHabits(): Promise<JournalHabit[]>;
  createJournalHabit(data: JournalHabitInput): Promise<JournalHabit>;
  updateJournalHabit(id: string, data: Partial<JournalHabitInput>): Promise<JournalHabit>;
  deleteJournalHabit(id: string): Promise<void>;
  reorderJournalHabits(orderedIds: string[]): Promise<void>;

  // ── ONE Project ──────────────────────────────────────────────
  getActiveOneProject(): Promise<OneProject | undefined>;
  listOneProjects(): Promise<OneProject[]>;
  createOneProject(data: OneProjectInput): Promise<OneProject>;
  updateOneProject(id: string, data: Partial<OneProjectInput>): Promise<OneProject>;
  deleteOneProject(id: string): Promise<void>;

  // ── Deep Work Logs ──────────────────────────────────────────
  listDeepWorkLogs(opts?: { entryDate?: string }): Promise<DeepWorkLog[]>;
  createDeepWorkLog(data: DeepWorkLogInput): Promise<DeepWorkLog>;
  updateDeepWorkLog(id: string, data: Partial<DeepWorkLogInput>): Promise<DeepWorkLog>;
  deleteDeepWorkLog(id: string): Promise<void>;

  // ── Urge Logs ───────────────────────────────────────────────
  listUrgeLogs(opts?: { entryDate?: string }): Promise<UrgeLog[]>;
  createUrgeLog(data: UrgeLogInput): Promise<UrgeLog>;
  deleteUrgeLog(id: string): Promise<void>;

  // ── Weekly Scorecards ───────────────────────────────────────
  getWeeklyScorecard(weekStart: string): Promise<WeeklyScorecard | undefined>;
  listWeeklyScorecards(): Promise<WeeklyScorecard[]>;
  upsertWeeklyScorecard(data: WeeklyScorecardInput & { id?: string }): Promise<WeeklyScorecard>;

  // ── Ship Logs ───────────────────────────────────────────────
  listShipLogs(opts?: { entryDate?: string; type?: ShipLog["type"] }): Promise<ShipLog[]>;
  createShipLog(data: ShipLogInput): Promise<ShipLog>;
  updateShipLog(id: string, data: Partial<ShipLogInput>): Promise<ShipLog>;
  deleteShipLog(id: string): Promise<void>;

  // ── Export / Import ──────────────────────────────────────────
  exportAll(): Promise<ExportSnapshot>;
  importAll(snapshot: ExportSnapshot, merge?: boolean): Promise<void>;
  clearAll(): Promise<void>;
}
