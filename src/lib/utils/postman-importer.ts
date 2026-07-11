import type {
  Collection,
  Folder,
  RequestDefinition,
  KeyValuePair,
  RequestBody,
  AuthConfig,
  HttpMethod,
  ImportResult,
} from "../types";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function now(): string {
  return new Date().toISOString();
}

function parseKeyValue(
  arr: { key: string; value?: string; description?: string; disabled?: boolean }[] | undefined,
): KeyValuePair[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((kv) => ({
    key: kv.key ?? "",
    value: kv.value ?? "",
    description: kv.description ?? "",
    enabled: kv.disabled !== true,
  }));
}

function buildUrlFromObject(urlObj: any): string {
  if (typeof urlObj === "string") return urlObj;
  if (!urlObj) return "";

  let url = "";
  if (urlObj.raw) return urlObj.raw;

  if (urlObj.protocol) url += urlObj.protocol + "://";
  if (Array.isArray(urlObj.host)) url += urlObj.host.join(".");
  if (urlObj.port) url += ":" + urlObj.port;
  if (Array.isArray(urlObj.path)) {
    const resolved = urlObj.path.map((p: string) => {
      if (urlObj.variable) {
        const v = urlObj.variable.find((x: any) => x.key === p.replace(/^:/, ""));
        return v ? v.value ?? `{{${v.key}}}` : p;
      }
      return p;
    });
    url += "/" + resolved.join("/");
  }

  return url;
}

function extractQueryParams(urlObj: any): KeyValuePair[] {
  if (!urlObj || typeof urlObj === "string") return [];
  if (Array.isArray(urlObj.query)) {
    return parseKeyValue(urlObj.query);
  }
  return [];
}

function parsePostmanBody(body: any): RequestBody {
  if (!body || body.mode === "none") {
    return { mode: "none" };
  }

  switch (body.mode) {
    case "raw":
      return { mode: "json", json: body.raw ?? "" };
    case "urlencoded":
      return {
        mode: "urlencoded",
        urlencoded: Array.isArray(body.urlencoded)
          ? body.urlencoded.map((kv: any) => ({
              key: kv.key ?? "",
              value: kv.value ?? "",
            }))
          : [],
      };
    case "formdata":
      return {
        mode: "form-data",
        formData: Array.isArray(body.formdata)
          ? body.formdata.map((fd: any) => ({
              key: fd.key ?? "",
              value: fd.value ?? "",
              type: fd.type === "file" ? "file" : "text",
              filePath: fd.src ?? undefined,
            }))
          : [],
      };
    case "file":
      return { mode: "binary", binary: body.file?.src ?? "" };
    default:
      return { mode: "none" };
  }
}

function parsePostmanAuth(auth: any): AuthConfig {
  if (!auth || auth.type === "noauth") {
    return { type: "none" };
  }

  const values: Record<string, string> = {};
  if (Array.isArray(auth[auth.type])) {
    for (const v of auth[auth.type]) {
      values[v.key] = v.value ?? "";
    }
  }

  switch (auth.type) {
    case "bearer":
      return { type: "bearer", bearer: { token: values.token ?? "" } };
    case "basic":
      return {
        type: "basic",
        basic: { username: values.username ?? "", password: values.password ?? "" },
      };
    case "apikey":
      return {
        type: "api-key",
        apiKey: {
          key: values.key ?? "",
          value: values.value ?? "",
          in: values.in === "query" ? "query" : "header",
        },
      };
    default:
      return { type: "none" };
  }
}

function parsePostmanScripts(events: any[] | undefined): {
  preScript: string;
  testScript: string;
} {
  let preScript = "";
  let testScript = "";

  if (!Array.isArray(events)) return { preScript, testScript };

  for (const evt of events) {
    if (evt?.script?.exec) {
      const script = (Array.isArray(evt.script.exec) ? evt.script.exec : [evt.script.exec]).join(
        "\n",
      );
      if (evt.listen === "prerequest") preScript = script;
      if (evt.listen === "test") testScript = script;
    }
  }

  return { preScript, testScript };
}

function walkPostmanItems(
  items: any[],
  collectionId: string,
  folderId: string | undefined,
  errors: string[],
): { requests: RequestDefinition[]; folders: Folder[] } {
  const requests: RequestDefinition[] = [];
  const folders: Folder[] = [];
  let sortOrder = 0;

  if (!Array.isArray(items)) return { requests, folders };

  for (const item of items) {
    if (!item) continue;

    if (item.item) {
      const folder: Folder = {
        id: generateId(),
        collectionId,
        parentId: folderId,
        name: item.name ?? "Unnamed Folder",
        sortOrder: sortOrder++,
      };
      folders.push(folder);

      const nested = walkPostmanItems(item.item, collectionId, folder.id, errors);
      requests.push(...nested.requests);
      folders.push(...nested.folders);
    } else if (item.request) {
      const urlObj = item.request.url;
      const url = buildUrlFromObject(urlObj);
      const queryParams = extractQueryParams(urlObj);
      const headers = parseKeyValue(item.request.header);
      const body = parsePostmanBody(item.request.body);
      const auth = parsePostmanAuth(item.request.auth);
      const scripts = parsePostmanScripts(item.event);

      const req: RequestDefinition = {
        id: generateId(),
        collectionId,
        folderId,
        name: item.name ?? "Unnamed Request",
        method: (item.request.method ?? "GET").toUpperCase() as HttpMethod,
        url,
        headers,
        queryParams,
        body,
        auth,
        preScript: scripts.preScript,
        testScript: scripts.testScript,
        sortOrder: sortOrder++,
        createdAt: now(),
        updatedAt: now(),
      };
      requests.push(req);
    } else {
      errors.push(`Unrecognized item: ${item.name ?? "(unnamed)"}`);
    }
  }

  return { requests, folders };
}

