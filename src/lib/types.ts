// === Data Models (PRD Section 7) ===

export type HttpMethod =
  | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type BodyMode =
  | "none" | "json" | "form-data" | "urlencoded" | "binary" | "graphql" | "text";

export type AuthType =
  | "none" | "bearer" | "basic" | "oauth2" | "api-key";

export type AuthLocation = "header" | "query";

export type FormDataItemType = "text" | "file";

// === Auth ===
export interface BearerAuth {
  token: string;
}

export interface BasicAuth {
  username: string;
  password: string;
}

export interface OAuth2Auth {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope: string;
  accessToken: string;
}

export interface ApiKeyAuth {
  key: string;
  value: string;
  in: AuthLocation;
}

export interface AuthConfig {
  type: AuthType;
  bearer?: BearerAuth;
  basic?: BasicAuth;
  oauth2?: OAuth2Auth;
  apiKey?: ApiKeyAuth;
}

// === Body ===
export interface FormDataItem {
  key: string;
  value: string;
  type: FormDataItemType;
  filePath?: string;
}

export interface UrlEncodedItem {
  key: string;
  value: string;
}

export interface GraphQLBody {
  query: string;
  variables: Record<string, unknown>;
}

export interface RequestBody {
  mode: BodyMode;
  json?: string;
  formData?: FormDataItem[];
  urlencoded?: UrlEncodedItem[];
  graphql?: GraphQLBody;
  text?: string;
  binary?: string;
}

// === KeyValue (Headers, Query Params) ===
export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

// === Request Definition ===
export interface RequestDefinition {
  id: string;
  collectionId?: string;
  folderId?: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: RequestBody;
  auth: AuthConfig;
  preScript: string;
  testScript: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// === Collection ===
export interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// === Folder ===
export interface Folder {
  id: string;
  collectionId: string;
  parentId?: string;
  name: string;
  sortOrder: number;
}

// === Environment ===
export interface Variable {
  id: string;
  environmentId: string;
  key: string;
  value: string;
  isSecret: boolean;
  description: string;
  sortOrder: number;
}

export interface Environment {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// === Response ===
export interface ResponseCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
}

export interface ApiResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  cookies: ResponseCookie[];
  responseTimeMs: number;
  responseSizeBytes: number;
  timestamp: string;
}

// === History ===
export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  requestBody?: string;
  requestHeaders: Record<string, string>;
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  responseTimeMs?: number;
  responseSizeBytes?: number;
  createdAt: string;
}

// === Tab Types ===
export type RequestTab = "params" | "headers" | "auth" | "body" | "scripts";
export type ResponseTab = "pretty" | "raw" | "preview" | "headers" | "cookies" | "tests";
export type ScriptTab = "prerequest" | "tests";

// === Sidebar View ===
export type SidebarView = "collections" | "history";

// === Test Result ===
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

// === Collection Runner ===
export interface RunnerResult {
  requestId: string;
  requestName: string;
  statusCode?: number;
  responseTimeMs?: number;
  tests: TestResult[];
  passed: boolean;
  error?: string;
}

// === Import Result ===
export interface ImportResult {
  success: boolean;
  collectionName: string;
  requestCount: number;
  errors: string[];
}
