import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/** Scrollable content area below the Topbar */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto scroll-smooth will-change-scroll", className)}
      style={{ WebkitOverflowScrolling: "touch", backfaceVisibility: "hidden" }}>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
