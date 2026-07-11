<script lang="ts">
  import { currentRequest, setPreScript, setTestScript } from "../stores/request";
  import type { ScriptTab } from "../types";

  let activeScriptTab: ScriptTab = $state("prerequest");
  let consoleOutput = $state<string[]>([]);

  const SNIPPETS = [
    { name: "Check Status 200", code: `pm.expect(pm.response.statusCode).to.equal(200);` },
    { name: "Check Response Time", code: `pm.expect(pm.response.responseTime).to.be.below(500);` },
    { name: "Check JSON Body", code: `const json = pm.response.json();\npm.expect(json.data).to.exist;` },
    { name: "Set Variable from Response", code: `const json = pm.response.json();\npm.variables.set("userId", json.data.id);` },
    { name: "Check Content-Type", code: `pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');` },
    { name: "Multiple Tests", code: `pm.test("Status code is 200", () => {\n  pm.expect(pm.response.statusCode).to.equal(200);\n});\n\npm.test("Response has data", () => {\n  pm.expect(pm.response.json().data).to.exist;\n});` },
  ];

  let showSnippets = $state(false);

  function insertSnippet(code: string) {
    if (activeScriptTab === "prerequest") {
      setPreScript($currentRequest.preScript + "\n" + code);
    } else {
      setTestScript($currentRequest.testScript + "\n" + code);
    }
    showSnippets = false;
  }

  function runPreview() {
    const script = activeScriptTab === "prerequest" ? $currentRequest.preScript : $currentRequest.testScript;
    consoleOutput = [`> Running ${activeScriptTab === "prerequest" ? "pre-request" : "test"} script...`];
    try {
      const fn = new Function("pm", "console", script);
      const mockConsole = {
        log: (...args: any[]) => {
          consoleOutput = [...consoleOutput, `[log] ${args.join(" ")}`];
        },
        error: (...args: any[]) => {
          consoleOutput = [...consoleOutput, `[error] ${args.join(" ")}`];
        },
      };
      fn({}, mockConsole);
      consoleOutput = [...consoleOutput, "> Script executed successfully"];
    } catch (e: any) {
      consoleOutput = [...consoleOutput, `[error] ${e.message}`];
    }
  }
</script>

<div>
  <!-- Script Tab Bar -->
  <div class="flex gap-0 mb-3 border-b border-zinc-200 dark:border-zinc-700">
    <button
      onclick={() => (activeScriptTab = "prerequest")}
      class="px-3 py-1.5 text-xs font-medium border-b-2 -mb-px"
      class:text-blue-600={activeScriptTab === "prerequest"}
      class:border-blue-500={activeScriptTab === "prerequest"}
      class:text-zinc-500={activeScriptTab !== "prerequest"}
      class:border-transparent={activeScriptTab !== "prerequest"}
    >
      Pre-request
    </button>
    <button
      onclick={() => (activeScriptTab = "tests")}
      class="px-3 py-1.5 text-xs font-medium border-b-2 -mb-px"
      class:text-blue-600={activeScriptTab === "tests"}
      class:border-blue-500={activeScriptTab === "tests"}
      class:text-zinc-500={activeScriptTab !== "tests"}
      class:border-transparent={activeScriptTab !== "tests"}
    >
      Tests
    </button>
  </div>

  <div class="flex gap-3">
    <!-- Editor -->
    <div class="flex-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-zinc-500">
          {activeScriptTab === "prerequest" ? "Pre-request Script (runs before request)" : "Test Script (runs after response)"}
        </span>
        <div class="flex gap-2">
          <div class="relative">
            <button onclick={() => (showSnippets = !showSnippets)} class="text-xs text-blue-500 hover:text-blue-600">Snippets</button>
            {#if showSnippets}
              <div class="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {#each SNIPPETS as snippet}
                  <button onclick={() => insertSnippet(snippet.code)} class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                    <div class="font-medium">{snippet.name}</div>
                    <code class="text-[10px] text-zinc-400 block mt-0.5 truncate">{snippet.code}</code>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          <button onclick={runPreview} class="text-xs text-green-500 hover:text-green-600">Run</button>
        </div>
      </div>

      {#if activeScriptTab === "prerequest"}
        <textarea
          value={$currentRequest.preScript}
          oninput={(e) => setPreScript(e.currentTarget.value)}
          placeholder='// Set variables before request
pm.variables.set("timestamp", Date.now());
pm.environment.set("token", "abc123");'
          rows="10"
          class="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        ></textarea>
      {:else}
        <textarea
          value={$currentRequest.testScript}
          oninput={(e) => setTestScript(e.currentTarget.value)}
          placeholder='// Test response
pm.expect(pm.response.statusCode).to.equal(200);
pm.expect(pm.response.json().data).to.exist;'
          rows="10"
          class="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        ></textarea>
      {/if}

      <p class="text-[10px] text-zinc-400 mt-1">
        JavaScript runtime. API: <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">pm.variables</code>,
        <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">pm.request</code>,
        <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">pm.response</code>,
        <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">pm.expect</code>
      </p>
    </div>

    <!-- Console -->
    {#if consoleOutput.length > 0}
      <div class="w-64 shrink-0">
        <div class="text-xs text-zinc-500 mb-1">Console</div>
        <div class="bg-zinc-900 text-green-400 rounded-md p-2 font-mono text-[10px] h-48 overflow-y-auto">
          {#each consoleOutput as line}
            <div class="leading-relaxed">{line}</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
