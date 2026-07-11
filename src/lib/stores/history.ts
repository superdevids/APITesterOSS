import { writable } from "svelte/store";
import type { HistoryEntry } from "../types";

export const historyEntries = writable<HistoryEntry[]>([]);
export const historySearch = writable("");

export async function loadHistory() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const entries = await invoke<HistoryEntry[]>("get_history");
    historyEntries.set(entries);
  } catch (e) {
    console.error("Failed to load history:", e);
  }
}

export async function clearHistory() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("clear_history");
    historyEntries.set([]);
  } catch (e) {
    console.error("Failed to clear history:", e);
  }
}

// Group history by date
export function groupHistory(entries: HistoryEntry[]) {
  const groups: { label: string; entries: HistoryEntry[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const todayEntries: HistoryEntry[] = [];
  const yesterdayEntries: HistoryEntry[] = [];
  const weekEntries: HistoryEntry[] = [];
  const olderEntries: HistoryEntry[] = [];

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) {
      todayEntries.push(entry);
    } else if (date.getTime() === yesterday.getTime()) {
      yesterdayEntries.push(entry);
    } else if (date.getTime() >= lastWeek.getTime()) {
      weekEntries.push(entry);
    } else {
      olderEntries.push(entry);
    }
  }

  if (todayEntries.length) groups.push({ label: "Today", entries: todayEntries });
  if (yesterdayEntries.length) groups.push({ label: "Yesterday", entries: yesterdayEntries });
  if (weekEntries.length) groups.push({ label: "Last 7 Days", entries: weekEntries });
  if (olderEntries.length) groups.push({ label: "Older", entries: olderEntries });

  return groups;
}
