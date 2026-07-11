<script lang="ts">
  import { currentRequest, activeTab, isSending, setUrl, setMethod, setName } from "../stores/request";
  import { HTTP_METHODS } from "../utils/http-methods";
  import ParamsEditor from "./ParamsEditor.svelte";
  import HeadersEditor from "./HeadersEditor.svelte";
  import AuthPanel from "./AuthPanel.svelte";
  import RequestBody from "./RequestBody.svelte";
  import ScriptEditor from "./ScriptEditor.svelte";
  import type { HttpMethod, RequestTab } from "../types";

  let { onSend = () => {} } = $props();

  let showMethodDropdown = $state(false);

  const TABS: { id: RequestTab; label: string }[] = [
    { id: "params", label: "Params" },
    { id: "headers", label: "Headers" },
    { id: "auth", label: "Auth" },
    { id: "body", label: "Body" },
    { id: "scripts", label: "Scripts" },
  ];

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  }

  function selectTab(tab: RequestTab) {
    activeTab.set(tab);
  }
</script>

<div class="shrink-0 border-b border-zinc-200 dark:border-zinc-800" onkeydown={handleKeydown}>
  <!-- URL Bar (PRD 5.1) -->
  <div class="flex items-center gap-2 px-4 py-2">
    <!-- Method Selector -->
    <div class="relative">
      <button
        onclick={() => (showMethodDropdown = !showMethodDropdown)}
        class={`method-badge text-xs px-2 py-1 rounded ${$currentRequest.method.toLowerCase() === "get" ? "method-get" : $currentRequest.method.toLowerCase() === "post" ? "method-post" : $currentRequest.method.toLowerCase() === "put" ? "method-put" : $currentRequest.method.toLowerCase() === "patch" ? "method-patch" : $currentRequest.method.toLowerCase() === "delete" ? "method-delete" : $currentRequest.method.toLowerCase() === "head" ? "method-head" : "method-options"}`}
      >
        {$currentRequest.method}
        <svg class="w-3 h-3 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {#if showMethodDropdown}
        <div class="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
          {#each HTTP_METHODS as m}
            <button
              onclick={() => { setMethod(m.method); showMethodDropdown = false; }}
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            >
              <span class={`method-badge text-[10px] px-1.5 py-0.5 ${m.method.toLowerCase() === "get" ? "method-get" : m.method.toLowerCase() === "post" ? "method-post" : m.method.toLowerCase() === "put" ? "method-put" : m.method.toLowerCase() === "patch" ? "method-patch" : m.method.toLowerCase() === "delete" ? "method-delete" : m.method.toLowerCase() === "head" ? "method-head" : "method-options"}`}>
                {m.method}
              </span>
              <span class="text-zinc-500">{m.description}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- URL Input -->
    <div class="flex-1">
      <input
        type="text"
        bind:value={$currentRequest.url}
        oninput={(e) => setUrl(e.currentTarget.value)}
        placeholder="Enter request URL or {{base_url}}/path"
        class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      />
    </div>

    <!-- Send / Cancel Button -->
    <button
      onclick={onSend}
      disabled={$isSending || !$currentRequest.url}
      class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1.5"
    >
      {#if $isSending}
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Cancel
      {:else}
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 3l14 9-14 9V3z" />
        </svg>
        Send
      {/if}
    </button>
  </div>

  <!-- Tab Bar (PRD 9.1) -->
  <div class="flex px-4 gap-0">
    {#each TABS as tab}
      <button
        onclick={() => selectTab(tab.id)}
        class="px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px"
        class:text-blue-600={$activeTab === tab.id}
        class:text-zinc-500={$activeTab !== tab.id}
        class:border-blue-500={$activeTab === tab.id}
        class:border-transparent={$activeTab !== tab.id}
        class:hover:text-zinc-700={$activeTab !== tab.id}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  <div class="px-4 py-3">
    {#if $activeTab === "params"}
      <ParamsEditor />
    {:else if $activeTab === "headers"}
      <HeadersEditor />
    {:else if $activeTab === "auth"}
      <AuthPanel />
    {:else if $activeTab === "body"}
      <RequestBody />
    {:else if $activeTab === "scripts"}
      <ScriptEditor />
    {/if}
  </div>
</div>
