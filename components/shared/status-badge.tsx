import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  // Client / Project
  active:   "badge-green",
  paused:   "badge-cyan",
  done:     "badge-zinc",
  archived: "badge-zinc",
  blocked:  "badge-red",
  review:   "badge-blue",
  // Payment
  unpaid:   "badge-red",
  partial:  "badge-cyan",
  paid:     "badge-green",
  // Book
  reading:  "badge-blue",
  finished: "badge-green",
  dnf:      "badge-zinc",
  wishlist: "badge-zinc",
  // Movie
  watched:  "badge-green",
  watching: "badge-blue",
  watchlist:"badge-zinc",
};

const LABEL: Record<string, string> = {
  active: "Active", paused: "On Hold", done: "Done", archived: "Archived",
  blocked: "Blocked", review: "In Review",
  unpaid: "Unpaid", partial: "Partial", paid: "Paid",
  reading: "Reading", finished: "Finished", dnf: "DNF", wishlist: "Wishlist",
  watched: "Watched", watching: "Watching", watchlist: "Watchlist",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium rounded-md h-5 px-2",
        MAP[status] ?? "badge-zinc"
      )}
    >
      {LABEL[status] ?? status}
    </Badge>
  );
}
