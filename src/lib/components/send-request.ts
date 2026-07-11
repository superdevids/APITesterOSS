import { get } from "svelte/store";
import {
  currentRequest,
  isSending,
  response,
  testResults,
  error as errorStore,
} from "../stores/request";
import { activeEnvironmentId, environments, substituteVariables } from "../stores/environment";
import { prepareRequest } from "../utils/variable-substitution";
import { historyEntries } from "../stores/history";
import type { ApiResponse, TestResult } from "../types";

export async function sendRequest(): Promise<void> {
  const req = get(currentRequest);
  const envId = get(activeEnvironmentId);
  const envName = envId
    ? get(environments).find((e) => e.id === envId)?.name || ""
    : "";

  if (!req.url) {
    errorStore.set("URL is required");
    return;
  }

  isSending.set(true);
  errorStore.set(null);
  response.set(null);
  testResults.set([]);

  try {
    const prepared = prepareRequest(req, envId);

    // Try to use Tauri backend first
    let apiResponse: ApiResponse;

    try {
      const { invoke } = await import("@tauri-apps/api/core");

      // Pre-request script execution (simplified - runs on frontend for now)
      if (req.preScript) {
        try {
          // Basic variable setting from pre-script
          const fn = new Function("pm", req.preScript);
          fn(createPmApi(envId));
        } catch (scriptError) {
          console.warn("Pre-request script error:", scriptError);
        }
      }

      apiResponse = await invoke<ApiResponse>("send_request", {
        method: req.method,
        url: prepared.url,
        headers: prepared.headers,
        body: prepared.body,
      });
    } catch {
      // Fallback: use fetch API directly if Tauri backend is not available
      apiResponse = await sendViaFetch(req.method, prepared.url, prepared.headers, prepared.body);
    }

    response.set(apiResponse);

    // Run test scripts
    if (req.testScript) {
      const results = runTests(req.testScript, apiResponse);
      testResults.set(results);
    }

    // Add to history
    const historyEntry = {
      id: crypto.randomUUID(),
      method: req.method,
      url: req.url,
      requestBody: prepared.body || null,
      requestHeaders: prepared.headers,
      responseStatus: apiResponse.statusCode,
      responseBody: apiResponse.body?.slice(0, 10000) || null,
      responseHeaders: apiResponse.headers,
      responseTimeMs: apiResponse.responseTimeMs,
      responseSizeBytes: apiResponse.responseSizeBytes,
      createdAt: new Date().toISOString(),
    };

    historyEntries.update((entries) => [historyEntry, ...entries].slice(0, 500));

    // Save history to backend
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_history", { entry: historyEntry });
    } catch {
      // Silently fail - history is stored locally
    }
  } catch (e) {
    errorStore.set(e instanceof Error ? e.message : "Request failed");
  } finally {
    isSending.set(false);
  }
}

async function sendViaFetch(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<ApiResponse> {
  const startTime = performance.now();

  const response = await fetch(url, {
    method,
    headers,
    body: body || undefined,
  });

  const endTime = performance.now();
  const responseBody = await response.text();
  const responseHeaders: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Parse cookies
  const cookies: { name: string; value: string; domain: string; path: string; expires: string }[] = [];
  const setCookieHeader = responseHeaders["set-cookie"];
  if (setCookieHeader) {
    setCookieHeader.split(",").forEach((cookieStr) => {
      const parts = cookieStr.split(";");
      const [name, ...valParts] = parts[0].split("=");
      const cookie = {
        name: name?.trim() || "",
        value: valParts.join("=")?.trim() || "",
        domain: "",
        path: "/",
        expires: "",
      };
      parts.slice(1).forEach((part) => {
        const [k, ...v] = part.trim().split("=");
        const key = k?.toLowerCase() || "";
        const val = v.join("=");
        if (key === "domain") cookie.domain = val;
        if (key === "path") cookie.path = val;
        if (key === "expires") cookie.expires = val;
      });
      cookies.push(cookie);
    });
  }

  return {
    statusCode: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: responseBody,
    cookies,
    responseTimeMs: Math.round(endTime - startTime),
    responseSizeBytes: new TextEncoder().encode(responseBody).length,
    timestamp: new Date().toISOString(),
  };
}

function runTests(script: string, apiResponse: ApiResponse): TestResult[] {
  const results: TestResult[] = [];

  const pm = createPmApi(null);
  pm.response = {
    statusCode: apiResponse.statusCode,
    statusText: apiResponse.statusText,
    headers: apiResponse.headers,
    json: () => {
      try {
        return JSON.parse(apiResponse.body);
      } catch {
        return null;
      }
    },
    text: () => apiResponse.body,
    responseTime: apiResponse.responseTimeMs,
    responseSize: apiResponse.responseSizeBytes,
  };

  pm.test = (name: string, fn: () => void) => {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (e) {
      results.push({
        name,
        passed: false,
        error: e instanceof Error ? e.message : "Assertion failed",
      });
    }
  };

  try {
    const fn = new Function("pm", script);
    fn(pm);
  } catch (e) {
    results.push({
      name: "Script Error",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  return results;
}

export function createPmApi(envId: string | null) {
  const varStore: Record<string, string> = {};

  return {
    variables: {
      set: (key: string, value: string) => {
        varStore[key] = value;
      },
      get: (key: string) => varStore[key],
      unset: (key: string) => {
        delete varStore[key];
      },
    },
    environment: {
      set: (key: string, value: string) => {
        varStore[`env_${key}`] = value;
      },
      get: (key: string) => varStore[`env_${key}`],
    },
    request: {
      url: { toString: () => "" },
      method: "GET",
      headers: { each: () => {} },
      body: { toString: () => "" },
    },
    response: {} as any,
    test: (name: string, fn: () => void) => {
      try {
        fn();
      } catch (e) {
        console.error(`Test "${name}" failed:`, e);
      }
    },
    expect: (actual: any) => {
      const assert = (pass: boolean, msg: string) => {
        if (!pass) throw new Error(msg);
      };
      return {
        to: {
          equal: (expected: any) => assert(actual === expected, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`),
          not: {
            equal: (expected: any) => assert(actual !== expected, `Expected not ${JSON.stringify(expected)}`),
          },
          include: (str: string) => assert(String(actual).includes(str), `Expected "${actual}" to include "${str}"`),
          exist: () => assert(actual != null, "Expected value to exist"),
          be: {
            an: (type: string) => assert(typeof actual === type || Array.isArray(actual), `Expected ${typeof actual} to be ${type}`),
          },
          below: (limit: number) => assert(actual < limit, `Expected ${actual} to be below ${limit}`),
          above: (limit: number) => assert(actual > limit, `Expected ${actual} to be above ${limit}`),
        },
      };
    },
    console: {
      log: (...args: any[]) => console.log("[Script]", ...args),
    },
  };
}
