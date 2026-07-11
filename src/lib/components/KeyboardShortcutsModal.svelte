<script lang="ts">
  import { SHORTCUTS_CONFIG, type ShortcutDef } from "../utils/keyboard-shortcuts";

  let { onclose = () => {} } = $props();

  let grouped = $derived.by(() => {
    const map: Record<string, ShortcutDef[]> = {};
    for (const s of SHORTCUTS_CONFIG) {
      (map[s.category] ??= []).push(s);
    }
    return Object.entries(map);
  });

  function getKeyParts(shortcut: ShortcutDef): string[] {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.key === "Escape") parts.push("Esc");
    else parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
    return parts;
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onclick={onclose}>
  <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col" onclick={(e) => e.stopPropagation()}>
    <div class="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold">Keyboard Shortcuts</h3>
      <button onclick={onclose} class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-auto p-5">
      {#each grouped as [category, shortcuts]}
        <div class="mb-5 last:mb-0">
          <h4 class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">{category}</h4>
          <div class="space-y-1">
            {#each shortcuts as shortcut}
              <div class="flex items-center justify-between py-1.5">
                <span class="text-sm text-zinc-700 dark:text-zinc-300">{shortcut.label}</span>
                <div class="flex items-center gap-1">
                  {#each getKeyParts(shortcut) as key, i}
                    {#if i > 0}
                      <span class="text-xs text-zinc-400 select-none">+</span>
                    {/if}
                    <kbd class="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded">{key}</kbd>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="flex items-center justify-end px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <button onclick={onclose} class="px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
        Close
      </button>
    </div>
  </div>
</div>
