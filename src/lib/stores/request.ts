import { writable, derived } from "svelte/store";
import type {
  RequestDefinition,
  HttpMethod,
  BodyMode,
  AuthConfig,
  KeyValuePair,
  RequestBody,
  ApiResponse,
  TestResult,
  RequestTab,
} from "../types";

function createEmptyRequest(): RequestDefinition {
  return {
    id: crypto.randomUUID(),
    name: "New Request",
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    body: { mode: "none" },
    auth: { type: "none" },
    preScript: "",
    testScript: "",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const currentRequest = writable<RequestDefinition>(createEmptyRequest());
export const activeTab = writable<RequestTab>("body");
export const isSending = writable(false);
export const response = writable<ApiResponse | null>(null);
export const testResults = writable<TestResult[]>([]);
export const error = writable<string | null>(null);

export function resetRequest() {
  currentRequest.set(createEmptyRequest());
  response.set(null);
  testResults.set([]);
  error.set(null);
}

export function setMethod(method: HttpMethod) {
  currentRequest.update((r) => ({ ...r, method }));
}

export function setUrl(url: string) {
  currentRequest.update((r) => ({ ...r, url }));
}

export function setBodyMode(mode: BodyMode) {
  currentRequest.update((r) => ({
    ...r,
    body: { ...r.body, mode },
  }));
}

export function setBodyJson(json: string) {
  currentRequest.update((r) => ({
    ...r,
    body: { ...r.body, json },
  }));
}

export function setAuth(auth: AuthConfig) {
  currentRequest.update((r) => ({ ...r, auth }));
}

export function setHeaders(headers: KeyValuePair[]) {
  currentRequest.update((r) => ({ ...r, headers }));
}

export function setQueryParams(params: KeyValuePair[]) {
  currentRequest.update((r) => ({ ...r, queryParams: params }));
}

export function setName(name: string) {
  currentRequest.update((r) => ({ ...r, name }));
}

export function setPreScript(script: string) {
  currentRequest.update((r) => ({ ...r, preScript: script }));
}

export function setTestScript(script: string) {
  currentRequest.update((r) => ({ ...r, testScript: script }));
}
