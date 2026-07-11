import { writable, derived } from "svelte/store";
import type { Environment, Variable } from "../types";

export const environments = writable<Environment[]>([]);
export const variables = writable<Variable[]>([]);
export const activeEnvironmentId = writable<string | null>(null);

export const activeEnvironment = derived(
  [environments, activeEnvironmentId],
  ([$envs, $id]) => $envs.find((e) => e.id === $id) || null
);

export const activeVariables = derived(
  [variables, activeEnvironmentId],
  ([$vars, $id]) => $vars.filter((v) => v.environmentId === $id)
);

/** Substitute {{key}} in a string with active environment variables */
export function substituteVariables(
  text: string,
  envId: string | null
): string {
  let result = text;
  let vars: Variable[] = [];
  variables.subscribe((v) => {
    vars = v.filter((v) => v.environmentId === envId);
  })();

  for (const v of vars) {
    result = result.replace(
      new RegExp(`\\{\\{${escapeRegex(v.key)}\\}\\}`, "g"),
      v.value
    );
  }

  // Dynamic variables
  result = result.replace(/\{\{\$guid\}\}/g, crypto.randomUUID());
  result = result.replace(
    /\{\{\$timestamp\}\}/g,
    Date.now().toString()
  );
  result = result.replace(
    /\{\{\$randomInt\}\}/g,
    Math.floor(Math.random() * 10000).toString()
  );
  result = result.replace(
    /\{\{\$randomEmail\}\}/g,
    `user${Math.floor(Math.random() * 10000)}@test.com`
  );
  result = result.replace(
    /\{\{\$randomString\}\}/g,
    Math.random().toString(36).substring(2, 10)
  );

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function loadEnvironments() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const data = await invoke<{
      environments: Environment[];
      variables: Variable[];
    }>("get_environments");
    environments.set(data.environments);
    variables.set(data.variables);
  } catch (e) {
    console.error("Failed to load environments:", e);
  }
}

export async function saveEnvironment(name: string) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const env = await invoke<Environment>("create_environment", { name });
    environments.update((list) => [...list, env]);
    return env;
  } catch (e) {
    console.error("Failed to save environment:", e);
    return null;
  }
}
