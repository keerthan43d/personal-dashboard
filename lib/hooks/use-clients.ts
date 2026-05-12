"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type { Client, ClientInput, Project, ProjectInput, Task, TaskInput, TimeLog, TimeLogInput, Deliverable, DeliverableInput } from "@/lib/db/schemas";

interface ClientStore {
  clients:      Client[];
  projects:     Project[];
  tasks:        Task[];
  timeLogs:     TimeLog[];
  deliverables: Deliverable[];
  loading:      boolean;

  // Load
  loadClients():      Promise<void>;
  loadClient(id: string): Promise<void>;

  // Client CRUD
  addClient(data: ClientInput):             Promise<Client>;
  editClient(id: string, data: Partial<ClientInput>): Promise<void>;
  removeClient(id: string):                 Promise<void>;

  // Project CRUD
  addProject(data: ProjectInput):                Promise<Project>;
  editProject(id: string, data: Partial<ProjectInput>): Promise<void>;
  removeProject(id: string):                     Promise<void>;

  // Task CRUD
  addTask(data: TaskInput):             Promise<Task>;
  toggleTask(id: string, done: boolean): Promise<void>;
  removeTask(id: string):               Promise<void>;

  // TimeLog CRUD
  addTimeLog(data: TimeLogInput):                  Promise<TimeLog>;
  editTimeLog(id: string, data: Partial<TimeLogInput>): Promise<void>;
  removeTimeLog(id: string):                       Promise<void>;

  // Deliverable CRUD
  addDeliverable(data: DeliverableInput):                    Promise<Deliverable>;
  removeDeliverable(id: string):                             Promise<void>;
}

export const useClients = create<ClientStore>((set, get) => ({
  clients:      [],
  projects:     [],
  tasks:        [],
  timeLogs:     [],
  deliverables: [],
  loading:      false,

  async loadClients() {
    set({ loading: true });
    const clients = await repo.listClients();
    set({ clients, loading: false });
  },

  async loadClient(id) {
    set({ loading: true });
    const [projects, tasks, timeLogs, deliverables] = await Promise.all([
      repo.listProjects({ clientId: id }),
      repo.listTasks({ clientId: id }),
      repo.listTimeLogs({ clientId: id }),
      repo.listDeliverables({ clientId: id }),
    ]);
    set({ projects, tasks, timeLogs, deliverables, loading: false });
  },

  async addClient(data) {
    const client = await repo.createClient(data);
    set((s) => ({ clients: [client, ...s.clients] }));
    return client;
  },

  async editClient(id, data) {
    const updated = await repo.updateClient(id, data);
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? updated : c)) }));
  },

  async removeClient(id) {
    await repo.deleteClient(id);
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
  },

  async addProject(data) {
    const project = await repo.createProject(data);
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  async editProject(id, data) {
    const updated = await repo.updateProject(id, data);
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? updated : p)) }));
  },

  async removeProject(id) {
    await repo.deleteProject(id);
    set((s) => ({
      projects:     s.projects.filter((p) => p.id !== id),
      tasks:        s.tasks.filter((t) => t.projectId !== id),
      timeLogs:     s.timeLogs.filter((l) => l.projectId !== id),
      deliverables: s.deliverables.filter((d) => d.projectId !== id),
    }));
  },

  async addTask(data) {
    const task = await repo.createTask(data);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  async toggleTask(id, done) {
    const completedAt = done ? new Date().toISOString() : undefined;
    const updated = await repo.updateTask(id, { done, completedAt });
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  async removeTask(id) {
    await repo.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  async addTimeLog(data) {
    const log = await repo.createTimeLog(data);
    set((s) => ({ timeLogs: [log, ...s.timeLogs] }));
    return log;
  },

  async editTimeLog(id, data) {
    const updated = await repo.updateTimeLog(id, data);
    set((s) => ({ timeLogs: s.timeLogs.map((l) => (l.id === id ? updated : l)) }));
  },

  async removeTimeLog(id) {
    await repo.deleteTimeLog(id);
    set((s) => ({ timeLogs: s.timeLogs.filter((l) => l.id !== id) }));
  },

  async addDeliverable(data) {
    const d = await repo.createDeliverable(data);
    set((s) => ({ deliverables: [d, ...s.deliverables] }));
    return d;
  },

  async removeDeliverable(id) {
    await repo.deleteDeliverable(id);
    set((s) => ({ deliverables: s.deliverables.filter((d) => d.id !== id) }));
  },
}));
