import { z } from "zod";

// ─── Primitives ────────────────────────────────────────────────
export const isoDate = z.string().datetime({ offset: true }).optional();

// ─── Client ───────────────────────────────────────────────────
export const ClientSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1),
  company:     z.string().optional(),
  email:       z.string().email().optional(),
  avatar:      z.string().optional(), // URL or initials fallback
  status:      z.enum(["active", "paused", "done", "archived"]).default("active"),
  hourlyRate:  z.number().positive().optional(),
  currency:    z.string().default("USD"),
  notes:       z.string().optional(),
  createdAt:   z.string().datetime({ offset: true }),
  archivedAt:  z.string().datetime({ offset: true }).optional(),
});
export type Client = z.infer<typeof ClientSchema>;

// ─── Project ──────────────────────────────────────────────────
export const ProjectSchema = z.object({
  id:             z.string().uuid(),
  clientId:       z.string().uuid(),
  title:          z.string().min(1),
  description:    z.string().optional(),
  status:         z.enum(["active", "blocked", "review", "done"]).default("active"),
  deadline:       z.string().optional(), // ISO date string (date only)
  paymentAmount:  z.number().nonnegative().optional(),
  paymentStatus:  z.enum(["unpaid", "partial", "paid"]).default("unpaid"),
  notes:          z.string().optional(),
  createdAt:      z.string().datetime({ offset: true }),
  completedAt:    z.string().datetime({ offset: true }).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

// ─── Task ─────────────────────────────────────────────────────
export const TaskSchema = z.object({
  id:          z.string().uuid(),
  projectId:   z.string().uuid(),
  clientId:    z.string().uuid(), // denormalized for fast queries
  title:       z.string().min(1),
  done:        z.boolean().default(false),
  order:       z.number().int().nonnegative().default(0),
  createdAt:   z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// ─── TimeLog ──────────────────────────────────────────────────
export const TimeLogSchema = z.object({
  id:          z.string().uuid(),
  clientId:    z.string().uuid(),
  projectId:   z.string().uuid().optional(),
  date:        z.string(), // "YYYY-MM-DD"
  hours:       z.number().positive().max(24),
  description: z.string().optional(),
  createdAt:   z.string().datetime({ offset: true }),
});
export type TimeLog = z.infer<typeof TimeLogSchema>;

// ─── Deliverable ──────────────────────────────────────────────
export const DeliverableSchema = z.object({
  id:          z.string().uuid(),
  clientId:    z.string().uuid(),
  projectId:   z.string().uuid().optional(),
  title:       z.string().min(1),
  type:        z.enum(["video", "design", "copy", "brand", "code", "strategy", "other"]).default("other"),
  url:         z.string().url().optional(),
  deliveredAt: z.string(), // "YYYY-MM-DD"
  notes:       z.string().optional(),
  createdAt:   z.string().datetime({ offset: true }),
});
export type Deliverable = z.infer<typeof DeliverableSchema>;

// ─── Book ─────────────────────────────────────────────────────
export const BookSchema = z.object({
  id:          z.string().uuid(),
  title:       z.string().min(1),
  author:      z.string().min(1),
  coverUrl:    z.string().optional(),
  isbn:        z.string().optional(),
  genre:       z.string().optional(),
  status:      z.enum(["reading", "finished", "dnf", "wishlist"]).default("wishlist"),
  rating:      z.number().int().min(1).max(5).optional(),
  takeaways:   z.array(z.string()).default([]),
  startedAt:   z.string().optional(), // "YYYY-MM-DD"
  finishedAt:  z.string().optional(), // "YYYY-MM-DD"
  notes:       z.string().optional(),
  pages:       z.number().int().positive().optional(),
  createdAt:   z.string().datetime({ offset: true }),
});
export type Book = z.infer<typeof BookSchema>;

// ─── Movie ────────────────────────────────────────────────────
export const MovieSchema = z.object({
  id:         z.string().uuid(),
  title:      z.string().min(1),
  director:   z.string().optional(),
  year:       z.number().int().min(1888).max(2100).optional(),
  posterUrl:  z.string().optional(),
  tmdbId:     z.number().int().optional(),
  genres:     z.array(z.string()).default([]),
  status:     z.enum(["watched", "watching", "watchlist"]).default("watchlist"),
  rating:     z.number().int().min(1).max(10).optional(),
  notes:      z.string().optional(),
  watchedAt:  z.string().optional(), // "YYYY-MM-DD"
  runtime:    z.number().int().positive().optional(), // minutes
  createdAt:  z.string().datetime({ offset: true }),
});
export type Movie = z.infer<typeof MovieSchema>;

// ─── Input types (for forms — omit generated fields) ──────────
export type ClientInput     = Omit<Client,     "id" | "createdAt">;
export type ProjectInput    = Omit<Project,    "id" | "createdAt">;
export type TaskInput       = Omit<Task,       "id" | "createdAt" | "order">;
export type TimeLogInput    = Omit<TimeLog,    "id" | "createdAt">;
export type DeliverableInput= Omit<Deliverable,"id" | "createdAt">;
export type BookInput       = Omit<Book,       "id" | "createdAt">;
export type MovieInput      = Omit<Movie,      "id" | "createdAt">;

// ─── Journal Entry ────────────────────────────────────────────
export const JournalEntrySchema = z.object({
  id:            z.string().uuid(),
  date:          z.string(), // "YYYY-MM-DD"
  mood:          z.number().int().min(1).max(5).optional(),
  energy:        z.number().int().min(1).max(5).optional(),
  freeWrite:     z.string().optional(),
  wins:          z.array(z.string()).default([]),
  ideas:         z.array(z.string()).default([]),
  tomorrowFocus: z.string().optional(),
  habits:        z.record(z.string(), z.boolean()).default({}),
  updatedAt:     z.string().datetime({ offset: true }),
  createdAt:     z.string().datetime({ offset: true }),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalEntryInput = Omit<JournalEntry, "id" | "createdAt" | "updatedAt">;

// ─── Problem Log ──────────────────────────────────────────────
export const ProblemLogSchema = z.object({
  id:                   z.string().uuid(),
  entryDate:            z.string(), // "YYYY-MM-DD"
  title:                z.string().min(1),
  whatTheProblemWas:    z.string().optional(),
  context:              z.string().optional(),
  whatDidntWork:        z.string().optional(),
  whatSolvedIt:         z.string().optional(),
  whyItWorked:          z.string().optional(),
  tags:                 z.array(z.string()).default([]),
  createdAt:            z.string().datetime({ offset: true }),
  updatedAt:            z.string().datetime({ offset: true }),
});
export type ProblemLog = z.infer<typeof ProblemLogSchema>;
export type ProblemLogInput = Omit<ProblemLog, "id" | "createdAt" | "updatedAt">;

// ─── Journal Habit ────────────────────────────────────────────
export const JournalHabitSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(1),
  order:     z.number().int().nonnegative().default(0),
  active:    z.boolean().default(true),
  createdAt: z.string().datetime({ offset: true }),
});
export type JournalHabit = z.infer<typeof JournalHabitSchema>;
export type JournalHabitInput = Omit<JournalHabit, "id" | "createdAt">;

// ─── Export snapshot (for export/import) ─────────────────────
export const ExportSnapshotSchema = z.object({
  version:       z.literal(2),
  exportedAt:    z.string().datetime({ offset: true }),
  clients:       z.array(ClientSchema),
  projects:      z.array(ProjectSchema),
  tasks:         z.array(TaskSchema),
  timeLogs:      z.array(TimeLogSchema),
  deliverables:  z.array(DeliverableSchema),
  books:         z.array(BookSchema),
  movies:        z.array(MovieSchema),
  journalEntries: z.array(JournalEntrySchema).default([]),
  problemLogs:   z.array(ProblemLogSchema).default([]),
  journalHabits: z.array(JournalHabitSchema).default([]),
});
export type ExportSnapshot = z.infer<typeof ExportSnapshotSchema>;
