<script lang="ts">
  import { parsePostmanCollection, parseInsomniaCollection, parseBrunoCollection } from "../utils/postman-importer";
  import { collections, collectionRequests, folders, saveCollection, saveRequest } from "../stores/collection";
  import type { ImportResult, Collection, Folder, RequestDefinition } from "../types";

  let { onclose = () => {} } = $props();

  let importFormat = $state("postman");
  let importStatus = $state<"idle" | "loading" | "success" | "error">("idle");
  let importResult = $state<ImportResult | null>(null);
  let errorMessage = $state("");
  let dragOver = $state(false);

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await parseFile(file);
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    await parseFile(file);
  }

  async function parseFile(file: File) {
    importStatus = "loading";
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      let result: ImportResult;

      switch (importFormat) {
        case "postman":
          result = parsePostmanCollection(json);
          break;
        case "insomnia":
          result = parseInsomniaCollection(json);
          break;
        case "bruno":
          result = parseBrunoCollection(json);
          break;
        default:
          result = { success: false, collectionName: "", requestCount: 0, errors: ["Unknown format"] };
      }

      if (result.success && result.collectionName) {
        // Save to backend
        const col = await saveCollection(result.collectionName, `Imported from ${importFormat}`);
        if (col) {
          importResult = result;
          importStatus = "success";
        }
      } else {
        errorMessage = result.errors.join("\n") || "Failed to parse collection";
        importStatus = "error";
      }
    } catch (e: any) {
      errorMessage = e.message || "Invalid file";
      importStatus = "error";
    }
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onclick={onclose}>
  <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col" onclick={(e) => e.stopPropagation()}>
    <div class="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold">Import Collection</h3>
      <button onclick={onclose} class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded" aria-label="Close">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="p-5">
      <!-- Format Selector -->
      <div class="flex gap-2 mb-4">
        {#each [{ id: "postman", label: "Postman v2.1" }, { id: "insomnia", label: "Insomnia v4" }, { id: "bruno", label: "Bruno" }] as fmt}
          <button
            onclick={() => (importFormat = fmt.id)}
            class="px-3 py-1.5 text-xs rounded-md border transition-colors"
            class:bg-blue-50={importFormat === fmt.id}
            class:border-blue-300={importFormat === fmt.id}
            class:text-blue-700={importFormat === fmt.id}
            class:border-zinc-300={importFormat !== fmt.id}
            class:dark:border-zinc-600={importFormat !== fmt.id}
          >
            {fmt.label}
          </button>
        {/each}
      </div>

      <!-- Drop Zone -->
      <div
        class={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-zinc-300 dark:border-zinc-600'}`}
        ondragover={(e) => { e.preventDefault(); dragOver = true; }}
        ondragleave={() => (dragOver = false)}
        ondrop={handleDrop}
        onclick={() => document.getElementById("import-file-input")?.click()}
      >
        <svg class="w-12 h-12 mx-auto mb-3 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        <p class="text-sm text-zinc-500 mb-1">Drag & drop collection file here</p>
        <p class="text-xs text-zinc-400">or click to browse</p>
        <input id="import-file-input" type="file" accept=".json" class="hidden" onchange={handleFileSelect} />
      </div>

      <!-- Status -->
      {#if importStatus === "loading"}
        <div class="flex items-center gap-2 mt-4 text-sm text-zinc-500">
          <svg class="w-4 h-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Parsing collection...
        </div>
      {:else if importStatus === "success" && importResult}
        <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
          <div class="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="font-medium">Import successful!</span>
          </div>
          <p class="text-xs text-green-600 dark:text-green-500 mt-1">
            "{importResult.collectionName}" — {importResult.requestCount} requests imported
          </p>
          {#if importResult.errors.length > 0}
            <div class="mt-2 text-xs text-yellow-600">
              {#each importResult.errors as err}
                <p>⚠ {err}</p>
              {/each}
            </div>
          {/if}
        </div>
      {:else if importStatus === "error"}
        <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <div class="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span class="font-medium">Import failed</span>
          </div>
          <p class="text-xs text-red-600 dark:text-red-500 mt-1">{errorMessage}</p>
        </div>
      {/if}
    </div>

    <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <button onclick={onclose} class="px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">Close</button>
    </div>
  </div>
</div>
