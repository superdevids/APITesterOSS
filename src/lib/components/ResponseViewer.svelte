<script lang="ts">
  import { response, testResults } from "../stores/request";
  import { getStatusColor, getStatusText, formatBytes, formatTime } from "../utils/http-methods";
  import type { ResponseTab } from "../types";
  import CodeSnippetModal from "./CodeSnippetModal.svelte";

  let activeResponseTab: ResponseTab = $state("pretty");
  let rawWordWrap = $state(true);
  let searchQuery = $state("");
  let showSnippets = $state(false);

  const RESPONSE_TABS: { id: ResponseTab; label: string }[] = [
    { id: "pretty", label: "Pretty" },
    { id: "raw", label: "Raw" },
    { id: "preview", label: "Preview" },
    { id: "headers", label: "Headers" },
    { id: "cookies", label: "Cookies" },
    { id: "tests", label: "Test Results" },
  ];

  let prettyJson = $derived.by(() => {
    if (!$response) return "";
    try {
      return JSON.stringify(JSON.parse($response.body), null, 2);
    } catch {
      return $response.body;
    }
  });

  let contentType = $derived($response?.headers["content-type"] || $response?.headers["Content-Type"] || "");
  let isJson = $derived(contentType.includes("json") || contentType.includes("javascript"));
  let isImage = $derived(contentType.startsWith("image/"));
  let isHtml = $derived(contentType.includes("html"));

  const securityHeaders = ["X-Frame-Options", "Content-Security-Policy", "X-XSS-Protection", "Strict-Transport-Security", "X-Content-Type-Options"];

  async function copyResponse() {
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText($response?.body || "");
    } catch {
      await navigator.clipboard.writeText($response?.body || "");
    }
  }

  function copyHeader(key: string, value: string) {
    navigator.clipboard.writeText(`${key}: ${value}`);
  }

  function highlightSearch(text: string, query: string): string {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, "<mark class='bg-yellow-200 dark:bg-yellow-800 rounded px-0.5'>$1</mark>");
  }
</script>

