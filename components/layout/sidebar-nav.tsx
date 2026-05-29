"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Film,
  Tv,
  Settings,
  LogOut,
  BookMarked,
  PenLine,
  Clapperboard,
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
import { useAuth } from "@/lib/hooks/use-auth";

const NAV = [
  { href: "/",        label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/journal", label: "JOURNAL",   icon: BookMarked },
  { href: "/clients", label: "CLIENTS",   icon: Users },
  { href: "/books",     label: "LIBRARY",   icon: BookOpen },
  { href: "/movies",    label: "VISIONS",   icon: Film },
  { href: "/tv-shows",  label: "TV SHOWS",  icon: Tv },
  { href: "/linkedin-workflow", label: "CONTENT", icon: PenLine },
  { href: "/ai-avatar", label: "AVATAR", icon: Clapperboard },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { logout } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/8 bg-black">

      {/* ── Logo / Brand ─────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-4 border-b border-white/8">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Logo mark */}
          <div className="flex-shrink-0 w-8 h-8 overflow-hidden">
            <Image
              src="/logo.jpeg"
              alt="Command Chamber"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: "linear" }}
                className="overflow-hidden"
              >
                <span className="text-[12px] font-black tracking-[0.14em] uppercase text-white whitespace-nowrap">
                  COMMAND
                </span>
                <span className="text-[12px] font-black tracking-[0.14em] uppercase text-[#FFD600] ml-1.5 whitespace-nowrap">
                  CHAMBER
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </SidebarHeader>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <SidebarContent className="py-2 px-2">
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
                    "group relative h-9 transition-all duration-150 ease-linear border-l-2",
                    active
                      ? "border-l-[#FFD600] bg-white/[0.03] text-white"
                      : "border-l-transparent text-white/55 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <Link href={href} className="flex items-center gap-3 px-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors duration-150",
                        active ? "text-[#FFD600]" : ""
                      )}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <AnimatePresence>
                      {open && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.12, ease: "linear" }}
                          className="text-[10px] font-black tracking-[0.12em] uppercase whitespace-nowrap"
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
      <SidebarFooter className="px-2 pb-3 border-t border-white/8 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className={cn(
                "h-9 transition-all duration-150 ease-linear border-l-2",
                pathname === "/settings"
                  ? "border-l-[#FFD600] bg-white/[0.03] text-white"
                  : "border-l-transparent text-white/55 hover:text-white/70 hover:bg-white/[0.02]"
              )}
            >
              <Link href="/settings" className="flex items-center gap-3 px-3">
                <Settings
                  className={cn("w-4 h-4 flex-shrink-0", pathname === "/settings" ? "text-[#FFD600]" : "")}
                  strokeWidth={1.75}
                />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12, ease: "linear" }}
                      className="text-[10px] font-black tracking-[0.12em] uppercase"
                    >
                      SETTINGS
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={logout}
              className="h-9 transition-all duration-150 ease-linear border-l-2 border-l-transparent text-white/55 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer"
            >
              <div className="flex items-center gap-3 px-3">
                <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12, ease: "linear" }}
                      className="text-[10px] font-black tracking-[0.12em] uppercase"
                    >
                      LOGOUT
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
