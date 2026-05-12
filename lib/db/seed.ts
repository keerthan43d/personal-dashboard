"use client";
/**
 * Populates IndexedDB with demo data on first run.
 * Called once from the AppProvider if the DB is empty.
 */
import { db } from "./local";
import { v4 as uuid } from "uuid";

const now = () => new Date().toISOString();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const dateStr = (daysOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
};

export async function seedIfEmpty() {
  // Seeding disabled — start with a clean slate
  return;

  // ── Clients ──────────────────────────────────────────────────
  const c1Id = uuid();
  const c2Id = uuid();

  await db.clients.bulkAdd([
    {
      id: c1Id,
      name: "Arjun Mehta",
      company: "Aura Digital Studio",
      email: "arjun@aura.studio",
      status: "active",
      hourlyRate: 75,
      currency: "USD",
      notes: "Branding + social for Q2 launch.",
      createdAt: daysAgo(60),
    },
    {
      id: c2Id,
      name: "Dr. Priya Solanki",
      company: "HealthFirst Clinic",
      email: "priya@healthfirst.in",
      status: "active",
      hourlyRate: 60,
      currency: "USD",
      notes: "Website redesign + content strategy.",
      createdAt: daysAgo(45),
    },
  ]);

  // ── Projects ─────────────────────────────────────────────────
  const p1Id = uuid();
  const p2Id = uuid();
  const p3Id = uuid();

  await db.projects.bulkAdd([
    {
      id: p1Id,
      clientId: c1Id,
      title: "Brand Identity Package",
      description: "Logo, typography, color system, brand guidelines PDF.",
      status: "active",
      deadline: dateStr(14),
      paymentAmount: 2400,
      paymentStatus: "partial",
      createdAt: daysAgo(30),
    },
    {
      id: p2Id,
      clientId: c1Id,
      title: "Instagram Content — May",
      description: "12 posts + 4 reels for May calendar.",
      status: "done",
      paymentAmount: 800,
      paymentStatus: "paid",
      createdAt: daysAgo(50),
      completedAt: daysAgo(5),
    },
    {
      id: p3Id,
      clientId: c2Id,
      title: "Clinic Website Redesign",
      description: "5-page Next.js site with booking integration.",
      status: "active",
      deadline: dateStr(21),
      paymentAmount: 3200,
      paymentStatus: "unpaid",
      createdAt: daysAgo(20),
    },
  ]);

  // ── Tasks ────────────────────────────────────────────────────
  const t1 = uuid(); const t2 = uuid(); const t3 = uuid();
  const t4 = uuid(); const t5 = uuid();

  await db.tasks.bulkAdd([
    { id: t1, projectId: p1Id, clientId: c1Id, title: "Moodboard presentation", done: true, order: 0, createdAt: daysAgo(28), completedAt: daysAgo(20) },
    { id: t2, projectId: p1Id, clientId: c1Id, title: "Logo concepts (3 directions)", done: true, order: 1, createdAt: daysAgo(25), completedAt: daysAgo(15) },
    { id: t3, projectId: p1Id, clientId: c1Id, title: "Final logo + variations", done: false, order: 2, createdAt: daysAgo(15) },
    { id: t4, projectId: p1Id, clientId: c1Id, title: "Brand guidelines PDF", done: false, order: 3, createdAt: daysAgo(15) },
    { id: t5, projectId: p3Id, clientId: c2Id, title: "Wireframes approved", done: true, order: 0, createdAt: daysAgo(18), completedAt: daysAgo(10) },
  ]);

  // ── Time Logs ─────────────────────────────────────────────────
  const logEntries = [
    { clientId: c1Id, projectId: p1Id, date: dateStr(-7), hours: 3 },
    { clientId: c1Id, projectId: p1Id, date: dateStr(-5), hours: 4 },
    { clientId: c1Id, projectId: p1Id, date: dateStr(-3), hours: 2.5 },
    { clientId: c2Id, projectId: p3Id, date: dateStr(-6), hours: 5 },
    { clientId: c2Id, projectId: p3Id, date: dateStr(-2), hours: 3 },
    { clientId: c2Id, projectId: p3Id, date: dateStr(-1), hours: 2 },
  ];
  await db.timeLogs.bulkAdd(logEntries.map((e) => ({ ...e, id: uuid(), createdAt: now() })));

  // ── Deliverables ─────────────────────────────────────────────
  await db.deliverables.bulkAdd([
    { id: uuid(), clientId: c1Id, projectId: p2Id, title: "May Instagram Posts (12)", type: "design", deliveredAt: dateStr(-5), createdAt: daysAgo(5) },
    { id: uuid(), clientId: c1Id, projectId: p2Id, title: "May Reels (4)", type: "video", deliveredAt: dateStr(-5), createdAt: daysAgo(5) },
    { id: uuid(), clientId: c1Id, projectId: p1Id, title: "Moodboard PDF", type: "design", deliveredAt: dateStr(-20), createdAt: daysAgo(20) },
  ]);

  // ── Books ─────────────────────────────────────────────────────
  await db.books.bulkAdd([
    {
      id: uuid(), title: "Atomic Habits", author: "James Clear",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
      status: "finished", rating: 5,
      takeaways: ["1% better every day compounds enormously", "Identity-based habits stick longer", "Environment design beats willpower"],
      finishedAt: dateStr(-30), createdAt: daysAgo(90),
    },
    {
      id: uuid(), title: "Deep Work", author: "Cal Newport",
      status: "finished", rating: 4,
      takeaways: ["Distraction is the enemy of mastery", "Schedule deep work blocks like meetings"],
      finishedAt: dateStr(-60), createdAt: daysAgo(120),
    },
    {
      id: uuid(), title: "The War of Art", author: "Steven Pressfield",
      status: "reading", createdAt: daysAgo(10),
      takeaways: [],
    },
  ]);

  // ── Movies ────────────────────────────────────────────────────
  await db.movies.bulkAdd([
    {
      id: uuid(), title: "Dune: Part Two", director: "Denis Villeneuve", year: 2024,
      posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      genres: ["Sci-Fi", "Drama"], status: "watched", rating: 5,
      notes: "Visually stunning. Hans Zimmer score is transcendent.",
      watchedAt: dateStr(-20), runtime: 166, createdAt: daysAgo(20),
    },
    {
      id: uuid(), title: "Oppenheimer", director: "Christopher Nolan", year: 2023,
      genres: ["Drama", "History", "Thriller"], status: "watched", rating: 5,
      notes: "Cillian Murphy carries the whole film.",
      watchedAt: dateStr(-45), runtime: 180, createdAt: daysAgo(45),
    },
    {
      id: uuid(), title: "Blade Runner 2049", director: "Denis Villeneuve", year: 2017,
      genres: ["Sci-Fi", "Noir"], status: "watchlist",
      createdAt: daysAgo(5),
    },
  ]);
}
