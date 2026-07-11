<script lang="ts">
  let protoFileName = $state("");
  let protoContent = $state("");
  let services = $state<ProtoService[]>([]);
  let selectedService = $state("");
  let selectedMethod = $state("");
  let requestJson = $state("");
  let responseJson = $state("");
  let responseHeaders = $state("");
  let responseError = $state("");
  let isSending = $state(false);
  let metadataItems = $state<MetadataItem[]>([]);
  let tlsEnabled = $state(false);
  let targetHost = $state("localhost:50051");
  let showResponse = $state(false);

  interface ProtoService {
    name: string;
    methods: ProtoMethod[];
    collapsed: boolean;
  }

  interface ProtoMethod {
    name: string;
    inputType: string;
    outputType: string;
    clientStreaming: boolean;
    serverStreaming: boolean;
  }

  interface MetadataItem {
    key: string;
    value: string;
    enabled: boolean;
  }

  let metadataIdCounter = $state(0);

  function addMetadataRow() {
    metadataIdCounter++;
    metadataItems = [...metadataItems, { key: "", value: "", enabled: true }];
  }

  function removeMetadataRow(index: number) {
    metadataItems = metadataItems.filter((_, i) => i !== index);
  }

  function parseProto(content: string): ProtoService[] {
    const services: ProtoService[] = [];
    const serviceRegex = /service\s+(\w+)\s*\{([^}]*)\}/g;
    const rpcRegex = /rpc\s+(\w+)\s*\(\s*(\w+)\s*\)\s*returns\s*\(\s*(\w+)\s*\)\s*(?:;|\{)/g;
    const streamRegex = /stream\s+(\w+)/;

    let match: RegExpExecArray | null;
    while ((match = serviceRegex.exec(content)) !== null) {
      const serviceName = match[1];
      const serviceBody = match[2];
      const methods: ProtoMethod[] = [];

      let rpcMatch: RegExpExecArray | null;
      const localRpcRegex = new RegExp(rpcRegex.source, 'g');
      while ((rpcMatch = localRpcRegex.exec(serviceBody)) !== null) {
        const methodName = rpcMatch[1];
        const inputType = rpcMatch[2];
        const outputType = rpcMatch[3];

        const linesBefore = content.substring(0, rpcMatch.index).split('\n');
        const lastLine = linesBefore[linesBefore.length - 1];

        methods.push({
          name: methodName,
          inputType: inputType.replace(/^stream\s+/, ''),
          outputType: outputType.replace(/^stream\s+/, ''),
          clientStreaming: inputType.startsWith('stream '),
          serverStreaming: outputType.startsWith('stream '),
        });
      }

      if (methods.length > 0) {
        services.push({ name: serviceName, methods, collapsed: false });
      }
    }

    return services;
  }

  function generateTemplate(inputType: string): string {
    const messageRegex = new RegExp(
      'message\\s+' + inputType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{([^}]*)\\}', 's'
    );
    const match = messageRegex.exec(protoContent);
    if (!match) return '{\n  \n}';

    const fields = match[1].trim();
    if (!fields) return '{\n  \n}';

    const fieldLines = fields.split('\n').map((l) => l.trim()).filter(Boolean);
    const jsonFields: string[] = [];

    for (const line of fieldLines) {
      const fieldMatch = line.match(
        /(?:repeated\s+)?(optional\s+)?(\w+(?:\.\w+)*)\s+(\w+)\s*=\s*\d+/
      );
      if (fieldMatch) {
        const type = fieldMatch[2];
        const name = fieldMatch[3];
        let defaultValue: string;
        if (type === 'string') defaultValue = '""';
        else if (type === 'int32' || type === 'int64' || type === 'uint32' || type === 'uint64' ||
                 type === 'sint32' || type === 'sint64' || type === 'fixed32' || type === 'fixed64' ||
                 type === 'sfixed32' || type === 'sfixed64' || type === 'double' || type === 'float') {
          defaultValue = '0';
        } else if (type === 'bool') defaultValue = 'false';
        else defaultValue = 'null';
        jsonFields.push('  "' + name + '": ' + defaultValue);
      }
    }

    return '{\n' + jsonFields.join(',\n') + '\n}';
  }

  async function importProto() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "Proto Files", extensions: ["proto"] }],
      });
      if (!selected) return;

      const response = await fetch(selected as string);
      const content = await response.text();
      protoContent = content;
      protoFileName = (selected as string).split(/[/\\]/).pop() || "";

      const parsed = parseProto(content);
      services = parsed;
      selectedService = "";
      selectedMethod = "";
      requestJson = "";
      responseJson = "";
      responseError = "";
      showResponse = false;
    } catch (e) {
      protoFileName = "";
      protoContent = "";
      services = [];
      const msg = (e as Error).message;
      if (msg.includes("Not allowed") || msg.includes("fetch")) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".proto";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          protoFileName = file.name;
          protoContent = await file.text();
          const parsed = parseProto(protoContent);
          services = parsed;
        };
        input.click();
      }
    }
  }

  function selectMethod(serviceName: string, method: ProtoMethod) {
    selectedService = serviceName;
    selectedMethod = method.name;
    requestJson = generateTemplate(method.inputType);
    responseJson = "";
    responseError = "";
    showResponse = false;
  }

  async function sendUnary() {
    if (!selectedService || !selectedMethod || !requestJson.trim()) return;

    isSending = true;
    responseError = "";
    showResponse = false;

    try {
      const metadata: Record<string, string> = {};
      for (const item of metadataItems) {
        if (item.enabled && item.key.trim()) {
          metadata[item.key.trim()] = item.value;
        }
      }

      let parsedRequest: unknown;
      try {
        parsedRequest = JSON.parse(requestJson);
      } catch {
        responseError = "Invalid JSON in request body";
        isSending = false;
        showResponse = true;
        return;
      }

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{ response: string; headers: string }>("grpc_call", {
        service: selectedService,
        method: selectedMethod,
        host: targetHost,
        tls: tlsEnabled,
        requestBody: JSON.stringify(parsedRequest),
        metadata,
      });

      responseJson = result.response;
      responseHeaders = result.headers || "";
      showResponse = true;
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("unknown command") || err.message?.includes("not found")) {
        responseError = "gRPC backend not available. The 'grpc_call' command needs to be implemented in the Tauri backend (Rust/tonic).";
      } else {
        responseError = err.message || String(err);
      }
      showResponse = true;
    } finally {
      isSending = false;
    }
  }

  function formatJson(text: string): string {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  function toggleService(index: number) {
    services = services.map((s, i) =>
      i === index ? { ...s, collapsed: !s.collapsed } : s
    );
  }

  let hasMethods = $derived(services.some((s) => s.methods.length > 0));

  $effect(() => {
    if (protoContent && !hasMethods && services.length > 0) {
      const parsed = parseProto(protoContent);
      if (parsed.length === 0) {
        services = [];
      }
    }
  });
</script>

<div class="flex h-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
  <!-- Sidebar: Services & Methods -->
  <div class="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900">
    <div class="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
      <button
        onclick={importProto}
        class="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Import .proto
      </button>
      {#if protoFileName}
        <p class="mt-1.5 text-[10px] text-zinc-500 truncate" title={protoFileName}>{protoFileName}</p>
      {/if}
    </div>

    <div class="flex-1 overflow-y-auto">
      {#if services.length === 0}
        <div class="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600 text-xs px-3 text-center">
          {#if protoFileName}
            No services found in proto file
          {:else}
            Import a .proto file to see services and methods
          {/if}
        </div>
      {:else}
        {#each services as service, i}
          <div>
            <button
              onclick={() => toggleService(i)}
              class="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg
                class="w-3 h-3 text-zinc-400 transition-transform"
                class:rotate-90={!service.collapsed}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              {service.name}
            </button>
            {#if !service.collapsed}
              {#each service.methods as method}
                <button
                  onclick={() => selectMethod(service.name, method)}
                  class={[
                    "w-full flex items-center gap-2 pl-8 pr-3 py-1 text-xs transition-colors",
                    selectedService === service.name && selectedMethod === method.name
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span class="truncate">{method.name}</span>
                  {#if method.serverStreaming}
                    <span class="ml-auto text-[9px] text-green-500 font-medium">SS</span>
                  {/if}
                  {#if method.clientStreaming}
                    <span class="ml-auto text-[9px] text-orange-500 font-medium">CS</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Main Area -->
  <div class="flex-1 flex flex-col overflow-hidden">
    {#if !selectedMethod}
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center text-zinc-400 dark:text-zinc-600">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <p class="text-sm">Select a service method from the sidebar</p>
          <p class="text-xs mt-1">or import a .proto file to get started</p>
        </div>
      </div>
    {:else}
      <!-- Top Toolbar -->
      <div class="flex items-center gap-3 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
        <div class="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
          <span class="text-blue-600 dark:text-blue-400">{selectedService}</span>
          <span class="text-zinc-400">.</span>
          <span>{selectedMethod}</span>
        </div>
        <div class="flex-1" />
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
            <input type="checkbox" bind:checked={tlsEnabled} class="w-3 h-3 rounded border-zinc-300" />
            TLS
          </label>
          <input
            type="text"
            bind:value={targetHost}
            placeholder="localhost:50051"
            class="w-40 px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3 space-y-3">
        <!-- Metadata Editor -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">Metadata</span>
            <button onclick={addMetadataRow} class="text-xs text-blue-500 hover:text-blue-600">+ Add</button>
          </div>
          {#if metadataItems.length > 0}
            <div class="overflow-hidden border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-zinc-50 dark:bg-zinc-800">
                    <th class="w-8 px-2 py-1 text-left"></th>
                    <th class="px-2 py-1 text-left text-zinc-500 font-medium">Key</th>
                    <th class="px-2 py-1 text-left text-zinc-500 font-medium">Value</th>
                    <th class="w-8 px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {#each metadataItems as item, i}
                    <tr class="border-t border-zinc-100 dark:border-zinc-800">
                      <td class="px-2 py-1">
                        <input
                          type="checkbox"
                          bind:checked={item.enabled}
                          class="w-3 h-3 rounded border-zinc-300"
                        />
                      </td>
                      <td class="px-2 py-1">
                        <input
                          type="text"
                          bind:value={item.key}
                          placeholder="key"
                          class="w-full bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none font-mono"
                        />
                      </td>
                      <td class="px-2 py-1">
                        <input
                          type="text"
                          bind:value={item.value}
                          placeholder="value"
                          class="w-full bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none font-mono"
                        />
                      </td>
                      <td class="px-2 py-1">
                        <button
                          onclick={() => removeMetadataRow(i)}
                          class="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="text-[10px] text-zinc-400 italic">No metadata entries. Click "+ Add" to add key-value pairs.</p>
          {/if}
        </div>

        <!-- Request JSON -->
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Request JSON</label>
          <textarea
            bind:value={requestJson}
            rows="8"
            placeholder={JSON.stringify({ field: "value" })}
            class="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          ></textarea>
        </div>

        <!-- Send Button -->
        <button
          onclick={sendUnary}
          disabled={isSending || !requestJson.trim()}
          class="w-full px-4 py-2 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          {#if isSending}
            <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Sending...
          {:else}
            Send Unary Request
          {/if}
        </button>

        <!-- Response -->
        {#if showResponse}
          <div class="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {#if responseError}Error{:else}Response{/if}
              </span>
              {#if responseJson && !responseError}
                <button
                  onclick={() => {
                    try { navigator.clipboard.writeText(responseJson); } catch {}
                  }}
                  class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  Copy
                </button>
              {/if}
            </div>
            {#if responseError}
              <pre class="p-3 text-xs font-mono text-red-500 whitespace-pre-wrap">{responseError}</pre>
            {:else}
              <pre class="p-3 text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-96">{formatJson(responseJson)}</pre>
              {#if responseHeaders}
                <div class="border-t border-zinc-200 dark:border-zinc-700">
                  <div class="px-3 py-1 text-[10px] font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-800">Response Headers</div>
                  <pre class="p-3 text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-32">{responseHeaders}</pre>
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>