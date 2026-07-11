import type { HttpMethod } from "../types";

export const HTTP_METHODS: { method: HttpMethod; color: string; description: string }[] = [
  { method: "GET", color: "method-get", description: "Retrieve data" },
  { method: "POST", color: "method-post", description: "Create resource" },
  { method: "PUT", color: "method-put", description: "Update resource" },
  { method: "PATCH", color: "method-patch", description: "Partial update" },
  { method: "DELETE", color: "method-delete", description: "Delete resource" },
  { method: "HEAD", color: "method-head", description: "Headers only" },
  { method: "OPTIONS", color: "method-options", description: "Available options" },
];

export const STATUS_CODE_TEXT: Record<number, string> = {
  100: "Continue", 101: "Switching Protocols",
  200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
  301: "Moved Permanently", 302: "Found", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
  404: "Not Found", 405: "Method Not Allowed", 409: "Conflict",
  422: "Unprocessable Entity", 429: "Too Many Requests",
  500: "Internal Server Error", 502: "Bad Gateway",
  503: "Service Unavailable", 504: "Gateway Timeout",
};

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "status-2xx";
  if (status >= 300 && status < 400) return "status-3xx";
  if (status >= 400 && status < 500) return "status-4xx";
  return "status-5xx";
}

export function getStatusText(status: number): string {
  return STATUS_CODE_TEXT[status] || "Unknown";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
