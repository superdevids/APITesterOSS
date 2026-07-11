<script lang="ts">
  import { currentRequest, setHeaders } from "../stores/request";
  import type { KeyValuePair } from "../types";

  const HEADER_PRESETS = [
    "Content-Type", "Authorization", "Accept", "Cache-Control",
    "X-Requested-With", "User-Agent", "Origin", "Referer",
  ];

  let items = $state<KeyValuePair[]>([...($currentRequest.headers.length ? $currentRequest.headers : [{ key: "", value: "", description: "", enabled: true }])]);

  $effect(() => {
    setHeaders(items.filter((h) => h.key.trim()));
  });

  function addRow() {
    items = [...items, { key: "", value: "", description: "", enabled: true }];
  }

  function removeRow(index: number) {
    items = items.filter((_, i) => i !== index);
    if (items.length === 0) {
      items = [{ key: "", value: "", description: "", enabled: true }];
    }
  }

  let showPresets = $state(false);

  function applyPreset(preset: string) {
    items = [...items.filter((h) => h.key.trim()), { key: preset, value: "", description: "", enabled: true }];
    showPresets = false;
  }
</script>

<div>
  <div class="flex items-center justify-between mb-2">
    <span class="text-xs text-zinc-500">Headers</span>
    <div class="flex gap-2">
      <div class="relative">
        <button onclick={() => (showPresets = !showPresets)} class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Presets
        </button>
        {#if showPresets}
          <div class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
            {#each HEADER_PRESETS as preset}
              <button onclick={() => applyPreset(preset)} class="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700">
                {preset}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button onclick={addRow} class="text-xs text-blue-500 hover:text-blue-600">Add</button>
    </div>
  </div>

  <table class="w-full text-xs">
    <thead>
      <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
        <th class="w-8 p-1 text-left"></th>
        <th class="p-1 text-left font-medium">Key</th>
        <th class="p-1 text-left font-medium">Value</th>
        <th class="w-8 p-1"></th>
      </tr>
    </thead>
    <tbody>
      {#each items as header, i}
        <tr class="border-b border-zinc-100 dark:border-zinc-800">
          <td class="p-1">
            <input type="checkbox" bind:checked={header.enabled} class="w-3 h-3 rounded border-zinc-300" />
          </td>
          <td class="p-1">
            <input
              type="text"
              bind:value={header.key}
              placeholder="Header name"
              class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
          </td>
          <td class="p-1">
            <input
              type="text"
              bind:value={header.value}
              placeholder="Value"
              class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
          </td>
          <td class="p-1">
            <button onclick={() => removeRow(i)} class="text-zinc-400 hover:text-red-500">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
