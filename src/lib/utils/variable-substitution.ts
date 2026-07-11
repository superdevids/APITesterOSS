import type { KeyValuePair, RequestDefinition, AuthConfig } from "../types";
import { substituteVariables } from "../stores/environment";

export interface SubstitutedRequest {
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  contentType: string | null;
}

/**
 * Substitute all {{variables}} in a request and prepare it for sending.
 */
export function prepareRequest(
  request: RequestDefinition,
  environmentId: string | null
): SubstitutedRequest {
  // Substitute URL
  let url = substituteVariables(request.url, environmentId);

  // Substitute and collect headers
  const headers: Record<string, string> = {};
  for (const h of request.headers) {
    if (h.enabled) {
      headers[h.key] = substituteVariables(h.value, environmentId);
    }
  }

  // Handle auth
  applyAuth(request.auth, headers, environmentId);

  // Substitute query params
  const queryParams: Record<string, string> = {};
  const urlObj = new URL(url.startsWith("http") ? url : `http://${url}`);
  
  // Add existing URL params
  urlObj.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });
  
  // Add key-value params
  for (const p of request.queryParams) {
    if (p.enabled) {
      queryParams[p.key] = substituteVariables(p.value, environmentId);
    }
  }

  // Build final URL
  const paramStr = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const baseUrl = url.split("?")[0];
  url = paramStr ? `${baseUrl}?${paramStr}` : baseUrl;

  // Handle body
  let body = "";
  let contentType: string | null = null;

  switch (request.body.mode) {
    case "json":
      body = request.body.json || "";
      if (!headers["Content-Type"]) contentType = "application/json";
      break;
    case "form-data": {
      const formBoundary = `----formdata-${crypto.randomUUID().slice(0, 16)}`;
      contentType = `multipart/form-data; boundary=${formBoundary}`;
      const parts: string[] = [];
      for (const item of request.body.formData || []) {
        if (item.type === "text") {
          parts.push(
            `--${formBoundary}\r\nContent-Disposition: form-data; name="${item.key}"\r\n\r\n${substituteVariables(item.value, environmentId)}`
          );
        }
      }
      parts.push(`--${formBoundary}--`);
      body = parts.join("\r\n");
      break;
    }
    case "urlencoded": {
      contentType = "application/x-www-form-urlencoded";
      const params = new URLSearchParams();
      for (const item of request.body.urlencoded || []) {
        params.append(
          substituteVariables(item.key, environmentId),
          substituteVariables(item.value, environmentId)
        );
      }
      body = params.toString();
      break;
    }
    case "graphql":
      contentType = "application/json";
      body = JSON.stringify({
        query: request.body.graphql?.query || "",
        variables: request.body.graphql?.variables || {},
      });
      break;
    case "text":
      body = substituteVariables(request.body.text || "", environmentId);
      if (!headers["Content-Type"]) contentType = "text/plain";
      break;
  }

  if (contentType && !headers["Content-Type"]) {
    headers["Content-Type"] = contentType;
  }

  return { url, headers, queryParams, body, contentType };
}

function applyAuth(
  auth: AuthConfig,
  headers: Record<string, string>,
  envId: string | null
) {
  switch (auth.type) {
    case "bearer":
      headers["Authorization"] = `Bearer ${substituteVariables(auth.bearer?.token || "", envId)}`;
      break;
    case "basic": {
      const user = substituteVariables(auth.basic?.username || "", envId);
      const pass = substituteVariables(auth.basic?.password || "", envId);
      headers["Authorization"] = `Basic ${btoa(`${user}:${pass}`)}`;
      break;
    }
    case "api-key":
      if (auth.apiKey?.in === "header") {
        headers[auth.apiKey.key] = substituteVariables(auth.apiKey.value, envId);
      }
      break;
    case "oauth2":
      headers["Authorization"] = `Bearer ${substituteVariables(auth.oauth2?.accessToken || "", envId)}`;
      break;
  }
}
