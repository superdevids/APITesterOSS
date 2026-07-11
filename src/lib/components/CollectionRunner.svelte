<script lang="ts">
  import { collections, collectionRequests } from "../stores/collection";
  import { environments, activeEnvironmentId } from "../stores/environment";
  import { prepareRequest } from "../utils/variable-substitution";
  import type { RequestDefinition, RunnerResult, TestResult, ApiResponse } from "../types";

  let { collectionId = "", onclose = () => {} } = $props();

  let selectedIds = $state<Set<string>>(new Set());
  let selectedEnvId = $state<string | null>(null);
  let delayMs = $state(200);
  let isRunning = $state(false);
  let cancelRequested = $state(false);
  let currentIndex = $state(0);
  let results = $state<RunnerResult[]>([]);

  let collection = $derived($collections.find((c) => c.id === collectionId));
  let requests = $derived($collectionRequests.filter((r) => r.collectionId === collectionId));
  let allSelected = $derived(requests.length > 0 && selectedIds.size === requests.length);
  let totalCount = $derived(requests.length);
  let progress = $derived(totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0);
  let totalTime = $derived(results.reduce((sum, r) => sum + (r.responseTimeMs ?? 0), 0));
  let passedCount = $derived(results.filter((r) => r.passed).length);
  let failedCount = $derived(results.filter((r) => !r.passed).length);
  let isComplete = $derived(!isRunning && results.length > 0);

  $effect(() => {
    selectedEnvId = $activeEnvironmentId;
    selectedIds = new Set(requests.map((r) => r.id));
    results = [];
    currentIndex = 0;
    cancelRequested = false;
    isRunning = false;
  });

  function toggleAll() {
    selectedIds = allSelected ? new Set() : new Set(requests.map((r) => r.id));
  }

  function toggleRequest(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    selectedIds = next;
  }

  function cancelRun() {
    cancelRequested = true;
  }

  async function startRun() {
    const toRun = requests.filter((r) => selectedIds.has(r.id));
    if (toRun.length === 0) return;

    isRunning = true;
    cancelRequested = false;
    results = [];
    currentIndex = 0;

    for (let i = 0; i < toRun.length; i++) {
      if (cancelRequested) break;
      currentIndex = i + 1;
      const req = toRun[i];

      try {
        results = [...results, await executeRequest(req, selectedEnvId)];
      } catch (e) {
        results = [...results, {
          requestId: req.id,
          requestName: req.name,
          passed: false,
          tests: [],
          error: e instanceof Error ? e.message : "Unknown error",
        }];
      }

      if (i < toRun.length - 1 && delayMs > 0 && !cancelRequested) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    isRunning = false;
  }

  async function executeRequest(request: RequestDefinition, envId: string | null): Promise<RunnerResult> {
    const prepared = prepareRequest(request, envId);
    let apiResponse: ApiResponse;

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      apiResponse = await invoke<ApiResponse>("send_request", {
        method: request.method,
        url: prepared.url,
        headers: prepared.headers,
        body: prepared.body,
      });
    } catch {
      apiResponse = await sendViaFetch(request.method, prepared.url, prepared.headers, prepared.body);
    }

    const tests = runTests(request.testScript, apiResponse);

    return {
      requestId: request.id,
      requestName: request.name,
      statusCode: apiResponse.statusCode,
      responseTimeMs: apiResponse.responseTimeMs,
      tests,
      passed: tests.length === 0 || tests.every((t) => t.passed),
    };
  }

  async function sendViaFetch(method: string, url: string, headers: Record<string, string>, body: string): Promise<ApiResponse> {
    const startTime = performance.now();
    const response = await fetch(url, { method, headers, body: body || undefined });
    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => { responseHeaders[key] = value; });

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      cookies: [],
      responseTimeMs: Math.round(performance.now() - startTime),
      responseSizeBytes: new TextEncoder().encode(responseBody).length,
      timestamp: new Date().toISOString(),
    };
  }

  function runTests(script: string, apiResponse: ApiResponse): TestResult[] {
    const results: TestResult[] = [];
    if (!script.trim()) return results;

    const pm: Record<string, any> = {
      response: {
        statusCode: apiResponse.statusCode,
        statusText: apiResponse.statusText,
        headers: apiResponse.headers,
        json: () => { try { return JSON.parse(apiResponse.body); } catch { return null; } },
        text: () => apiResponse.body,
        responseTime: apiResponse.responseTimeMs,
        responseSize: apiResponse.responseSizeBytes,
      },
      test: (name: string, fn: () => void) => {
        try { fn(); results.push({ name, passed: true }); }
        catch (e) { results.push({ name, passed: false, error: e instanceof Error ? e.message : "Assertion failed" }); }
      },
      expect: (actual: any) => ({
        to: {
          equal: (expected: any) => { if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
          include: (str: string) => { if (!String(actual).includes(str)) throw new Error(`Expected "${actual}" to include "${str}"`); },
          exist: () => { if (actual == null) throw new Error("Expected value to exist"); },
          be: { an: (type: string) => { if (typeof actual !== type && !(Array.isArray(actual) && type === "array")) throw new Error(`Expected ${typeof actual} to be ${type}`); } },
        },
        not: { equal: (expected: any) => { if (actual === expected) throw new Error(`Expected not ${JSON.stringify(expected)}`); } },
        tobe: {
          below: (limit: number) => { if (actual >= limit) throw new Error(`Expected ${actual} to be below ${limit}`); },
          above: (limit: number) => { if (actual <= limit) throw new Error(`Expected ${actual} to be above ${limit}`); },
        },
      }),
    };

    try { new Function("pm", script)(pm); }
    catch (e) { results.push({ name: "Script Error", passed: false, error: e instanceof Error ? e.message : "Unknown error" }); }

    return results;
  }

  function statusColor(code: number | undefined): string {
    if (!code) return "text-zinc-400";
    if (code < 300) return "text-green-500";
    if (code < 400) return "text-blue-500";
    if (code < 500) return "text-amber-500";
    return "text-red-500";
  }

  function exportJSON() {
    const data = {
      collectionId,
      collectionName: collection?.name || "",
      timestamp: new Date().toISOString(),
      totalTime,
      passed: passedCount,
      failed: failedCount,
      results,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, `collection-run-${collectionId || "export"}.json`);
  }

  function exportHTML() {
    const rows = results.map((r) =>
      `<tr><td>${escHtml(r.requestName)}</td><td class="${statusColor(r.statusCode).replace("text-", "")}">${r.statusCode ?? "-"}</td><td>${r.responseTimeMs ?? "-"}ms</td><td>${r.tests.length ? r.tests.map((t) => `<span class="${t.passed ? "pass" : "fail"}">${t.passed ? "✓" : "✗"} ${escHtml(t.name)}${t.error ? ": " + escHtml(t.error) : ""}</span>`).join("<br>") : "-"}</td><td class="${r.passed ? "pass" : "fail"}">${r.passed ? "PASS" : "FAIL"}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Collection Run Report</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;background:#f8fafc;color:#1e293b}
h1{color:#0f172a;margin:0}
p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:1rem}
th,td{padding:0.75rem;text-align:left;border-bottom:1px solid #e2e8f0}
th{background:#f1f5f9;font-weight:600}.pass{color:#22c55e}.fail{color:#ef4444}
.green{color:#22c55e}.blue{color:#3b82f6}.amber{color:#f59e0b}.red{color:#ef4444}
.summary{display:flex;gap:2rem;margin:1.5rem 0}
.summary-item{background:white;padding:1rem 2rem;border-radius:0.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.summary-item .value{font-size:2rem;font-weight:700}</style></head><body>
<h1>Collection Run Report: ${escHtml(collection?.name || "Untitled")}</h1>
<p>${new Date().toLocaleString()}</p>
<div class="summary"><div class="summary-item"><div class="value pass">${passedCount}</div><div>Passed</div></div>
<div class="summary-item"><div class="value fail">${failedCount}</div><div>Failed</div></div>
<div class="summary-item"><div class="value">${totalTime}ms</div><div>Total Time</div></div></div>
<table><thead><tr><th>Request</th><th>Status</th><th>Time</th><th>Tests</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    downloadBlob(blob, `collection-run-${collectionId || "export"}.html`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
</script>

<svelte:window onkeydown={(e: KeyboardEvent) => { if (e.key === "Escape") onclose(); }} />

<!-- Modal overlay -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4"
  onclick={(e: MouseEvent) => { if (e.target === e.currentTarget) onclose(); }}
  role="dialog"
  aria-modal="true"
  aria-label="Collection Runner"
>
  <div
    class="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
    onclick={(e: MouseEvent) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
        Run{collection ? `: ${collection.name}` : " Collection"}
      </h2>
      <button
        onclick={onclose}
        class="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Close"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      {#if requests.length === 0}
        <div class="text-center py-10 text-zinc-500 dark:text-zinc-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <path d="M8 2v4M16 2v4" />
          </svg>
          <p class="text-sm font-medium">This collection has no requests</p>
          <p class="text-xs mt-1">Add requests to the collection before running.</p>
        </div>
      {:else}
        <!-- Environment + Delay -->
        <div class="flex gap-4 flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Environment</label>
            <select
              bind:value={selectedEnvId}
              disabled={isRunning}
              class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={null}>No Environment</option>
              {#each $environments as env (env.id)}
                <option value={env.id}>{env.name}</option>
              {/each}
            </select>
          </div>
          <div class="w-[140px]">
            <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Delay (ms)</label>
            <input
              type="number"
              bind:value={delayMs}
              min="0"
              max="10000"
              step="100"
              disabled={isRunning}
              class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Request List -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={allSelected}
              onchange={toggleAll}
              disabled={isRunning}
              class="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              All ({totalCount} {totalCount === 1 ? "request" : "requests"})
            </span>
          </div>
          <div class="max-h-60 overflow-y-auto space-y-0.5 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1">
            {#each requests as req (req.id)}
              <label
                class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors {isRunning ? 'pointer-events-none opacity-60' : ''}"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(req.id)}
                  onchange={() => toggleRequest(req.id)}
                  disabled={isRunning}
                  class="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <span class="method-badge method-{req.method.toLowerCase()}">{req.method}</span>
                <span class="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">{req.name}</span>
                <span class="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[200px] font-mono">{req.url}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Progress Bar -->
        {#if isRunning}
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running request {currentIndex} of {totalCount}...
              </span>
              <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
            </div>
            <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style="width: {progress}%"
              />
            </div>
          </div>
        {/if}

        <!-- Results -->
        {#if results.length > 0}
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Results</h3>
            <div class="space-y-1 max-h-64 overflow-y-auto">
              {#each results as result (result.requestId)}
                <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  {#if result.passed}
                    <svg class="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else}
                    <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  {/if}
                  <span class="text-sm text-zinc-700 dark:text-zinc-300 flex-1 truncate">{result.requestName}</span>
                  {#if result.statusCode !== undefined}
                    <span class="text-sm font-mono font-semibold {statusColor(result.statusCode)}">{result.statusCode}</span>
                  {:else}
                    <span class="text-sm text-zinc-400 font-mono">---</span>
                  {/if}
                  <span class="text-xs text-zinc-400 dark:text-zinc-500 w-16 text-right tabular-nums">
                    {result.responseTimeMs ?? "---"}ms
                  </span>
                  {#if result.error}
                    <span class="text-xs text-red-500 truncate max-w-[150px]" title={result.error}>{result.error}</span>
                  {/if}
                  {#if result.tests.length > 0}
                    <span class="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                      ({result.tests.filter((t) => t.passed).length}/{result.tests.length})
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Summary -->
        {#if isComplete}
          <div class="flex items-center gap-5 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <div class="flex items-center gap-1.5">
              <span class="text-2xl font-bold text-green-500">{passedCount}</span>
              <span class="text-sm text-zinc-500 dark:text-zinc-400">passed</span>
            </div>
            <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div class="flex items-center gap-1.5">
              <span class="text-2xl font-bold text-red-500">{failedCount}</span>
              <span class="text-sm text-zinc-500 dark:text-zinc-400">failed</span>
            </div>
            <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div class="flex items-center gap-1.5">
              <span class="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{totalTime}ms</span>
              <span class="text-sm text-zinc-500 dark:text-zinc-400">total time</span>
            </div>
          </div>
        {/if}

        <!-- Cancelled notice -->
        {#if cancelRequested && !isRunning && results.length > 0}
          <div class="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run cancelled. {results.length} of {totalCount} requests completed.
          </div>
        {/if}
      {/if}
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between gap-3 px-5 py-4 border-t border-zinc-200 dark:border-zinc-700">
      <div class="flex gap-2">
        {#if isComplete}
          <button
            onclick={exportJSON}
            class="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Export JSON
          </button>
          <button
            onclick={exportHTML}
            class="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Export HTML
          </button>
        {/if}
      </div>
      <div class="flex gap-2 ml-auto">
        {#if isRunning}
          <button
            onclick={cancelRun}
            class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Cancel
          </button>
        {:else if requests.length > 0}
          <button
            onclick={startRun}
            disabled={selectedIds.size === 0}
            class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Run
          </button>
        {/if}
        <button
          onclick={onclose}
          class="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>
