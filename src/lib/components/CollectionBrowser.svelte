<script lang="ts">
  import { get } from "svelte/store";
  import { collectionTree, saveCollection, deleteCollection, saveRequest, collectionSearch, collectionRequests } from "../stores/collection";
  import { currentRequest } from "../stores/request";
  import { downloadJson, exportCollectionToJson } from "../utils/export-collection";
  import { folders } from "../stores/collection";
  import type { Collection, RequestDefinition, Folder } from "../types";
  import ImportModal from "./ImportModal.svelte";
  import CollectionRunner from "./CollectionRunner.svelte";

  let showNewCollection = $state(false);
  let newCollectionName = $state("");
  let searchQuery = $state("");
  let showImport = $state(false);
  let showRunner = $state(false);
  let runnerCollectionId = $state("");
  let contextMenu = $state<{ x: number; y: number; collectionId: string } | null>(null);

  async function createCollection() {
    if (!newCollectionName.trim()) return;
    await saveCollection(newCollectionName.trim());
    newCollectionName = "";
    showNewCollection = false;
  }

  function loadRequest(req: RequestDefinition) {
    currentRequest.set({ ...req });
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function handleExport(colId: string) {
    closeContextMenu();
    const col = $collectionTree.find((c) => c.id === colId);
    if (!col) return;
    const json = exportCollectionToJson(col, get(collectionRequests), get(folders));
    downloadJson(json, `${col.name.replace(/[^a-zA-Z0-9]/g, "_")}.json`);
  }

  function handleRun(colId: string) {
    closeContextMenu();
    runnerCollectionId = colId;
    showRunner = true;
  }
</script>

<div class="p-3">
  <div class="relative mb-2">
    <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
    <input type="text" bind:value={searchQuery} oninput={() => collectionSearch.set(searchQuery)} placeholder="Search requests..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>

  <div class="flex gap-1 mb-2">
    <button onclick={() => (showNewCollection = true)} class="flex-1 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center justify-center gap-1 border border-dashed border-blue-300 dark:border-blue-700">
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg>
      New
    </button>
    <button onclick={() => (showImport = true)} class="flex-1 px-2 py-1.5 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md flex items-center justify-center gap-1 border border-dashed border-green-300 dark:border-green-700">
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
      Import
    </button>
  </div>

  {#if showNewCollection}
    <div class="mb-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
      <input type="text" bind:value={newCollectionName} placeholder="Collection name" class="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onkeydown={(e) => e.key === "Enter" && createCollection()} />
      <div class="flex gap-1">
        <button onclick={createCollection} class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
        <button onclick={() => (showNewCollection = false)} class="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  {/if}

  {#if $collectionTree.length === 0}
    <div class="text-center py-8 text-zinc-400">
      <svg class="w-10 h-10 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path d="M8 2v4M16 2v4" />
      </svg>
      <p class="text-xs">No collections yet</p>
      <p class="text-[10px] mt-1">Create a collection or import from Postman</p>
    </div>
  {:else}
    <div class="space-y-1" onclick={closeContextMenu}>
      {#each $collectionTree as col}
        <div class="group">
          <div class="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" oncontextmenu={(e) => { e.preventDefault(); contextMenu = { x: e.clientX, y: e.clientY, collectionId: col.id }; }}>
            <div class="flex items-center gap-1.5 text-xs font-medium">
              <svg class="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M8 2v4M16 2v4" />
              </svg>
              <span>{col.name}</span>
              <span class="text-[10px] text-zinc-400">({col.requests.length + col.folders.reduce((a: number, f: any) => a + f.requests.length, 0)})</span>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100">
              <button onclick={(e) => { e.stopPropagation(); handleRun(col.id); }} class="text-zinc-400 hover:text-blue-500" title="Run Collection" aria-label="Run Collection">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z" /></svg>
              </button>
              <button onclick={(e) => { e.stopPropagation(); handleExport(col.id); }} class="text-zinc-400 hover:text-green-500" title="Export" aria-label="Export">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              </button>
              <button onclick={(e) => { e.stopPropagation(); deleteCollection(col.id); }} class="text-zinc-400 hover:text-red-500" title="Delete" aria-label="Delete">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
              </button>
            </div>
          </div>

          {#if contextMenu?.collectionId === col.id}
            <div class="fixed bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 w-44" style="left: {contextMenu.x}px; top: {contextMenu.y}px;">
              <button onclick={() => handleRun(col.id)} class="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z" /></svg> Run Collection
              </button>
              <button onclick={() => handleExport(col.id)} class="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg> Export JSON
              </button>
              <hr class="my-1 border-zinc-200 dark:border-zinc-700" />
              <button onclick={() => { deleteCollection(col.id); closeContextMenu(); }} class="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-red-500">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg> Delete
              </button>
            </div>
          {/if}

          <div class="ml-3">
            {#each col.requests as req}
              <button onclick={() => loadRequest(req)} class={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${$currentRequest.id === req.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <span class={`method-badge text-[9px] px-1 py-0.5 ${req.method.toLowerCase()}`}>{req.method}</span>
                <span class="truncate">{req.name}</span>
              </button>
            {/each}

            {#each col.folders as folder}
              <div class="mt-1">
                <div class="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 font-medium">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                  {folder.name}
                </div>
                <div class="ml-3">
                  {#each folder.requests as req}
                    <button onclick={() => loadRequest(req)} class={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${$currentRequest.id === req.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <span class={`method-badge text-[9px] px-1 py-0.5 ${req.method.toLowerCase()}`}>{req.method}</span>
                      <span class="truncate">{req.name}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showImport}
  <ImportModal onclose={() => (showImport = false)} />
{/if}

{#if showRunner && runnerCollectionId}
  <CollectionRunner collectionId={runnerCollectionId} onclose={() => { showRunner = false; runnerCollectionId = ""; }} />
{/if}
