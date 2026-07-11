import { writable, derived } from "svelte/store";
import type { Collection, Folder, RequestDefinition } from "../types";

export const collections = writable<Collection[]>([]);
export const folders = writable<Folder[]>([]);
export const collectionRequests = writable<RequestDefinition[]>([]);
export const selectedCollectionId = writable<string | null>(null);
export const selectedFolderId = writable<string | null>(null);
export const collectionSearch = writable("");

// Derived: requests grouped by collection for tree view
export const collectionTree = derived(
  [collections, folders, collectionRequests, collectionSearch],
  ([$collections, $folders, $requests, $search]) => {
    const filtered = $search
      ? $requests.filter((r) =>
          r.name.toLowerCase().includes($search.toLowerCase())
        )
      : $requests;

    return $collections.map((col) => ({
      ...col,
      folders: $folders
        .filter((f) => f.collectionId === col.id)
        .map((f) => ({
          ...f,
          requests: filtered.filter(
            (r) => r.folderId === f.id && r.collectionId === col.id
          ),
        })),
      requests: filtered.filter(
        (r) => !r.folderId && r.collectionId === col.id
      ),
    }));
  }
);

// Load collections from backend (via Tauri invoke)
export async function loadCollections() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const data = await invoke<{
      collections: Collection[];
      folders: Folder[];
      requests: RequestDefinition[];
    }>("get_collections");
    collections.set(data.collections);
    folders.set(data.folders);
    collectionRequests.set(data.requests);
  } catch (e) {
    console.error("Failed to load collections:", e);
  }
}

export async function saveCollection(name: string, description = "") {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const col = await invoke<Collection>("create_collection", { name, description });
    collections.update((list) => [...list, col]);
    return col;
  } catch (e) {
    console.error("Failed to save collection:", e);
    return null;
  }
}

export async function deleteCollection(id: string) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_collection", { id });
    collections.update((list) => list.filter((c) => c.id !== id));
    collectionRequests.update((list) => list.filter((r) => r.collectionId !== id));
  } catch (e) {
    console.error("Failed to delete collection:", e);
  }
}

export async function saveRequest(request: RequestDefinition) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const saved = await invoke<RequestDefinition>("save_request", { request });
    collectionRequests.update((list) => {
      const idx = list.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        list[idx] = saved;
        return [...list];
      }
      return [...list, saved];
    });
    return saved;
  } catch (e) {
    console.error("Failed to save request:", e);
    return null;
  }
}