export function parsePostmanCollection(json: any): ImportResult {
  const errors: string[] = [];

  if (!json || typeof json !== "object") {
    return { success: false, collectionName: "", requestCount: 0, errors: ["Invalid JSON input"] };
  }

  const info = json.info;
  if (!info) {
    return {
      success: false,
      collectionName: "",
      requestCount: 0,
      errors: ["Missing 'info' object — not a Postman collection"],
    };
  }

  const collectionName = info.name ?? "Imported Collection";
  const items = json.item;

  if (!Array.isArray(items)) {
    errors.push("Collection has no 'item' array");
    return { success: errors.length === 0, collectionName, requestCount: 0, errors };
  }

  const collectionId = generateId();
  const { requests, folders: _folders } = walkPostmanItems(items, collectionId, undefined, errors);

  return {
    success: errors.length === 0,
    collectionName,
    requestCount: requests.length,
    errors,
  };
}

// === Insomnia v4 Importer ===

function parseInsomniaBody(body: any, contentType: string | undefined): RequestBody {
  if (!body) return { mode: "none" };

  if (body.mimeType === "application/json" || body.text) {
    return { mode: "json", json: body.text ?? "" };
  }

  if (body.mimeType === "application/x-www-form-urlencoded" && Array.isArray(body.params)) {
    return {
      mode: "urlencoded",
      urlencoded: body.params.map((p: any) => ({
        key: p.name ?? "",
        value: p.value ?? "",
      })),
    };
  }

  if (body.fileName) {
    return { mode: "binary", binary: body.fileName };
  }

  if (contentType?.includes("text")) {
    return { mode: "text", text: body.text ?? "" };
  }

  return { mode: "none" };
}

function parseInsomniaAuth(auth: any): AuthConfig {
  if (!auth) return { type: "none" };

  switch (auth.type) {
    case "bearer":
      return { type: "bearer", bearer: { token: auth.token ?? "" } };
    case "basic":
      return {
        type: "basic",
        basic: { username: auth.username ?? "", password: auth.password ?? "" },
      };
    case "apikey":
      return {
        type: "api-key",
        apiKey: {
          key: auth.key ?? "",
          value: auth.value ?? "",
          in: auth.in === "query" ? "query" : "header",
        },
      };
    default:
      return { type: "none" };
  }
}

function parseInsomniaHeaders(headers: any[] | undefined): KeyValuePair[] {
  if (!Array.isArray(headers)) return [];
  return headers.map((h) => ({
    key: h.name ?? "",
    value: h.value ?? "",
    description: h.description ?? "",
    enabled: h.disabled !== true,
  }));
}

function parseInsomniaUrl(url: string): string {
  return url ?? "";
}

export function parseInsomniaCollection(json: any): ImportResult {
  const errors: string[] = [];

  if (!json || typeof json !== "object") {
    return { success: false, collectionName: "", requestCount: 0, errors: ["Invalid JSON input"] };
  }

  if (json.__export_format !== 4) {
    errors.push(`Unsupported Insomnia export format: ${json.__export_format ?? "unknown"}`);
    return { success: false, collectionName: "", requestCount: 0, errors };
  }

  const resources = json.resources;
  if (!Array.isArray(resources)) {
    errors.push("No 'resources' array found");
    return { success: false, collectionName: "", requestCount: 0, errors };
  }

  const workspace = resources.find((r: any) => r._type === "workspace");
  const collectionName = workspace?.name ?? "Imported Insomnia Collection";

  const resourcesById = new Map<string, any>();
  for (const r of resources) {
    if (r._id) resourcesById.set(r._id, r);
  }

  const requestGroups = resources.filter((r: any) => r._type === "request_group");
  const requestItems = resources.filter((r: any) => r._type === "request");

  function resolveParentFolder(
    parentId: string | null,
    collectionId: string,
  ): string | undefined {
    if (!parentId) return undefined;
    const parent = resourcesById.get(parentId);
    if (!parent) return undefined;
    if (parent._type === "request_group") return parent._id;
    return resolveParentFolder(parent.parentId, collectionId);
  }

  const collectionId = generateId();
  let requestCount = 0;

  for (const req of requestItems) {
    const auth = parseInsomniaAuth(req.authentication);
    const body = parseInsomniaBody(
      req.body,
      req.headers?.find((h: any) => h.name?.toLowerCase() === "content-type")?.value,
    );
    const headers = parseInsomniaHeaders(req.headers);
    const url = parseInsomniaUrl(req.url);
    const preScript = req.preRequestScript ?? "";
    const testScript = req.afterResponseScript ?? "";
    const folderId = resolveParentFolder(req.parentId, collectionId);

    // We just count success — the consumer processes these later
    requestCount++;
  }

  return {
    success: errors.length === 0,
    collectionName,
    requestCount,
    errors,
  };
}

