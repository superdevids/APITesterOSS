<script lang="ts">
  import { currentRequest, setAuth } from "../stores/request";
  import type { AuthType, AuthConfig } from "../types";

  let authType = $state<AuthType>($currentRequest.auth.type);

  let bearerToken = $state($currentRequest.auth.bearer?.token || "");
  let basicUser = $state($currentRequest.auth.basic?.username || "");
  let basicPass = $state($currentRequest.auth.basic?.password || "");
  let apiKey = $state($currentRequest.auth.apiKey?.key || "");
  let apiValue = $state($currentRequest.auth.apiKey?.value || "");
  let apiIn = $state<"header" | "query">($currentRequest.auth.apiKey?.in || "header");
  let oauthClientId = $state($currentRequest.auth.oauth2?.clientId || "");
  let oauthSecret = $state($currentRequest.auth.oauth2?.clientSecret || "");
  let oauthTokenUrl = $state($currentRequest.auth.oauth2?.tokenUrl || "");
  let oauthScope = $state($currentRequest.auth.oauth2?.scope || "");
  let oauthToken = $state($currentRequest.auth.oauth2?.accessToken || "");
  let oauthLoading = $state(false);
  let oauthError = $state<string | null>(null);

  async function getOAuth2Token() {
    if (!oauthTokenUrl || !oauthClientId || !oauthSecret) {
      oauthError = "Client ID, Client Secret, and Token URL are required";
      return;
    }
    oauthLoading = true;
    oauthError = null;
    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: oauthClientId,
        client_secret: oauthSecret,
      });
      if (oauthScope) body.set("scope", oauthScope);
      const res = await fetch(oauthTokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Token request failed (${res.status}): ${errText}`);
      }
      const data = await res.json();
      oauthToken = data.access_token || "";
      if (!oauthToken) throw new Error("No access_token in response");
    } catch (e) {
      oauthError = e instanceof Error ? e.message : "Failed to fetch token";
    } finally {
      oauthLoading = false;
    }
  }

  $effect(() => {
    let config: AuthConfig = { type: authType };
    switch (authType) {
      case "bearer":
        config.bearer = { token: bearerToken };
        break;
      case "basic":
        config.basic = { username: basicUser, password: basicPass };
        break;
      case "api-key":
        config.apiKey = { key: apiKey, value: apiValue, in: apiIn };
        break;
      case "oauth2":
        config.oauth2 = {
          clientId: oauthClientId,
          clientSecret: oauthSecret,
          tokenUrl: oauthTokenUrl,
          scope: oauthScope,
          accessToken: oauthToken,
        };
        break;
    }
    setAuth(config);
  });

  const AUTH_TYPES: { type: AuthType; label: string; icon: string }[] = [
    { type: "none", label: "No Auth", icon: "M22 12l-4-4v3H3v2h15v3z" },
    { type: "bearer", label: "Bearer Token", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { type: "basic", label: "Basic Auth", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { type: "api-key", label: "API Key", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
    { type: "oauth2", label: "OAuth 2.0", icon: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" },
  ];
</script>

<div>
  <div class="flex flex-wrap gap-1.5 mb-3">
    {#each AUTH_TYPES as at}
      <button
        onclick={() => (authType = at.type)}
        class="px-3 py-1.5 text-xs rounded-md border transition-colors flex items-center gap-1.5"
        class:bg-blue-50={authType === at.type}
        class:border-blue-300={authType === at.type}
        class:text-blue-700={authType === at.type}
        class:border-zinc-300={authType !== at.type}
        class:dark:border-zinc-600={authType !== at.type}
        class:dark:text-zinc-300={authType !== at.type}
        class:hover:bg-zinc-100={authType !== at.type}
        class:dark:hover:bg-zinc-800={authType !== at.type}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d={at.icon} />
        </svg>
        {at.label}
      </button>
    {/each}
  </div>

  {#if authType === "bearer"}
    <div>
      <label class="block text-xs text-zinc-500 mb-1">Token</label>
      <input
        type="password"
        bind:value={bearerToken}
        placeholder="Enter your bearer token"
        class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      />
      <p class="text-[10px] text-zinc-400 mt-1">Token will be sent as: <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">Authorization: Bearer &lt;token&gt;</code></p>
    </div>
  {:else if authType === "basic"}
    <div class="flex gap-3">
      <div class="flex-1">
        <label class="block text-xs text-zinc-500 mb-1">Username</label>
        <input
          type="text"
          bind:value={basicUser}
          placeholder="username"
          class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>
      <div class="flex-1">
        <label class="block text-xs text-zinc-500 mb-1">Password</label>
        <input
          type="password"
          bind:value={basicPass}
          placeholder="password"
          class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>
    </div>
  {:else if authType === "api-key"}
    <div class="flex gap-3">
      <div class="flex-1">
        <label class="block text-xs text-zinc-500 mb-1">Key</label>
        <input
          type="text"
          bind:value={apiKey}
          placeholder="API Key name"
          class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>
      <div class="flex-1">
        <label class="block text-xs text-zinc-500 mb-1">Value</label>
        <input
          type="password"
          bind:value={apiValue}
          placeholder="API Key value"
          class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>
      <div class="w-24">
        <label class="block text-xs text-zinc-500 mb-1">Location</label>
        <select
          bind:value={apiIn}
          class="w-full px-2 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="header">Header</option>
          <option value="query">Query</option>
        </select>
      </div>
    </div>
  {:else if authType === "oauth2"}
    <div class="space-y-2">
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="block text-xs text-zinc-500 mb-1">Client ID</label>
          <input type="text" bind:value={oauthClientId} placeholder="Client ID" class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
        </div>
        <div class="flex-1">
          <label class="block text-xs text-zinc-500 mb-1">Client Secret</label>
          <input type="password" bind:value={oauthSecret} placeholder="Client Secret" class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
        </div>
      </div>
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="block text-xs text-zinc-500 mb-1">Token URL</label>
          <input type="text" bind:value={oauthTokenUrl} placeholder="https://auth.example.com/token" class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
        </div>
        <div class="flex-1">
          <label class="block text-xs text-zinc-500 mb-1">Scope</label>
          <input type="text" bind:value={oauthScope} placeholder="openid profile email" class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
        </div>
      </div>
      <div>
        <label class="block text-xs text-zinc-500 mb-1">Access Token</label>
        <input type="password" bind:value={oauthToken} placeholder="Access token" class="w-full px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick={getOAuth2Token}
          disabled={oauthLoading}
          class="px-3 py-1.5 text-xs rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if oauthLoading}
            <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Getting Token...
          {:else}
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Get New Token
          {/if}
        </button>
        {#if oauthToken}
          <span class="text-[10px] text-green-600 dark:text-green-400">Token acquired</span>
        {/if}
      </div>
      {#if oauthError}
        <p class="text-[10px] text-red-500 mt-1">{oauthError}</p>
      {/if}
    </div>
  {:else}
    <p class="text-xs text-zinc-400">No authentication will be sent with this request.</p>
  {/if}
</div>
