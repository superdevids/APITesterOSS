<script lang="ts">
  import { currentRequest } from "../stores/request";
  import { generateSnippet, type SnippetContext } from "../utils/code-snippets";

  let { onclose = () => {} } = $props();

  let selectedLanguage = $state("curl");
  let copied = $state(false);

  const LANGUAGES = [
    { id: "curl", label: "cURL" },
    { id: "javascript", label: "JavaScript (fetch)" },
    { id: "python", label: "Python (requests)" },
    { id: "go", label: "Go (net/http)" },
    { id: "rust", label: "Rust (reqwest)" },
    { id: "java", label: "Java (HttpClient)" },
  ];

  let snippet = $derived.by(() => {
    const ctx: SnippetContext = {
      url: $currentRequest.url,
      method: $currentRequest.method,
      headers: $currentRequest.headers,
      body: $currentRequest.body,
      auth: $currentRequest.auth,
    };
    return generateSnippet(selectedLanguage, ctx);
  });

  async function copySnippet() {
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(snippet);
    } catch {
      await navigator.clipboard.writeText(snippet);
    }
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<!-- Overlay -->
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onclick={onclose}>
  <!-- Modal -->
  <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col" onclick={(e) => e.stopPropagation()}>
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold">Code Snippets</h3>
      <button onclick={onclose} class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Language Tabs -->
    <div class="flex flex-wrap gap-1.5 px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
      {#each LANGUAGES as lang}
        <button
          onclick={() => (selectedLanguage = lang.id)}
          class="px-3 py-1.5 text-xs rounded-md border transition-colors"
          class:bg-blue-50={selectedLanguage === lang.id}
          class:border-blue-300={selectedLanguage === lang.id}
          class:text-blue-700={selectedLanguage === lang.id}
          class:border-zinc-300={selectedLanguage !== lang.id}
          class:dark:border-zinc-600={selectedLanguage !== lang.id}
        >
          {lang.label}
        </button>
      {/each}
    </div>

    <!-- Code -->
    <div class="flex-1 p-5 overflow-auto">
      <pre class="text-sm font-mono bg-zinc-900 text-green-400 rounded-lg p-4 overflow-x-auto leading-relaxed">{snippet}</pre>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <button onclick={onclose} class="px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
        Close
      </button>
      <button onclick={copySnippet} class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
        {#if copied}
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Copied!
        {:else}
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        {/if}
      </button>
    </div>
  </div>
</div>