// === Bruno Importer ===

function parseBrunoBody(body: any): RequestBody {
  if (!body) return { mode: "none" };

  if (body.mode === "json") {
    return { mode: "json", json: typeof body.json === "object" ? JSON.stringify(body.json) : (body.json ?? "") };
  }

  if (body.mode === "text") {
    return { mode: "text", text: body.text ?? "" };
  }

  if (body.mode === "formUrlEncoded" && Array.isArray(body.formUrlEncoded)) {
    return {
      mode: "urlencoded",
      urlencoded: body.formUrlEncoded.map((kv: any) => ({
        key: kv.name ?? "",
        value: kv.value ?? "",
      })),
    };
  }

  if (body.mode === "multipartForm" && Array.isArray(body.multipartForm)) {
    return {
      mode: "form-data",
      formData: body.multipartForm.map((fd: any) => ({
        key: fd.name ?? "",
        value: fd.value ?? "",
        type: fd.type === "file" ? "file" : "text",
        filePath: fd.src ?? undefined,
      })),
    };
  }

  return { mode: "none" };
}

function parseBrunoAuth(auth: any): AuthConfig {
  if (!auth) return { type: "none" };

  switch (auth.mode) {
    case "bearer":
      return { type: "bearer", bearer: { token: auth.token ?? "" } };
    case "basic":
      return {
        type: "basic",
        basic: { username: auth.username ?? "", password: auth.password ?? "" },
      };
    default:
      return { type: "none" };
  }
}

function parseBrunoHeaders(headers: Record<string, string> | undefined): KeyValuePair[] {
  if (!headers || typeof headers !== "object") return [];
  return Object.entries(headers).map(([key, value]) => ({
    key,
    value: value ?? "",
    description: "",
    enabled: true,
  }));
}

function parseBrunoParams(
  params: Record<string, string> | undefined,
): KeyValuePair[] {
  if (!params || typeof params !== "object") return [];
  return Object.entries(params).map(([key, value]) => ({
    key,
    value: value ?? "",
    description: "",
    enabled: true,
  }));
}

function walkBrunoItems(
  items: any[],
  collectionId: string,
  folderId: string | undefined,
  errors: string[],
): { requests: RequestDefinition[]; folders: Folder[] } {
  const requests: RequestDefinition[] = [];
  const folders: Folder[] = [];
  let sortOrder = 0;

  if (!Array.isArray(items)) return { requests, folders };

  for (const item of items) {
    if (!item) continue;

    if (item.items) {
      const folder: Folder = {
        id: generateId(),
        collectionId,
        parentId: folderId,
        name: item.name ?? "Unnamed Folder",
        sortOrder: sortOrder++,
      };
      folders.push(folder);

      const nested = walkBrunoItems(item.items, collectionId, folder.id, errors);
      requests.push(...nested.requests);
      folders.push(...nested.folders);
    } else if (item.request) {
      const req = item.request;
      const auth = parseBrunoAuth(req.auth);
      const body = parseBrunoBody(req.body);
      const headers = parseBrunoHeaders(req.headers);
      const queryParams = parseBrunoParams(req.params);
      const preScript = req.script?.["pre-request"] ?? "";
      const testScript = req.script?.test ?? "";

      const requestDef: RequestDefinition = {
        id: generateId(),
        collectionId,
        folderId,
        name: item.name ?? "Unnamed Request",
        method: (req.method ?? "GET").toUpperCase() as HttpMethod,
        url: req.url ?? "",
        headers,
        queryParams,
        body,
        auth,
        preScript,
        testScript,
        sortOrder: sortOrder++,
        createdAt: now(),
        updatedAt: now(),
      };
      requests.push(requestDef);
    } else {
      errors.push(`Unrecognized Bruno item: ${item.name ?? "(unnamed)"}`);
    }
  }

  return { requests, folders };
}

export function parseBrunoCollection(json: any): ImportResult {
  const errors: string[] = [];

  if (!json || typeof json !== "object") {
    return { success: false, collectionName: "", requestCount: 0, errors: ["Invalid JSON input"] };
  }

  const collectionName = json.name ?? "Imported Bruno Collection";
  const items = json.items;

  if (!Array.isArray(items)) {
    errors.push("Collection has no 'items' array");
    return { success: errors.length === 0, collectionName, requestCount: 0, errors };
  }

  const collectionId = generateId();
  const { requests, folders: _folders } = walkBrunoItems(items, collectionId, undefined, errors);

  return {
    success: errors.length === 0,
    collectionName,
    requestCount: requests.length,
    errors,
  };
}
