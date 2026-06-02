/** Format currency */
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format money keeping paise/cents when present (e.g. ₹1,200 or ₹49.50) */
export function formatMoney(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format hours: 2.5 → "2h 30m", 0.75 → "45m" */
export function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins  = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins}m`;
  if (mins  === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** "active" → "Active" */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Initials from full name: "Arjun Mehta" → "AM" */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Truncate string */
export function truncate(s: string, len = 60): string {
  return s.length > len ? s.slice(0, len - 1) + "…" : s;
}

/** Task progress percentage */
export function taskProgress(total: number, done: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/** Status labels */
export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "On Hold",
  done: "Done",
  archived: "Archived",
  blocked: "Blocked",
  review: "In Review",
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  reading: "Reading",
  finished: "Finished",
  dnf: "Did Not Finish",
  wishlist: "Wishlist",
  watched: "Watched",
  watching: "Watching",
  watchlist: "Watchlist",
};

/** Deliverable type labels */
export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  design: "Design",
  copy: "Copy",
  brand: "Brand",
  code: "Code",
  strategy: "Strategy",
  other: "Other",
};
