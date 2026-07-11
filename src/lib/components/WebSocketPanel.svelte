<script lang="ts">
  let url = $state("ws://localhost:8080");
  let connected = $state(false);
  let connecting = $state(false);
  let autoReconnect = $state(false);
  let messageInput = $state("");
  let messageMode = $state<"text" | "json">("text");
  let logFilter = $state<"all" | "sent" | "received">("all");
  let showUrlHistory = $state(false);

  let ws: WebSocket | null = $state(null);
  let reconnectAttempts = $state(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  let urlHistory = $state<string[]>(["ws://localhost:8080"]);
  let messages = $state<WebSocketMessage[]>([]);
  let messageIdCounter = $state(0);

  interface WebSocketMessage {
    id: number;
    timestamp: string;
    direction: "sent" | "received";
    content: string;
  }

  let filteredMessages = $derived(
    logFilter === "all" ? messages : messages.filter((m) => m.direction === logFilter)
  );

  let messageLogEl: HTMLDivElement | undefined = $state();
  let exportMenuOpen = $state(false);

  const JSON_PLACEHOLDER = '{"key": "value"}';

  $effect(() => {
    if (messageLogEl) {
      messageLogEl.scrollTop = messageLogEl.scrollHeight;
    }
  });

  function getTimestamp(): string {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
  }

  function addMessage(direction: "sent" | "received", content: string) {
    messageIdCounter++;
    messages = [
      ...messages,
      { id: messageIdCounter, timestamp: getTimestamp(), direction, content },
    ];
  }

  function connect() {
    if (connected || connecting) return;

    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      addMessage("received", "Error: URL must start with ws:// or wss://");
      return;
    }

    connecting = true;
    addMessage("received", "Connecting to " + url + "...");

    if (!urlHistory.includes(url)) {
      urlHistory = [...urlHistory, url];
    }

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        connected = true;
        connecting = false;
        reconnectAttempts = 0;
        addMessage("received", "Connected");
      };

      ws.onclose = (event) => {
        connected = false;
        connecting = false;
        addMessage("received", "Disconnected (code: " + event.code + ")");

        if (autoReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          addMessage(
            "received",
            "Reconnecting in 2s (attempt " + reconnectAttempts + "/" + MAX_RECONNECT_ATTEMPTS + ")..."
          );
          setTimeout(() => connect(), 2000);
        }

        ws = null;
      };

      ws.onerror = () => {
        addMessage("received", "WebSocket error occurred");
      };

      ws.onmessage = (event) => {
        addMessage("received", event.data);
      };
    } catch (e) {
      connecting = false;
      addMessage("received", "Connection failed: " + (e as Error).message);
    }
  }

  function disconnect() {
    autoReconnect = false;
    if (ws) {
      ws.close();
      ws = null;
    }
    connected = false;
    connecting = false;
  }

  function sendMessage() {
    if (!ws || !connected || !messageInput.trim()) return;

    const content = messageInput.trim();

    if (messageMode === "json") {
      try {
        JSON.parse(content);
      } catch {
        addMessage("received", "Error: Invalid JSON");
        return;
      }
    }

    ws.send(content);
    addMessage("sent", content);
    messageInput = "";
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function clearLog() {
    messages = [];
    messageIdCounter = 0;
  }

  function exportLog(format: "txt" | "json") {
    exportMenuOpen = false;
    if (messages.length === 0) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
      filename = "websocket-log-" + Date.now() + ".json";
      mimeType = "application/json";
    } else {
      content = messages
        .map(
          (m) =>
            "[" + m.timestamp + "] " + (m.direction === "sent" ? "SENT" : "RECV") + " " + m.content
        )
        .join("\n");
      filename = "websocket-log-" + Date.now() + ".txt";
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

  function formatMessageContent(content: string): string {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }

  function isJsonContent(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  function selectUrl(entry: string) {
    url = entry;
    showUrlHistory = false;
  }

  function statusText(): string {
    if (connecting) return "Connecting...";
    if (connected) return "Connected to " + url;
    return "Disconnected";
  }

  function statusColor(): string {
    if (connecting) return "";
    if (connected) return "text-green-500";
    return "";
  }

  function messageCountText(): string {
    let text = messages.length + " message";
    text += messages.length === 1 ? "" : "s";
    if (logFilter !== "all") {
      text += " (" + filteredMessages.length + " shown)";
    }
    return text;
  }

  $effect(() => {
    return () => {
      if (ws) {
        ws.close();
        ws = null;
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
        placeholder="ws://localhost:8080"
        disabled={connected || connecting}
        class="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
      />
      <button
        onclick={() => (showUrlHistory = !showUrlHistory)}
        disabled={connected || connecting}
        class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {#if showUrlHistory}
        <div class="absolute left-0 top-full mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {#each urlHistory as entry}
            <button
              onclick={() => selectUrl(entry)}
              class="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-zinc-100 dark:hover:bg-zinc-700 truncate"
            >
              {entry}
            </button>
          {/each}
        </div>
      {/if}
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

  <!-- Message Input -->
  <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
    <div class="flex items-center gap-2">
      <div class="flex-1 relative">
        {#if messageMode === "json"}
          <textarea
            bind:value={messageInput}
            onkeydown={handleKeyDown}
            placeholder={JSON_PLACEHOLDER}
            disabled={!connected}
            rows="2"
            class="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          ></textarea>
        {:else}
          <input
            type="text"
            bind:value={messageInput}
            onkeydown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!connected}
            class="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        {/if}
      </div>
      <button
        onclick={sendMessage}
        disabled={!connected || !messageInput.trim()}
        class="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 rounded-lg transition-colors"
      >
        Send
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <select
          bind:value={messageMode}
          class="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
        >
          <option value="text">Text</option>
          <option value="json">JSON</option>
        </select>

        <select
          bind:value={logFilter}
          class="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
          <input type="checkbox" bind:checked={autoReconnect} class="w-3 h-3 rounded border-zinc-300" />
          Auto-reconnect
        </label>

        <button
          onclick={clearLog}
          disabled={messages.length === 0}
          class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
        >
          Clear
        </button>

        <div class="relative">
          <button
            onclick={() => (exportMenuOpen = !exportMenuOpen)}
            disabled={messages.length === 0}
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
  </div>

  <!-- Message Log -->
  <div
    bind:this={messageLogEl}
    class="flex-1 overflow-y-auto font-mono text-xs"
    class:p-2={filteredMessages.length > 0}
  >
    {#if filteredMessages.length === 0}
      <div class="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600 text-xs">
        {#if messages.length === 0}
          No messages yet
        {:else}
          No {logFilter} messages
        {/if}
      </div>
    {:else}
      {#each filteredMessages as msg (msg.id)}
        <div class="px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
          <div class="flex items-start gap-2">
            <span
              class="shrink-0 mt-0.5"
              class:text-green-500={msg.direction === "received"}
              class:text-blue-500={msg.direction === "sent"}
            >
              {#if msg.direction === "received"}<span>&#9664;</span>{:else}<span>&#9654;</span>{/if}
            </span>
            <span class="shrink-0 text-zinc-400 dark:text-zinc-500">{msg.timestamp}</span>
            <span
              class="shrink-0 text-[10px] font-medium uppercase tracking-wider"
              class:text-green-600={msg.direction === "received"}
              class:text-blue-600={msg.direction === "sent"}
            >
              {#if msg.direction === "received"}Recv:{:else}Sent:{/if}
            </span>
            <span class="break-all text-zinc-700 dark:text-zinc-300">
              {#if isJsonContent(msg.content)}
                <pre class="inline whitespace-pre-wrap">{formatMessageContent(msg.content)}</pre>
              {:else}
                {msg.content}
              {/if}
            </span>
          </div>
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
    <span>{messageCountText()}</span>
  </div>
</div>
