"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Clock, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { initials, formatCurrency } from "@/lib/utils/format";
import { fmt } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { Client, Project } from "@/lib/db/schemas";

interface ClientCardProps {
  client:   Client;
  projects: Project[];
  index:    number;
}

export function ClientCard({ client, projects, index }: ClientCardProps) {
  const active    = projects.filter((p) => p.status === "active");
  const totalOwed = projects
    .filter((p) => p.paymentStatus !== "paid" && p.paymentAmount)
    .reduce((s, p) => s + (p.paymentAmount ?? 0), 0);
  const nextDeadline = active
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/clients/${client.id}`}>
        <div className={cn(
          "group relative rounded-xl border border-white/6 bg-[#111111] p-5",
          "hover:border-white/10 hover:bg-[#161616] hover:-translate-y-0.5",
          "transition-all duration-200 cursor-pointer",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        )}>
          {/* Active indicator line */}
          {client.status === "active" && (
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          )}

          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/10">
              <AvatarFallback className="rounded-lg bg-[#FFD600]/10 text-[#FFD600] text-sm font-semibold">
                {initials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#f5f5f5] text-sm truncate group-hover:text-white">
                  {client.name}
                </h3>
              </div>
              {client.company && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{client.company}</p>
              )}
            </div>

            <StatusBadge status={client.status} />
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/3 border border-white/5 p-2.5 text-center">
              <p className="font-numeric text-base font-medium text-[#f5f5f5]">{projects.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Projects</p>
            </div>
            <div className="rounded-lg bg-white/3 border border-white/5 p-2.5 text-center">
              <p className="font-numeric text-base font-medium text-[#f5f5f5]">{active.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Active</p>
            </div>
            <div className="rounded-lg bg-white/3 border border-white/5 p-2.5 text-center">
              <p className={cn(
                "font-numeric text-base font-medium",
                totalOwed > 0 ? "text-[#FFD600]" : "text-[#f5f5f5]"
              )}>
                {totalOwed > 0 ? formatCurrency(totalOwed, client.currency) : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Owed</p>
            </div>
          </div>

          {/* Deadline */}
          {nextDeadline?.deadline && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Next: {nextDeadline.title} · {fmt.date(nextDeadline.deadline)}</span>
            </div>
          )}

          <ChevronRight className="absolute bottom-5 right-4 w-4 h-4 text-muted-foreground/40 group-hover:text-[#FFD600] group-hover:translate-x-0.5 transition-all duration-150" />
        </div>
      </Link>
    </motion.div>
  );
}
