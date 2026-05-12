"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Film,
  Settings,
  ChevronRight,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV = [
  { href: "/",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/clients",  label: "Clients",    icon: Users },
  { href: "/books",    label: "Library",    icon: BookOpen },
  { href: "/movies",   label: "Visions",    icon: Film },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#0d0d0d]">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#06b6d4]/15 border border-[#06b6d4]/30 flex items-center justify-center glow-cyan">
            <Flame className="w-4 h-4 text-[#06b6d4]" strokeWidth={2} />
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="font-display font-semibold text-[#f5f5f5] text-sm tracking-wide whitespace-nowrap">
                  Command
                </span>
                <span className="font-display font-semibold text-[#06b6d4] text-sm tracking-wide ml-1 whitespace-nowrap">
                  Chamber
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </SidebarHeader>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <SidebarContent className="py-3 px-2">
        <SidebarMenu>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={label}
                  className={cn(
                    "group relative h-9 rounded-lg transition-all duration-150",
                    active
                      ? "bg-[#1a1a1a] text-[#f5f5f5]"
                      : "text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#161616]"
                  )}
                >
                  <Link href={href} className="flex items-center gap-3 px-3">
                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#06b6d4] glow-cyan"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        active ? "text-[#06b6d4]" : ""
                      )}
                      strokeWidth={active ? 2 : 1.75}
                    />

                    <AnimatePresence>
                      {open && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "text-sm font-medium tracking-wide whitespace-nowrap",
                            active ? "text-[#f5f5f5]" : ""
                          )}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* ── Footer ───────────────────────────────────────────── */}
      <SidebarFooter className="px-2 pb-3 border-t border-white/5 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className={cn(
                "h-9 rounded-lg transition-all duration-150",
                pathname === "/settings"
                  ? "bg-[#1a1a1a] text-[#f5f5f5]"
                  : "text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#161616]"
              )}
            >
              <Link href="/settings" className="flex items-center gap-3 px-3">
                <Settings className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
