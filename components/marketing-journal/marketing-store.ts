"use client";
import { create } from "zustand";
import {
  listClients, createClient, updateClient, deleteClient,
  listServices, createService, updateService, deleteService,
  listCampaigns, createCampaign, updateCampaign, deleteCampaign,
  listLearnings, createLearning, updateLearning, deleteLearning,
  seedSampleData, wipeSampleData,
  type MktClient, type MktClientInput,
  type MktService, type MktServiceInput,
  type MktCampaign, type MktCampaignInput,
  type MktLearning, type MktLearningInput,
} from "@/lib/db/marketing-repository";

type State = {
  clients: MktClient[];
  services: MktService[];
  campaigns: MktCampaign[];
  learnings: MktLearning[];
  loaded: boolean;
  broken: boolean; // migration not applied / load failed

  load: () => Promise<void>;

  addClient: (i: MktClientInput) => Promise<MktClient>;
  editClient: (id: string, p: Partial<MktClientInput>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;

  addService: (i: MktServiceInput) => Promise<MktService>;
  editService: (id: string, p: Partial<MktServiceInput>) => Promise<void>;
  removeService: (id: string) => Promise<void>;

  addCampaign: (i: MktCampaignInput) => Promise<MktCampaign>;
  editCampaign: (id: string, p: Partial<MktCampaignInput>) => Promise<void>;
  removeCampaign: (id: string) => Promise<void>;

  addLearning: (i: MktLearningInput) => Promise<MktLearning>;
  editLearning: (id: string, p: Partial<MktLearningInput>) => Promise<void>;
  removeLearning: (id: string) => Promise<void>;

  seedSamples: () => Promise<void>;
  wipeSamples: () => Promise<void>;
};

export const useMarketing = create<State>()((set, get) => ({
  clients: [],
  services: [],
  campaigns: [],
  learnings: [],
  loaded: false,
  broken: false,

  load: async () => {
    try {
      const [clients, services, campaigns, learnings] = await Promise.all([
        listClients(), listServices(), listCampaigns(), listLearnings(),
      ]);
      set({ clients, services, campaigns, learnings, loaded: true, broken: false });
    } catch (e) {
      console.error("[Marketing] load failed — apply migration 0014:", e);
      set({ loaded: true, broken: true });
    }
  },

  addClient: async (i) => {
    const row = await createClient(i);
    set((s) => ({ clients: [...s.clients, row] }));
    return row;
  },
  editClient: async (id, p) => {
    const row = await updateClient(id, p);
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? row : c)) }));
  },
  removeClient: async (id) => {
    await deleteClient(id);
    // Cascade in the DB; mirror it in local state.
    set((s) => {
      const serviceIds = new Set(s.services.filter((x) => x.clientId === id).map((x) => x.id));
      const campaignIds = new Set(s.campaigns.filter((x) => serviceIds.has(x.serviceId)).map((x) => x.id));
      return {
        clients: s.clients.filter((c) => c.id !== id),
        services: s.services.filter((x) => x.clientId !== id),
        campaigns: s.campaigns.filter((x) => !serviceIds.has(x.serviceId)),
        learnings: s.learnings.filter((x) => !campaignIds.has(x.campaignId)),
      };
    });
  },

  addService: async (i) => {
    const row = await createService(i);
    set((s) => ({ services: [...s.services, row] }));
    return row;
  },
  editService: async (id, p) => {
    const row = await updateService(id, p);
    set((s) => ({ services: s.services.map((x) => (x.id === id ? row : x)) }));
  },
  removeService: async (id) => {
    await deleteService(id);
    set((s) => {
      const campaignIds = new Set(s.campaigns.filter((x) => x.serviceId === id).map((x) => x.id));
      return {
        services: s.services.filter((x) => x.id !== id),
        campaigns: s.campaigns.filter((x) => x.serviceId !== id),
        learnings: s.learnings.filter((x) => !campaignIds.has(x.campaignId)),
      };
    });
  },

  addCampaign: async (i) => {
    const row = await createCampaign(i);
    set((s) => ({ campaigns: [row, ...s.campaigns] }));
    return row;
  },
  editCampaign: async (id, p) => {
    const row = await updateCampaign(id, p);
    set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? row : x)) }));
  },
  removeCampaign: async (id) => {
    await deleteCampaign(id);
    set((s) => ({
      campaigns: s.campaigns.filter((x) => x.id !== id),
      learnings: s.learnings.filter((x) => x.campaignId !== id),
    }));
  },

  addLearning: async (i) => {
    const row = await createLearning(i);
    set((s) => ({ learnings: [row, ...s.learnings] }));
    return row;
  },
  editLearning: async (id, p) => {
    const row = await updateLearning(id, p);
    set((s) => ({ learnings: s.learnings.map((x) => (x.id === id ? row : x)) }));
  },
  removeLearning: async (id) => {
    await deleteLearning(id);
    set((s) => ({ learnings: s.learnings.filter((x) => x.id !== id) }));
  },

  seedSamples: async () => {
    await seedSampleData();
    await get().load();
  },
  wipeSamples: async () => {
    await wipeSampleData();
    await get().load();
  },
}));
