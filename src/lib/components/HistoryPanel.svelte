<script lang="ts">
  import { historyEntries, historySearch, loadHistory, clearHistory, groupHistory } from "../stores/history";
  import { currentRequest, setUrl, setMethod, setName } from "../stores/request";
  import type { HistoryEntry } from "../types";

  let search = $state("");

  let grouped = $derived.by(() => {
    const entries = $historyEntries.filter(
      (e) =>
        !search ||
        e.url.toLowerCase().includes(search.toLowerCase()) ||
        e.method.toLowerCase().includes(search.toLowerCase())
    );
    return groupHistory(entries);
  });

  function loadFromHistory(entry: HistoryEntry) {
    setMethod(entry.method);
    setUrl(entry.url);
    setName(`${entry.method} ${entry.url.slice(0, 40)}`);
    // Close history sidebar or keep it open
  }

  async function handleClear() {
    if (confirm("Clear all history?")) {
      await clearHistory();
    }
  }
</script>

<div class="p-3">
  <!-- Search -->
  <div class="relative mb-2">
    <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      bind:value={search}
      placeholder="Search history..."
      class="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <!-- Clear Button -->
  {#if $historyEntries.length > 0}
    <button onclick={handleClear} class="w-full mb-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
      Clear History
    </button>
  {/if}

  <!-- History Groups -->
  {#if grouped.length === 0}
    <div class="text-center py-8 text-zinc-400">
      <svg class="w-10 h-10 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <p class="text-xs">No history yet</p>
      <p class="text-[10px] mt-1">Send a request and it will appear here</p>
    </div>
  {:else}
    {#each grouped as group}
      <div class="mb-3">
        <div class="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1 px-2">{group.label}</div>
        {#each group.entries as entry}
          <button
            onclick={() => loadFromHistory(entry)}
            class="w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
          >
            <span class={`method-badge text-[9px] px-1 py-0.5 shrink-0 ${entry.method.toLowerCase()}`}>{entry.method}</span>
            <div class="flex-1 min-w-0">
              <div class="truncate">{entry.url}</div>
              <div class="text-[10px] text-zinc-400">
                {new Date(entry.createdAt).toLocaleTimeString()}
                {#if entry.responseStatus}
                  · <span class={entry.responseStatus < 400 ? "text-green-500" : "text-red-500"}>{entry.responseStatus}</span>
                {/if}
                {#if entry.responseTimeMs}
                  · {entry.responseTimeMs}ms
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>
