<script lang="ts">
  import { currentRequest, setBodyMode, setBodyJson } from "../stores/request";
  import type { BodyMode, FormDataItem, UrlEncodedItem, GraphQLBody } from "../types";

  const BODY_TYPES: { mode: BodyMode; label: string }[] = [
    { mode: "none", label: "none" },
    { mode: "json", label: "JSON" },
    { mode: "form-data", label: "Form-Data" },
    { mode: "urlencoded", label: "URL-Encoded" },
    { mode: "graphql", label: "GraphQL" },
    { mode: "text", label: "Plain Text" },
  ];

  let formDataItems = $state<FormDataItem[]>($currentRequest.body.formData || []);
  let urlEncodedItems = $state<UrlEncodedItem[]>($currentRequest.body.urlencoded || []);
  let graphqlQuery = $state($currentRequest.body.graphql?.query || "");
  let graphqlVars = $state(JSON.stringify($currentRequest.body.graphql?.variables || {}, null, 2));
  let textContent = $state($currentRequest.body.text || "");

  let jsonError = $state<string | null>(null);

  function handleJsonChange(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    setBodyJson(val);
    try {
      JSON.parse(val);
      jsonError = null;
    } catch {
      jsonError = val.trim() ? "Invalid JSON" : null;
    }
  }

  function prettifyJson() {
    try {
      const parsed = JSON.parse($currentRequest.body.json || "{}");
      setBodyJson(JSON.stringify(parsed, null, 2));
      jsonError = null;
    } catch {
      jsonError = "Cannot prettify: invalid JSON";
    }
  }

  function addFormDataRow() {
    formDataItems = [...formDataItems, { key: "", value: "", type: "text" }];
    currentRequest.update((r) => ({ ...r, body: { ...r.body, formData: formDataItems } }));
  }

  function removeFormDataRow(index: number) {
    formDataItems = formDataItems.filter((_, i) => i !== index);
    currentRequest.update((r) => ({ ...r, body: { ...r.body, formData: formDataItems } }));
  }

  function addUrlEncodedRow() {
    urlEncodedItems = [...urlEncodedItems, { key: "", value: "" }];
    currentRequest.update((r) => ({ ...r, body: { ...r.body, urlencoded: urlEncodedItems } }));
  }

  function removeUrlEncodedRow(index: number) {
    urlEncodedItems = urlEncodedItems.filter((_, i) => i !== index);
    currentRequest.update((r) => ({ ...r, body: { ...r.body, urlencoded: urlEncodedItems } }));
  }

  $effect(() => {
    if ($currentRequest.body.mode === "graphql") {
      currentRequest.update((r) => ({
        ...r,
        body: {
          ...r.body,
          graphql: {
            query: graphqlQuery,
            variables: (() => { try { return JSON.parse(graphqlVars); } catch { return {}; } })(),
          },
        },
      }));
    }
    if ($currentRequest.body.mode === "text") {
      currentRequest.update((r) => ({ ...r, body: { ...r.body, text: textContent } }));
    }
  });
</script>

<div>
  <!-- Body Type Selector -->
  <div class="flex flex-wrap gap-1 mb-3">
    {#each BODY_TYPES as bt}
      <button
        onclick={() => setBodyMode(bt.mode)}
        class="px-2.5 py-1 text-xs rounded-md border transition-colors"
        class:bg-blue-50={$currentRequest.body.mode === bt.mode}
        class:border-blue-300={$currentRequest.body.mode === bt.mode}
        class:text-blue-700={$currentRequest.body.mode === bt.mode}
        class:border-zinc-300={$currentRequest.body.mode !== bt.mode}
        class:dark:border-zinc-600={$currentRequest.body.mode !== bt.mode}
        class:dark:text-zinc-300={$currentRequest.body.mode !== bt.mode}
      >
        {bt.label}
      </button>
    {/each}
  </div>

  <!-- JSON Editor -->
  {#if $currentRequest.body.mode === "json"}
    <div>
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-zinc-500">JSON Body</span>
        <button onclick={prettifyJson} class="text-xs text-blue-500 hover:text-blue-600">Prettify</button>
      </div>
      <textarea
        value={$currentRequest.body.json || ""}
        oninput={handleJsonChange}
        placeholder={'{"key": "value"}'}
        rows="10"
        class="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      ></textarea>
      {#if jsonError}
        <p class="text-xs text-red-500 mt-1">{jsonError}</p>
      {/if}
    </div>

  <!-- Form-Data Editor -->
  {:else if $currentRequest.body.mode === "form-data"}
    <div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-zinc-500">Form Data</span>
        <button onclick={addFormDataRow} class="text-xs text-blue-500 hover:text-blue-600">Add</button>
      </div>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
            <th class="p-1 text-left font-medium">Key</th>
            <th class="p-1 text-left font-medium">Value</th>
            <th class="w-16 p-1 text-left font-medium">Type</th>
            <th class="w-8 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {#each formDataItems as item, i}
            <tr class="border-b border-zinc-100 dark:border-zinc-800">
              <td class="p-1">
                <input type="text" bind:value={item.key} placeholder="key" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 font-mono" />
              </td>
              <td class="p-1">
                <input type="text" bind:value={item.value} placeholder="value" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 font-mono" />
              </td>
              <td class="p-1">
                <select bind:value={item.type} class="w-full px-1 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 text-xs">
                  <option value="text">Text</option>
                  <option value="file">File</option>
                </select>
              </td>
              <td class="p-1">
                <button onclick={() => removeFormDataRow(i)} class="text-zinc-400 hover:text-red-500">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  <!-- URL-Encoded Editor -->
  {:else if $currentRequest.body.mode === "urlencoded"}
    <div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-zinc-500">URL-Encoded</span>
        <button onclick={addUrlEncodedRow} class="text-xs text-blue-500 hover:text-blue-600">Add</button>
      </div>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
            <th class="p-1 text-left font-medium">Key</th>
            <th class="p-1 text-left font-medium">Value</th>
            <th class="w-8 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {#each urlEncodedItems as item, i}
            <tr class="border-b border-zinc-100 dark:border-zinc-800">
              <td class="p-1">
                <input type="text" bind:value={item.key} placeholder="key" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 font-mono" />
              </td>
              <td class="p-1">
                <input type="text" bind:value={item.value} placeholder="value" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 font-mono" />
              </td>
              <td class="p-1">
                <button onclick={() => removeUrlEncodedRow(i)} class="text-zinc-400 hover:text-red-500">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  <!-- GraphQL Editor -->
  {:else if $currentRequest.body.mode === "graphql"}
    <div>
      <div class="mb-3">
        <label class="block text-xs text-zinc-500 mb-1">Query</label>
        <textarea
          bind:value={graphqlQuery}
          placeholder={'query { users { id name } }'}
          rows="8"
          class="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        ></textarea>
      </div>
      <div>
        <label class="block text-xs text-zinc-500 mb-1">Variables (JSON)</label>
        <textarea
          bind:value={graphqlVars}
          placeholder={'{"limit": 10}'}
          rows="4"
          class="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        ></textarea>
      </div>
    </div>

  <!-- Plain Text Editor -->
  {:else if $currentRequest.body.mode === "text"}
    <div>
      <textarea
        bind:value={textContent}
        placeholder="Enter plain text body"
        rows="10"
        class="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      ></textarea>
    </div>
  {:else}
    <p class="text-xs text-zinc-400">This request does not have a body.</p>
  {/if}
</div>
