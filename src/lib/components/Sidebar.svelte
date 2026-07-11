<script lang="ts">
  import type { SidebarView } from "../types";
  import CollectionBrowser from "./CollectionBrowser.svelte";
  import HistoryPanel from "./HistoryPanel.svelte";

  let { view = $bindable("collections" as SidebarView) } = $props();
</script>

<aside class="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col overflow-hidden">
  <!-- View Tabs -->
  <div class="flex border-b border-zinc-200 dark:border-zinc-800">
    <button
      onclick={() => (view = "collections")}
      class={`flex-1 px-3 py-2 text-xs font-medium text-center transition-colors ${view === "collections" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-zinc-500'}`}
    >
      <div class="flex items-center justify-center gap-1.5">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M8 2v4M16 2v4" />
        </svg>
        Collections
      </div>
    </button>
    <button
      onclick={() => (view = "history")}
      class={`flex-1 px-3 py-2 text-xs font-medium text-center transition-colors ${view === "history" ? 'text-blue-600 border-b-2 border-blue-500' : 'text-zinc-500'}`}
    >
      <div class="flex items-center justify-center gap-1.5">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        History
      </div>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    {#if view === "collections"}
      <CollectionBrowser />
    {:else}
      <HistoryPanel />
    {/if}
  </div>
</aside>
