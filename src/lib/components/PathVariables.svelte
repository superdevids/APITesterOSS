<script lang="ts">
  import { currentRequest, setUrl } from "../stores/request";

  let rawUrl = $state($currentRequest.url);
  let pathValues = $state<Record<string, string>>({});
  let updating = $state(false);

  let paramNames = $derived(
    [...rawUrl.matchAll(/:([a-zA-Z_]\w*)/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i)
  );

  $effect(() => {
    const url = $currentRequest.url;
    const fresh = [...url.matchAll(/:([a-zA-Z_]\w*)/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i);
    if (JSON.stringify(fresh) !== JSON.stringify(paramNames)) {
      if (!updating) {
        rawUrl = url;
        pathValues = {};
      }
    }
  });

  $effect(() => {
    const hasChanged = paramNames.some((n) => pathValues[n] !== undefined && pathValues[n] !== "");
    if (!hasChanged && paramNames.length > 0) return;
    if (updating) return;
    updating = true;
    let substituted = rawUrl;
    for (const [k, v] of Object.entries(pathValues)) {
      if (v) {
        substituted = substituted.replace(new RegExp(`:${k}\\b`, "g"), encodeURIComponent(v));
      }
    }
    if (substituted !== $currentRequest.url) {
      setUrl(substituted);
    }
    updating = false;
  });

  function handleInput(name: string, value: string) {
    pathValues = { ...pathValues, [name]: value };
  }
</script>

{#if paramNames.length > 0}
  <div class="mb-3">
    <span class="text-xs text-zinc-500 mb-2 block">Path Variables</span>
    <div class="space-y-1.5">
      {#each paramNames as name}
        <div class="flex items-center gap-2">
          <label class="text-xs font-mono text-blue-600 dark:text-blue-400 w-24 shrink-0 text-right">:{name}</label>
          <input
            type="text"
            placeholder="value"
            value={pathValues[name] || ""}
            oninput={(e) => handleInput(name, (e.target as HTMLInputElement).value)}
            class="flex-1 px-2 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      {/each}
    </div>
  </div>
{/if}
