<script lang="ts">
  import { environments, variables, activeEnvironmentId, saveEnvironment } from "../stores/environment";
  import type { Environment, Variable } from "../types";

  let { onclose = () => {} } = $props();

  let selectedEnvId = $state<string | null>(null);
  let showNewEnv = $state(false);
  let newEnvName = $state("");
  let editingVars = $state<Variable[]>([]);

  let selectedEnv = $derived($environments.find((e) => e.id === selectedEnvId) || null);

  $effect(() => {
    if (selectedEnvId) {
      editingVars = $variables.filter((v) => v.environmentId === selectedEnvId);
    } else {
      editingVars = [];
    }
  });

  async function handleCreateEnv() {
    if (!newEnvName.trim()) return;
    const env = await saveEnvironment(newEnvName.trim());
    if (env) {
      selectedEnvId = env.id;
      newEnvName = "";
      showNewEnv = false;
    }
  }

  function addVariable() {
    if (!selectedEnvId) return;
    const newVar: Variable = {
      id: crypto.randomUUID(),
      environmentId: selectedEnvId,
      key: "",
      value: "",
      isSecret: false,
      description: "",
      sortOrder: editingVars.length,
    };
    editingVars = [...editingVars, newVar];
  }

  function removeVariable(index: number) {
    editingVars = editingVars.filter((_, i) => i !== index);
  }

  function toggleSecret(index: number) {
    editingVars = editingVars.map((v, i) =>
      i === index ? { ...v, isSecret: !v.isSecret } : v
    );
  }

  function toggleEnvActive(envId: string) {
    activeEnvironmentId.set(envId);
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onclick={onclose}>
  <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col" onclick={(e) => e.stopPropagation()}>
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold">Environment Manager</h3>
      <button onclick={onclose} class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left: Environment List -->
      <div class="w-48 border-r border-zinc-200 dark:border-zinc-800 p-3 overflow-y-auto">
        <div class="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Environments</div>

        {#each $environments as env}
          <button
            onclick={() => (selectedEnvId = env.id)}
            class="w-full text-left px-3 py-2 text-xs rounded-md mb-1 flex items-center gap-2 {selectedEnvId === env.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}"
          >
            <span
              class="w-2 h-2 rounded-full shrink-0"
              class:bg-blue-500={$activeEnvironmentId === env.id}
              class:bg-zinc-300={$activeEnvironmentId !== env.id}
            />
            <span class="truncate">{env.name}</span>
          </button>
        {/each}

        {#if showNewEnv}
          <div class="mt-2">
            <input
              type="text"
              bind:value={newEnvName}
              placeholder="Environment name"
              class="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onkeydown={(e) => e.key === "Enter" && handleCreateEnv()}
            />
            <div class="flex gap-1">
              <button onclick={handleCreateEnv} class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
              <button onclick={() => (showNewEnv = false)} class="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">Cancel</button>
            </div>
          </div>
        {:else}
          <button
            onclick={() => (showNewEnv = true)}
            class="w-full mt-2 px-3 py-2 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center gap-1.5 border border-dashed border-blue-300 dark:border-blue-700"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Environment
          </button>
        {/if}

        {#if $environments.length > 0}
          <div class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onclick={() => { activeEnvironmentId.set(null); selectedEnvId = null; }}
              class="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            >
              No Environment
            </button>
          </div>
        {/if}
      </div>

      <!-- Right: Variable Editor -->
      <div class="flex-1 p-3 overflow-y-auto">
        {#if selectedEnv}
          <div class="flex items-center justify-between mb-3">
            <div>
              <span class="text-sm font-medium">{selectedEnv.name}</span>
              <button
                onclick={() => toggleEnvActive(selectedEnv.id)}
                class="ml-2 px-2 py-0.5 text-[10px] rounded"
                class:bg-green-100={$activeEnvironmentId === selectedEnv.id}
                class:text-green-700={$activeEnvironmentId === selectedEnv.id}
                class:bg-zinc-100={$activeEnvironmentId !== selectedEnv.id}
                class:dark:bg-zinc-800={$activeEnvironmentId !== selectedEnv.id}
              >
                {$activeEnvironmentId === selectedEnv.id ? "Active" : "Set Active"}
              </button>
            </div>
            <button onclick={addVariable} class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Variable
            </button>
          </div>

          <table class="w-full text-xs">
            <thead>
              <tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                <th class="p-2 text-left font-medium">Key</th>
                <th class="p-2 text-left font-medium">Value</th>
                <th class="p-2 text-left font-medium">Type</th>
                <th class="p-2 text-left font-medium">Description</th>
                <th class="w-8 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {#each editingVars as variable, i}
                <tr class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="p-1">
                    <input type="text" bind:value={variable.key} placeholder="variable_name" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 font-mono" />
                  </td>
                  <td class="p-1">
                    <div class="relative">
                      <input type={variable.isSecret ? "password" : "text"} bind:value={variable.value} placeholder="value" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500 font-mono pr-6" />
                      <button onclick={() => toggleSecret(i)} class="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                        {#if variable.isSecret}
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        {:else}
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        {/if}
                      </button>
                    </div>
                  </td>
                  <td class="p-1">
                    <span class="text-[10px] px-1.5 py-0.5 rounded" class:bg-yellow-100={variable.isSecret} class:text-yellow-700={variable.isSecret} class:bg-zinc-100={!variable.isSecret} class:dark:bg-zinc-800={!variable.isSecret}>
                      {variable.isSecret ? "Secret" : "Default"}
                    </span>
                  </td>
                  <td class="p-1">
                    <input type="text" bind:value={variable.description} placeholder="description" class="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-zinc-300 rounded focus:outline-none focus:border-blue-500" />
                  </td>
                  <td class="p-1">
                    <button onclick={() => removeVariable(i)} class="text-zinc-400 hover:text-red-500">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          {#if editingVars.length === 0}
            <div class="text-center py-8 text-zinc-400 text-xs">
              <p>No variables yet. Click "Add Variable" to create one.</p>
            </div>
          {/if}

          <div class="text-[10px] text-zinc-400 mt-3 space-y-1">
            <p>Use <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{`{{variable_name}}`}</code> in URL, headers, and body</p>
            <p>Secret variables are masked and excluded from collection export</p>
          </div>
        {:else}
          <div class="flex items-center justify-center h-full text-zinc-400 text-xs">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M7 2v4M17 2v4M2 10h20" />
              </svg>
              <p>Select an environment to edit variables</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