{#if $response}
  <div class="flex-1 flex flex-col overflow-hidden border-t border-zinc-200 dark:border-zinc-800">
    <!-- Response Metadata Bar (PRD 5.2) -->
    <div class="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-900 shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class={`text-lg font-bold ${getStatusColor($response.statusCode)}`}>
            {$response.statusCode}
          </span>
          <span class="text-sm text-zinc-500">{getStatusText($response.statusCode)}</span>
        </div>
        <div class="flex items-center gap-3 text-xs text-zinc-400">
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {formatTime($response.responseTimeMs)}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {formatBytes($response.responseSizeBytes)}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick={copyResponse} class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1" title="Copy Response">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </button>
        <button onclick={() => (showSnippets = true)} class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1" title="Code Snippets">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Code
        </button>
      </div>
    </div>

    <!-- Response Tabs -->
    <div class="flex px-4 gap-0 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      {#each RESPONSE_TABS as tab}
        <button
          onclick={() => (activeResponseTab = tab.id)}
          class="px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px"
          class:text-blue-600={activeResponseTab === tab.id}
          class:text-zinc-500={activeResponseTab !== tab.id}
          class:border-blue-500={activeResponseTab === tab.id}
          class:border-transparent={activeResponseTab !== tab.id}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-auto">
      {#if activeResponseTab === "pretty"}
        <div class="p-4">
          {#if isJson}
            <div class="mb-2">
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search in JSON..."
                class="w-full max-w-md px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <pre class="text-sm font-mono leading-relaxed whitespace-pre-wrap">{@html highlightSearch(prettyJson, searchQuery)}</pre>
          {:else if isHtml}
            <iframe srcdoc={$response.body} class="w-full h-full min-h-[300px] border-0 rounded-md" title="HTML Preview" />
          {:else}
            <pre class="text-sm font-mono leading-relaxed whitespace-pre-wrap">{$response.body}</pre>
          {/if}
        </div>

      {:else if activeResponseTab === "raw"}
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2">
            <label class="flex items-center gap-1.5 text-xs text-zinc-500">
              <input type="checkbox" bind:checked={rawWordWrap} class="w-3 h-3" />
              Word wrap
            </label>
          </div>
          <pre class="text-sm font-mono leading-relaxed" class:whitespace-pre-wrap={rawWordWrap} class:whitespace-pre={!rawWordWrap}>{$response.body}</pre>
        </div>

      {:else if activeResponseTab === "preview"}
        <div class="p-4">
          {#if isImage}
            <img src={`data:${contentType};base64,${btoa($response.body)}`} alt="Response preview" class="max-w-full rounded-md" />
          {:else if isHtml}
            <iframe srcdoc={$response.body} class="w-full h-full min-h-[400px] border rounded-md" title="Preview" />
          {:else}
            <div class="text-sm text-zinc-400 text-center py-8">
              <p>Preview not available for this content type.</p>
              <p class="text-xs mt-1">Switch to Raw or Pretty view.</p>
            </div>
          {/if}
        </div>

      {:else if activeResponseTab === "headers"}
        <div class="p-4">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                <th class="p-2 text-left font-medium">Name</th>
                <th class="p-2 text-left font-medium">Value</th>
                <th class="w-16 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {#each Object.entries($response.headers) as [key, value]}
                <tr class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="p-2 font-medium">
                    {key}
                    {#if securityHeaders.includes(key)}
                      <span class="ml-1 px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[9px]">Security</span>
                    {/if}
                  </td>
                  <td class="p-2 font-mono text-zinc-600 dark:text-zinc-400 break-all">{value}</td>
                  <td class="p-2">
                    <button onclick={() => copyHeader(key, value)} class="text-blue-500 hover:text-blue-600 text-[10px]">Copy</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

      {:else if activeResponseTab === "cookies"}
        <div class="p-4">
          {#if $response.cookies.length > 0}
            <table class="w-full text-xs">
              <thead>
                <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                  <th class="p-2 text-left font-medium">Name</th>
                  <th class="p-2 text-left font-medium">Value</th>
                  <th class="p-2 text-left font-medium">Domain</th>
                  <th class="p-2 text-left font-medium">Path</th>
                </tr>
              </thead>
              <tbody>
                {#each $response.cookies as cookie}
                  <tr class="border-b border-zinc-100 dark:border-zinc-800">
                    <td class="p-2 font-medium">{cookie.name}</td>
                    <td class="p-2 font-mono text-zinc-600 dark:text-zinc-400 break-all">{cookie.value}</td>
                    <td class="p-2 text-zinc-500">{cookie.domain || "-"}</td>
                    <td class="p-2 text-zinc-500">{cookie.path || "-"}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="text-sm text-zinc-400 text-center py-8">No cookies in response.</p>
          {/if}
        </div>

      {:else if activeResponseTab === "tests"}
        <div class="p-4">
          {#if $testResults.length > 0}
            <div class="mb-3 flex items-center gap-3 text-xs">
              <span class="text-green-600 font-medium">
                {$testResults.filter((t) => t.passed).length} passed
              </span>
              <span class="text-red-600 font-medium">
                {$testResults.filter((t) => !t.passed).length} failed
              </span>
              <span class="text-zinc-400">
                of {$testResults.length} tests
              </span>
            </div>
            <div class="space-y-1">
              {#each $testResults as result}
                <div class="flex items-center gap-2 px-3 py-2 rounded-md text-xs {result.passed ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}">
                  {#if result.passed}
                    <svg class="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  {:else}
                    <svg class="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  {/if}
                  <span class={result.passed ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}>
                    {result.name}
                  </span>
                  {#if result.error}
                    <span class="text-red-500 ml-1">- {result.error}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-zinc-400 text-center py-8">No test results. Add test scripts in the Scripts tab.</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if showSnippets}
  <CodeSnippetModal onclose={() => (showSnippets = false)} />
{/if}
