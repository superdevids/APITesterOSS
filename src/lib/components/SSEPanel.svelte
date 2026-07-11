<script lang="ts">
  let url = $state("http://localhost:8080/events");
  let connected = $state(false);
  let connecting = $state(false);
  let autoReconnect = $state(true);

  let eventSource: EventSource | null = $state(null);
  let events = $state<SSEEvent[]>([]);
  let eventIdCounter = $state(0);

  interface SSEEvent {
    id: number;
    eventName: string;
    data: string;
    lastEventId: string;
    timestamp: string;
  }

  let logEl: HTMLDivElement | undefined = $state();
  let exportMenuOpen = $state(false);

  $effect(() => {
    if (logEl) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  });

  function getTimestamp(): string {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
  }

  function addEvent(eventName: string, data: string, lastEventId: string) {
    eventIdCounter++;
    events = [
      ...events,
      { id: eventIdCounter, eventName, data, lastEventId, timestamp: getTimestamp() },
    ];
  }

  function connect() {
    if (connected || connecting) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      addEvent("error", "URL must start with http:// or https://", "");
      return;
    }

    connecting = true;
    addEvent("info", "Connecting to " + url + "...", "");

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        connected = true;
        connecting = false;
        addEvent("info", "Connected", "");
      };

      eventSource.onmessage = (event) => {
        addEvent("message", event.data, event.lastEventId);
      };

      eventSource.onerror = () => {
        connected = false;
        connecting = false;
        addEvent("error", "Connection error" + (autoReconnect ? " (reconnecting...)" : ""), "");

        if (!autoReconnect && eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    } catch (e) {
      connecting = false;
      addEvent("error", "Connection failed: " + (e as Error).message, "");
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    connected = false;
    connecting = false;
    addEvent("info", "Disconnected", "");
  }

  function clearLog() {
    events = [];
    eventIdCounter = 0;
  }

  function exportLog(format: "txt" | "json") {
    exportMenuOpen = false;
    if (events.length === 0) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(events, null, 2);
      filename = "sse-log-" + Date.now() + ".json";
      mimeType = "application/json";
    } else {
      content = events
        .map((e) =>
          "[" + e.timestamp + "] " + e.eventName + " | " + e.data + (e.lastEventId ? " | id: " + e.lastEventId : "")
        )
        .join("\n");
      filename = "sse-log-" + Date.now() + ".txt";
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  function statusText(): string {
    if (connecting) return "Connecting...";
    if (connected) return "Connected to " + url;
    return "Disconnected";
  }

  function statusColor(): string {
    if (connected) return "text-green-500";
    return "";
  }

  $effect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  });
</script>

<div class="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
  <!-- URL Bar -->
  <div class="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
    <div class="relative flex-1">
      <input
        type="text"
        bind:value={url}
        placeholder="http://localhost:8080/events"
        disabled={connected || connecting}
        class="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
      />
    </div>
    {#if connected}
      <button
        onclick={disconnect}
        class="px-4 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
      >
        Disconnect
      </button>
    {:else}
      <button
        onclick={connect}
        disabled={connecting}
        class="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 rounded-lg transition-colors flex items-center gap-1.5"
      >
        {#if connecting}
          <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Connecting
        {:else}
          Connect
        {/if}
      </button>
    {/if}
  </div>

  <!-- Toolbar -->
  <div class="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
        <input type="checkbox" bind:checked={autoReconnect} class="w-3 h-3 rounded border-zinc-300" />
        Auto-reconnect
      </label>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={clearLog}
        disabled={events.length === 0}
        class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
      >
        Clear
      </button>

      <div class="relative">
        <button
          onclick={() => (exportMenuOpen = !exportMenuOpen)}
          disabled={events.length === 0}
          class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 flex items-center gap-1"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export
        </button>
        {#if exportMenuOpen}
          <div class="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
            <button onclick={() => exportLog("txt")} class="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 whitespace-nowrap">
              Export as .txt
            </button>
            <button onclick={() => exportLog("json")} class="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 whitespace-nowrap">
              Export as .json
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Event Log -->
  <div
    bind:this={logEl}
    class="flex-1 overflow-y-auto font-mono text-xs"
    class:p-2={events.length > 0}
  >
    {#if events.length === 0}
      <div class="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600 text-xs">
        No events yet
      </div>
    {:else}
      {#each events as evt (evt.id)}
        <div class="px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
          <div class="flex items-start gap-2 mb-0.5">
            <span class="shrink-0 text-zinc-400 dark:text-zinc-500">[{evt.timestamp}]</span>
            {#if evt.eventName === "error"}
              <span class="shrink-0 text-[10px] font-medium uppercase tracking-wider text-red-500">error</span>
            {:else if evt.eventName === "info"}
              <span class="shrink-0 text-[10px] font-medium uppercase tracking-wider text-blue-500">info</span>
            {:else}
              <span class="shrink-0 text-[10px] font-medium uppercase tracking-wider text-purple-500">{evt.eventName}</span>
            {/if}
            {#if evt.lastEventId}
              <span class="shrink-0 text-[10px] text-amber-500">id: {evt.lastEventId}</span>
            {/if}
          </div>
          <div class="pl-[calc(1ch+2px)] break-all text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{evt.data}</div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Status Bar -->
  <div class="flex items-center justify-between px-3 py-1 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-400">
    <span class={statusColor()}>
      {#if connected}
        <span class="text-green-500">&#9679;</span>
      {/if}
      {statusText()}
    </span>
    <span>{events.length} event{events.length === 1 ? "" : "s"}</span>
  </div>
</div>