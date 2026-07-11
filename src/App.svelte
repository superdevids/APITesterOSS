<script lang="ts">
  import { onMount } from "svelte";
  import { theme, toggleTheme } from "./lib/stores/theme";
  import { currentRequest, isSending, response, error, resetRequest } from "./lib/stores/request";
  import { loadCollections, collectionTree } from "./lib/stores/collection";
  import { activeEnvironmentId, environments, loadEnvironments } from "./lib/stores/environment";
  import { loadHistory } from "./lib/stores/history";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import RequestBuilder from "./lib/components/RequestBuilder.svelte";
  import ResponseViewer from "./lib/components/ResponseViewer.svelte";
  import EnvironmentManager from "./lib/components/EnvironmentManager.svelte";
  import WebSocketPanel from "./lib/components/WebSocketPanel.svelte";
  import SSEPanel from "./lib/components/SSEPanel.svelte";
  import GRPCPanel from "./lib/components/GRPCPanel.svelte";
  import KeyboardShortcutsModal from "./lib/components/KeyboardShortcutsModal.svelte";
  import { sendRequest } from "./lib/components/send-request";
  import type { SidebarView } from "./lib/types";

  type Protocol = "rest" | "websocket" | "sse" | "grpc";

  let sidebarView: SidebarView = $state("collections");
  let showEnvManager = $state(false);
  let showEnvDropdown = $state(false);
  let activeProtocol: Protocol = $state("rest");
  let showShortcuts = $state(false);

  onMount(() => {
    loadCollections();
    loadEnvironments();
    loadHistory();

    // Global keyboard shortcuts
    function handleKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (activeProtocol === "rest") handleSend();
      }
      if (e.key === "Escape") {
        showEnvDropdown = false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "E") {
        e.preventDefault();
        showEnvDropdown = true;
      }
      if (e.key === "?") {
        showShortcuts = true;
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });

  async function handleSend() {
    showEnvDropdown = false;
    await sendRequest();
  }

  const protocols: { id: Protocol; label: string; icon: string }[] = [
    { id: "rest", label: "REST", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { id: "websocket", label: "WebSocket", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" },
    { id: "sse", label: "SSE", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
    { id: "grpc", label: "gRPC", icon: "M4 7V4h16v3M4 7v10m0-10h16m0 0v10M4 17h16M7 12h10" },
  ];
</script>

<div class="h-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
  <!-- Top Bar (PRD 9.1 Layout) -->
  <header class="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <svg class="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span class="font-semibold text-sm">API Tester OSS</span>
        <span class="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded ml-1">v0.1.0</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- Protocol Selector -->
      <div class="flex gap-0.5 mr-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
        {#each protocols as p}
          <button
            onclick={() => (activeProtocol = p.id)}
            class="px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1"
            class:bg-white={activeProtocol === p.id}
            class:dark:bg-zinc-700={activeProtocol === p.id}
            class:text-blue-600={activeProtocol === p.id}
            class:text-zinc-500={activeProtocol !== p.id}
            class:shadow-sm={activeProtocol === p.id}
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d={p.icon} />
            </svg>
            {p.label}
          </button>
        {/each}
      </div>

      <!-- Environment Selector -->
      <div class="relative">
        <button
          onclick={() => (showEnvDropdown = !showEnvDropdown)}
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg class="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
          {$activeEnvironmentId ? $environments.find((e) => e.id === $activeEnvironmentId)?.name || "No Env" : "No Environment"}
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {#if showEnvDropdown}
          <div class="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
            <div class="p-1">
              <button onclick={() => { activeEnvironmentId.set(null); showEnvDropdown = false; }} class="w-full text-left px-3 py-2 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">No Environment</button>
              {#each $environments as env}
                <button onclick={() => { activeEnvironmentId.set(env.id); showEnvDropdown = false; }} class="w-full text-left px-3 py-2 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full shrink-0" class:bg-blue-500={env.id === $activeEnvironmentId} class:bg-zinc-300={env.id !== $activeEnvironmentId} />
                  {env.name}
                </button>
              {/each}
              <hr class="my-1 border-zinc-200 dark:border-zinc-700" />
              <button onclick={() => { showEnvManager = true; showEnvDropdown = false; }} class="w-full text-left px-3 py-2 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-blue-500">Manage Environments</button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <button onclick={() => resetRequest()} class="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="New Request (Ctrl+N)">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <button onclick={toggleTheme} class="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Toggle Theme">
        {#if $theme === "dark"}
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        {:else}
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
        {/if}
      </button>
      <button onclick={() => (showShortcuts = true)} class="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Keyboard Shortcuts">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8" />
        </svg>
      </button>
    </div>
  </header>

  <!-- Main Layout -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar bind:view={sidebarView} />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      {#if activeProtocol === "rest"}
        <!-- REST Protocol -->
        <RequestBuilder onSend={handleSend} />

        {#if $error}
          <div class="mx-4 mb-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
            <span>{$error}</span>
            <button onclick={() => error.set(null)} class="ml-2 hover:text-red-900 dark:hover:text-red-300" aria-label="Dismiss">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        {/if}

        {#if $response}
          <ResponseViewer />
        {:else if $isSending}
          <div class="flex-1 flex items-center justify-center text-zinc-400">
            <div class="flex flex-col items-center gap-3">
              <svg class="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm">Sending request...</span>
            </div>
          </div>
        {:else}
          <div class="flex-1 flex items-center justify-center text-zinc-400">
            <div class="text-center">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <p class="text-sm">Send a request to see the response</p>
              <p class="text-xs mt-1">Press <kbd class="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">Ctrl+Enter</kbd> to send</p>
            </div>
          </div>
        {/if}

      {:else if activeProtocol === "websocket"}
        <WebSocketPanel />

      {:else if activeProtocol === "sse"}
        <SSEPanel />

      {:else if activeProtocol === "grpc"}
        <GRPCPanel />
      {/if}
    </div>
  </div>
</div>

{#if showEnvManager}
  <EnvironmentManager onclose={() => (showEnvManager = false)} />
{/if}

{#if showShortcuts}
  <KeyboardShortcutsModal onclose={() => (showShortcuts = false)} />
{/if}
