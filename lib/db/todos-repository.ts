"use client";
import { v4 as uuid } from "uuid";
import { getSupabase } from "./supabase-client";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  dueDate: string; // yyyy-MM-dd
  doneAt: string | null;
  createdAt: string; // ISO timestamp
};

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[Todos] ${ctx}: ${error?.message ?? "unknown error"}`);
}

type TodoRow = {
  id: string;
  text: string;
  done: boolean;
  due_date: string;
  done_at: string | null;
  created_at: string;
};

function fromRow(r: TodoRow): Todo {
  return {
    id: r.id,
    text: r.text,
    done: r.done,
    dueDate: r.due_date,
    doneAt: r.done_at ?? null,
    createdAt: r.created_at,
  };
}

export async function listTodos(): Promise<Todo[]> {
  const { data, error } = await getSupabase()
    .from("journal_todos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) fail(error, "listTodos");
  return ((data ?? []) as TodoRow[]).map(fromRow);
}

export async function createTodo(text: string, dueDate: string): Promise<Todo> {
  const { data, error } = await getSupabase()
    .from("journal_todos")
    .insert({ id: uuid(), text, done: false, due_date: dueDate, done_at: null, created_at: now() })
    .select()
    .single();
  if (error) fail(error, "createTodo");
  return fromRow(data as TodoRow);
}

export async function setTodoDone(id: string, done: boolean, today: string): Promise<Todo> {
  const { data, error } = await getSupabase()
    .from("journal_todos")
    .update({ done, done_at: done ? today : null })
    .eq("id", id)
    .select()
    .single();
  if (error) fail(error, "setTodoDone");
  return fromRow(data as TodoRow);
}

export async function updateTodoText(id: string, text: string): Promise<Todo> {
  const { data, error } = await getSupabase()
    .from("journal_todos")
    .update({ text })
    .eq("id", id)
    .select()
    .single();
  if (error) fail(error, "updateTodoText");
  return fromRow(data as TodoRow);
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await getSupabase().from("journal_todos").delete().eq("id", id);
  if (error) fail(error, "deleteTodo");
}

/** Roll every still-incomplete to-do whose due date is before `today` forward to `today`. */
export async function rollOverTodos(today: string): Promise<void> {
  const { error } = await getSupabase()
    .from("journal_todos")
    .update({ due_date: today })
    .eq("done", false)
    .lt("due_date", today);
  if (error) fail(error, "rollOverTodos");
}
