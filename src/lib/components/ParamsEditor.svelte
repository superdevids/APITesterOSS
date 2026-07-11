<script lang="ts">
  import { currentRequest, setQueryParams } from "../stores/request";
  import type { KeyValuePair } from "../types";

  let items = $state<KeyValuePair[]>([...($currentRequest.queryParams.length ? $currentRequest.queryParams : [{ key: "", value: "", description: "", enabled: true }])]);

  $effect(() => {
    setQueryParams(items.filter((p) => p.key.trim()));
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

  function handleBulkPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData("text");
    if (!text) return;
    const lines = text.split("\n").filter((l) => l.trim());
    const parsed = lines.map((line) => {
      const [key, ...vals] = line.split("=");
      return {
        key: key?.trim() || "",
        value: vals.join("=")?.trim() || "",
        description: "",
        enabled: true,
      };
    });
    if (parsed.length > 0) {
      e.preventDefault();
      items = parsed;
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-2">
    <span class="text-xs text-zinc-500">Query Parameters</span>
    <div class="flex gap-2">
      <button onclick={addRow} class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add
      </button>
    </div>
  </div>

  <table class="w-full text-xs">
    <thead>
      <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
        <th class="w-8 p-1 text-left"></th>
        <th class="p-1 text-left font-medium">Key</th>
        <th class="p-1 text-left font-medium">Value</th>
        <th class="p-1 text-left font-medium">Description</th>
        <th class="w-8 p-1"></th>
      </tr>
    </thead>
    <tbody onpaste={handleBulkPaste}>
      {#each items as param, i}
        <tr class="border-b border-zinc-100 dark:border-zinc-800">
          <td class="p-1">
            <input
              type="checkbox"
              bind:checked={param.enabled}
              class="w-3 h-3 rounded border-zinc-300"
            />
          </td>
          <td class="p-1">
            <input
              type="text"
              bind:value={param.key}
              placeholder="key"
              class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
          </td>
          <td class="p-1">
            <input
              type="text"
              bind:value={param.value}
              placeholder="value"
              class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
          </td>
          <td class="p-1">
            <input
              type="text"
              bind:value={param.description}
              placeholder="description"
              class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 rounded focus:outline-none focus:border-blue-500"
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
  <p class="text-[10px] text-zinc-400 mt-2">Paste key=value pairs (one per line) to bulk add</p>
</div>
