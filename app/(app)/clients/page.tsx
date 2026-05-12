"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Topbar }      from "@/components/layout/topbar";
import { PageShell }   from "@/components/shared/page-shell";
import { EmptyState }  from "@/components/shared/empty-state";
import { ClientCard }  from "@/components/clients/client-card";
import { ClientDialog } from "@/components/clients/client-dialog";
import { useClients }  from "@/lib/hooks/use-clients";
import { repo }        from "@/lib/db";
import type { Client, Project } from "@/lib/db/schemas";

type Tab = "all" | "active" | "paused" | "done";

export default function ClientsPage() {
  const { clients, loading, loadClients } = useClients();
  const [projectsMap, setProjectsMap] = useState<Record<string, Project[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab]     = useState<Tab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { loadClients(); }, []);

  useEffect(() => {
    if (!clients.length) return;
    repo.listProjects().then((all) => {
      const map: Record<string, Project[]> = {};
      for (const p of all) {
        if (!map[p.clientId]) map[p.clientId] = [];
        map[p.clientId].push(p);
      }
      setProjectsMap(map);
    });
  }, [clients]);

  const filtered = clients
    .filter((c) => tab === "all" || c.status === tab)
    .filter((c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
    );

  const counts: Record<string, number> = {
    all:    clients.length,
    active: clients.filter((c) => c.status === "active").length,
    paused: clients.filter((c) => c.status === "paused").length,
    done:   clients.filter((c) => c.status === "done").length,
  };

  return (
    <>
      <Topbar
        title="Clients"
        subtitle={`${counts.active} active · ${counts.all} total`}
        actions={
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Client
          </Button>
        }
      />

      <PageShell>
        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="pl-9 h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="bg-white/5 border border-white/8 h-9">
              {(["all","active","paused","done"] as Tab[]).map((t) => (
                <TabsTrigger key={t} value={t}
                  className="text-xs capitalize data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#f5f5f5]">
                  {t} {counts[t] > 0 && (
                    <span className="ml-1 text-[10px] text-muted-foreground">({counts[t]})</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title={search ? "No clients match your search" : "No clients yet"}
            description={!search ? "Add your first client to start tracking projects and deliverables." : undefined}
            action={
              !search ? (
                <Button onClick={() => setDialogOpen(true)} size="sm"
                  className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Client
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client, i) => (
              <ClientCard
                key={client.id}
                client={client}
                projects={projectsMap[client.id] ?? []}
                index={i}
              />
            ))}
          </div>
        )}
      </PageShell>

      <ClientDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); loadClients(); }}
      />
    </>
  );
}
