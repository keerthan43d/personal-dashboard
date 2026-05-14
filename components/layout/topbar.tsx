"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, BookOpen, Film, Tv } from "lucide-react";
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
    { label: "Go to TV Shows",   icon: <Tv className="w-4 h-4" />, onSelect: () => router.push("/tv-shows") },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-black px-4">
        {/* Sidebar toggle */}
        <SidebarTrigger className="text-white/35 hover:text-white/70 transition-colors duration-150" />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="font-sans font-black text-[11px] tracking-[0.18em] uppercase text-white leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-white/35 tracking-[0.08em] uppercase truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right: custom actions + search */}
        <div className="flex items-center gap-2">
          {actions}

          <button
            onClick={() => setOpen(true)}
            className={cn(
              "hidden sm:flex items-center gap-2 h-8 px-3",
              "bg-transparent border border-white/10 text-white/35",
              "hover:border-white/20 hover:text-white/70 transition-all duration-150",
              "text-[10px] font-black tracking-[0.1em] uppercase cursor-pointer"
            )}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="ml-1 font-mono text-[10px] bg-white/8 px-1.5 py-0.5">
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
