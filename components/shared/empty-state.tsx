import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 gap-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-medium text-[#d4d4d8]">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
