"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, BookOpen, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type QuickAction = {
  label:  string;
  icon:   React.ReactNode;
  onSelect: () => void;
};

interface TopbarProps {
  title:    string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const quickNav: QuickAction[] = [
    { label: "Go to Dashboard",  icon: <Search className="w-4 h-4" />, onSelect: () => router.push("/") },
    { label: "Go to Clients",    icon: <Users className="w-4 h-4" />, onSelect: () => router.push("/clients") },
    { label: "Go to Library",    icon: <BookOpen className="w-4 h-4" />, onSelect: () => router.push("/books") },
    { label: "Go to Visions",    icon: <Film className="w-4 h-4" />, onSelect: () => router.push("/movies") },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md px-4">
        {/* Sidebar toggle */}
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-base text-[#f5f5f5] leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: custom actions + search */}
        <div className="flex items-center gap-2">
          {actions}

          <button
            onClick={() => setOpen(true)}
            className={cn(
              "hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg",
              "bg-white/5 border border-white/8 text-muted-foreground",
              "hover:bg-white/8 hover:text-foreground transition-all duration-150",
              "text-xs cursor-pointer"
            )}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="ml-1 font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      {/* ⌘K Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search or jump to…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {quickNav.map((action) => (
              <CommandItem
                key={action.label}
                onSelect={() => { setOpen(false); action.onSelect(); }}
              >
                <span className="text-muted-foreground mr-2">{action.icon}</span>
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
