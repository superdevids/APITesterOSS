# ARCHITECTURE.md — API Tester OSS

> **Version:** 1.0  
> **Last Updated:** 2026-07-11  
> **Status:** Living Document  

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Data Flow](#6-data-flow)
7. [Database Schema](#7-database-schema)
8. [Security Architecture](#8-security-architecture)
9. [Performance Architecture](#9-performance-architecture)
10. [Build & Deployment](#10-build--deployment)
11. [Extension Points](#11-extension-points)

---

## 1. Overview & Philosophy

### 1.1 What Is API Tester OSS?

API Tester OSS is a **native, cross-platform desktop API client** for testing REST, GraphQL, gRPC, WebSocket, and SSE endpoints. It is built as a lightweight, privacy-first alternative to Postman and Insomnia — both of which rely on Electron and consume hundreds of megabytes of RAM and disk.

### 1.2 Core Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Native first** | Tauri 2.x shell with Rust backend — no Electron, no Chromium bundling |
| **Offline first** | All data stored in local SQLite; no login, no cloud, no telemetry |
| **Privacy first** | Zero data leaves the machine except the HTTP requests the user explicitly sends |
| **Small footprint** | Binary <20MB, RAM <80MB idle, startup <1s |
| **Multi-protocol** | REST, GraphQL, gRPC, WebSocket, SSE in a single coherent UI |
| **Open source** | MIT core, community-driven, no feature gating on basic functionality |

### 1.3 Design Constraints

The architecture is shaped by five hard constraints:

1. **No Electron** — eliminates 150MB+ Chromium overhead
2. **No V8** — Boa JS engine (pure Rust) for scripting instead of embedding V8
3. **No JSON file storage** — SQLite for query performance and relational integrity
4. **No localhost HTTP server** — Tauri IPC (`invoke`) for frontend-backend communication
5. **No virtual DOM runtime** — Svelte compiles to vanilla JS; no React/Vue runtime tax

---

## 2. High-Level Architecture

### 2.1 System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Tauri Shell (Native)                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Frontend (Svelte 5 + TailwindCSS 4)            │ │
│  │                                                             │ │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐   │ │
│  │  │ Request  │ │ Collection│ │ Response │ │  Script    │   │ │
│  │  │ Builder  │ │  Browser  │ │  Viewer  │ │  Editor    │   │ │
│  │  └──────────┘ └───────────┘ └──────────┘ └────────────┘   │ │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐   │ │
│  │  │Environment│ │ History   │ │  Auth    │ │  Code      │   │ │
│  │  │ Manager  │ │  Panel    │ │  Panel   │ │  Snippets  │   │ │
│  │  └──────────┘ └───────────┘ └──────────┘ └────────────┘   │ │
│  │                                                             │ │
│  │  Stores: request | collection | environment | history | theme │
│  └─────────────────────────────────────────────────────────────┘
│                              │                                    │
│                              │ Tauri IPC (invoke)                 │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Rust Backend (Tokio)                       │ │
│  │                                                             │ │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐   │ │
│  │  │ reqwest  │ │tungstenite│ │  tonic   │ │ boa_engine │   │ │
│  │  │ (HTTP)   │ │(WebSocket)│ │ (gRPC)   │ │ (Scripts)  │   │ │
│  │  │   ✅     │ │  planned  │ │ planned  │ │  planned   │   │ │
│  │  └──────────┘ └───────────┘ └──────────┘ └────────────┘   │ │
│  │  ┌──────────────────┐ ┌────────────────────────────────┐  │ │
│  │  │    rusqlite      │ │   Import / Export              │  │ │
│  │  │  (SQLite WAL)    │ │  (Postman / Insomnia / Bruno)  │  │ │
│  │  └──────────────────┘ └────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Tauri Plugins (Native Bridge)                │ │
│  │   dialog │ shell │ clipboard-manager                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SQLite DB File  │
                    │  api_tester.db   │
                    │  (WAL mode)      │
                    └──────────────────┘
```

### 2.2 Process Boundaries

```
┌─────────────────┐         ┌─────────────────┐
│  WebView Process│◄────────│  Main Process   │
│  (Svelte UI)    │  IPC    │  (Rust + Tokio) │
│                 │ invoke  │                 │
│  - Rendering    │────────►│  - HTTP/WS/gRPC │
│  - State stores │         │  - SQLite       │
│  - User input   │         │  - Scripting    │
└─────────────────┘         └─────────────────┘
```

The Tauri shell manages two execution contexts:
- **WebView Process** — renders the Svelte frontend, handles user interaction, manages UI state via Svelte stores
- **Main Process** — Rust binary with Tokio async runtime, owns the SQLite connection, performs all network I/O and scripting

Communication between the two is via Tauri's IPC `invoke` mechanism — a direct, serialized channel with no HTTP overhead.

---

## 3. Technology Stack

### 3.1 Stack Overview

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Desktop Framework** | Tauri | 2.x | Native binary, ~10MB shell, uses system WebView (no Chromium bundling) |
| **Frontend Framework** | Svelte | 5.x | Compiled to vanilla JS; no virtual DOM runtime; ~15KB gzipped runtime |
| **CSS Framework** | TailwindCSS | 4.x | Utility-first, purged at build time; zero unused CSS shipped |
| **Build Tool** | Vite | 6.x | Fast HMR, ESBuild-powered dev server |
| **Language (Frontend)** | TypeScript | 5.x | Type safety for IPC contracts and data models |
| **Backend Language** | Rust | 2021 edition | Zero-cost abstractions, memory safety, no GC pauses |
| **Async Runtime** | Tokio | 1.x | Industry-standard Rust async runtime |
| **HTTP Client** | reqwest | 0.12 | Mature, feature-rich HTTP client with streaming and multipart |
| **WebSocket** | tungstenite | planned | Lightweight WebSocket implementation for Rust |
| **gRPC** | tonic | planned | High-performance gRPC stack built on Hyper and Tower |
| **Scripting Engine** | boa_engine | planned | Pure-Rust JS engine; no V8 binary; sandboxable |
| **Database** | SQLite (via rusqlite) | 0.31 | Embedded, zero-config, ACID-compliant; WAL mode for concurrent reads |
| **Serialization** | serde / serde_json | 1.x | De-facto Rust serialization framework |
| **UUID** | uuid | 1.x | v4 UUIDs for all primary keys |
| **Timestamps** | chrono | 0.4 | RFC 3339 timestamps with serde support |
| **Tauri Plugins** | dialog, shell, clipboard-manager | 2.x | Native OS integrations |

### 3.2 Why These Choices?

```
┌────────────────────┬─────────────────────┬─────────────────────┐
│  Concern           │  Our Choice         │  Rejected Alt       │
│                    │                     │  (and why)          │
├────────────────────┼─────────────────────┼─────────────────────┤
│ Desktop shell      │ Tauri 2.x           │ Electron (200MB+    │
│                    │ (~10MB shell)       │ Chromium bundling)  │
├────────────────────┼─────────────────────┼─────────────────────┤
│ UI framework       │ Svelte 5 (compiled) │ React (VDOM runtime │
│                    │                     │ 40KB+), Vue (VDOM)  │
├────────────────────┼─────────────────────┼─────────────────────┤
│ JS engine          │ Boa (pure Rust)     │ V8 (30MB+ binary,   │
│                    │                     │ unsafe embed)       │
├────────────────────┼─────────────────────┼─────────────────────┤
│ Storage            │ SQLite (rusqlite)   │ JSON files (no      │
│                    │                     │ query, no relations)│
├────────────────────┼─────────────────────┼─────────────────────┤
│ IPC                │ Tauri invoke        │ HTTP localhost      │
│                    │ (direct, serialized)│ (port overhead,     │
│                    │                     │ security surface)   │
└────────────────────┴─────────────────────┴─────────────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
src/
├── App.svelte                    # Root component — layout orchestration
├── main.ts                       # Entry point — mounts Svelte app
├── app.css                       # Global styles + Tailwind 4 import
├── svelte-env.d.ts               # Svelte type declarations
├── index.js                      # JS entry (fallback)
├── main.tsx                      # TSX entry (legacy compat)
│
├── lib/
│   ├── types.ts                  # All TypeScript interfaces & types
│   │
│   ├── components/               # 20 Svelte components
│   │   ├── Sidebar.svelte              # Left nav: collections/history toggle
│   │   ├── RequestBuilder.svelte       # URL bar + method + send/cancel
│   │   ├── ResponseViewer.svelte       # Response tabs: pretty/raw/preview/headers/cookies/tests
│   │   ├── CollectionBrowser.svelte    # Tree view: collection → folder → request
│   │   ├── EnvironmentManager.svelte   # Environment CRUD + variable editor
│   │   ├── HistoryPanel.svelte         # Grouped history list
│   │   ├── AuthPanel.svelte            # Auth config: bearer/basic/apikey/oauth2
│   │   ├── HeadersEditor.svelte        # Key-value table for headers
│   │   ├── ParamsEditor.svelte         # Key-value table for query params
│   │   ├── PathVariables.svelte        # Auto-detected :param inputs
│   │   ├── RequestBody.svelte          # Body editor: JSON/form/urlencoded/binary/graphql/text
│   │   ├── ScriptEditor.svelte         # Pre-request & test script editor
│   │   ├── ImportModal.svelte          # Postman/Insomnia/Bruno import dialog
│   │   ├── CodeSnippetModal.svelte     # Generate cURL/fetch/Python/Go/Rust
│   │   ├── CollectionRunner.svelte     # Batch run with progress + results
│   │   ├── KeyboardShortcutsModal.svelte # Shortcut reference & customization
│   │   ├── WebSocketPanel.svelte       # WebSocket connect/send/receive
│   │   ├── SSEPanel.svelte             # Server-Sent Events listener
│   │   ├── GRPCPanel.svelte            # gRPC unary + streaming
│   │   └── send-request.ts             # IPC wrapper for send_request command
│   │
│   ├── stores/                   # 5 Svelte stores (reactive state)
│   │   ├── request.ts                  # Current request, sending state, response, test results
│   │   ├── collection.ts               # Collections, folders, requests, tree structure
│   │   ├── environment.ts              # Environments, variables, active env, substitution
│   │   ├── history.ts                  # History entries, date grouping
│   │   └── theme.ts                    # Dark/light mode + system preference
│   │
│   └── utils/                    # 6 utility modules
│       ├── variable-substitution.ts    # {{var}} and {{$dynamic}} substitution
│       ├── code-snippets.ts            # Generate code snippets for 6 languages
│       ├── http-methods.ts             # Method definitions, colors, labels
│       ├── keyboard-shortcuts.ts       # Global shortcut registration
│       ├── postman-importer.ts         # Parse Postman v2.1 collection JSON
│       └── export-collection.ts        # Export collection to JSON
```

### 4.2 Component Architecture

```
                         ┌─────────────┐
                         │  App.svelte │
                         └──────┬──────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                     │
           ▼                    ▼                     ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
  │   Sidebar       │  │ RequestBuilder  │  │ ResponseViewer   │
  │   .svelte       │  │   .svelte       │  │   .svelte        │
  └───────┬─────────┘  └───────┬─────────┘  └──────────────────┘
          │                    │
          │                    ├──────────────┬──────────────┐
          │                    │              │              │
          │                    ▼              ▼              ▼
          │            ┌────────────┐  ┌────────────┐  ┌───────────┐
          │            │ParamsEditor│  │HeadersEdit │  │AuthPanel  │
          │            └────────────┘  └────────────┘  └───────────┘
          │                    │
          │                    ├──────────────┐
          │                    ▼              ▼
          │            ┌────────────┐  ┌────────────┐
          │            │RequestBody │  │ScriptEditor│
          │            └────────────┘  └────────────┘
          │
          ├──────────────────┬──────────────────┐
          ▼                  ▼                  ▼
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │Collection     │  │HistoryPanel   │  │Environment    │
  │Browser        │  │               │  │Manager        │
  └───────┬───────┘  └───────────────┘  └───────────────┘
          │
          ▼
  ┌───────────────┐
  │CollectionRunner│
  └───────────────┘
```

### 4.3 State Management (Svelte Stores)

The frontend uses Svelte's built-in stores (writable/readable/derived) — no external state library. Each store owns a specific domain:

| Store | File | Responsibility | Key State |
|-------|------|---------------|-----------|
| **request** | `stores/request.ts` | Current request lifecycle | `method`, `url`, `headers`, `body`, `auth`, `isSending`, `response`, `testResults` |
| **collection** | `stores/collection.ts` | Collection tree | `collections[]`, `folders[]`, `requests[]`, `selectedRequestId`, `searchQuery` |
| **environment** | `stores/environment.ts` | Environments & variables | `environments[]`, `activeEnvironmentId`, `variables[]`, `substitutedValues` |
| **history** | `stores/history.ts` | Request history | `entries[]`, `groupedEntries` (by date), `searchQuery` |
| **theme** | `stores/theme.ts` | UI theme | `mode` ('dark' \| 'light' \| 'system'), `resolvedMode` |

**Store communication pattern:**

```typescript
// stores/request.ts (simplified)
import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import type { ApiResponse, RequestDefinition } from '../types';

export const currentRequest = writable<Partial<RequestDefinition>>({
  method: 'GET',
  url: '',
  headers: [],
  queryParams: [],
  body: { mode: 'none' },
  auth: { type: 'none' },
});

export const isSending = writable(false);
export const response = writable<ApiResponse | null>(null);

export async function sendRequest() {
  isSending.set(true);
  try {
    const result = await invoke<ApiResponse>('send_request', {
      method: currentRequest.method,
      url: currentRequest.url,
      headers: /* ... */,
      body: /* ... */,
    });
    response.set(result);
  } finally {
    isSending.set(false);
  }
}
```

### 4.4 TypeScript Type System

All frontend types are centralized in `src/lib/types.ts` and mirror the Rust models in `src-tauri/src/model/mod.rs`. Key types:

```typescript
// Core discriminated unions
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type BodyMode = "none" | "json" | "form-data" | "urlencoded" | "binary" | "graphql" | "text";
export type AuthType = "none" | "bearer" | "basic" | "oauth2" | "api-key";

// Composite types
export interface RequestDefinition { /* ... */ }
export interface ApiResponse { /* ... */ }
export interface HistoryEntry { /* ... */ }
export interface Collection { /* ... */ }
export interface Environment { /* ... */ }
export interface Variable { /* ... */ }
```

The `serde(rename_all = "camelCase")` attribute on Rust structs ensures seamless JSON serialization matching the TypeScript camelCase convention.

---

## 5. Backend Architecture

### 5.1 Crate Structure

```
src-tauri/
├── Cargo.toml                      # Dependencies & crate config
├── build.rs                        # Tauri build script
├── tauri.conf.json                 # Tauri window/bundle/security config
├── capabilities/
│   └── default.json                # Tauri 2.x permission capabilities
└── src/
    ├── main.rs                     # Entry point — calls lib::run()
    ├── lib.rs                      # App init: DB, plugins, command registration
    │
    ├── commands/                   # Tauri IPC command handlers
    │   ├── mod.rs                  # Module declarations
    │   ├── request.rs              # send_request, DbState struct
    │   ├── collection.rs           # get_collections, create_collection, delete_collection, save_request
    │   ├── environment.rs          # get_environments, create_environment
    │   ├── history.rs              # get_history, save_history, clear_history
    │   └── grpc.rs                 # grpc_call (stub/planned)
    │
    ├── model/
    │   └── mod.rs                  # All data models (serde structs)
    │
    └── db/
        ├── mod.rs                  # Module declarations
        ├── migration.rs            # Schema creation & migrations
        └── repository.rs           # Data access layer (CRUD functions)
```

### 5.2 Application Initialization

The entry point in `lib.rs` orchestrates startup:

```rust
pub fn run() {
    // 1. Initialize SQLite database (WAL mode + foreign keys)
    let conn = init_database();

    // 2. Build Tauri app with plugins and managed state
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(DbState(Mutex::new(conn)))     // Shared DB connection
        .invoke_handler(tauri::generate_handler![
            commands::request::send_request,
            commands::collection::get_collections,
            commands::collection::create_collection,
            commands::collection::delete_collection,
            commands::collection::save_request,
            commands::environment::get_environments,
            commands::environment::create_environment,
            commands::history::get_history,
            commands::history::save_history,
            commands::history::clear_history,
            commands::grpc::grpc_call,
        ])
        .run(tauri::generate_context!())
        .expect("error while running APITesterOSS");
}
```

**Key init steps:**
1. **Database init** — creates app directory, opens SQLite, enables WAL mode + foreign keys, runs migrations
2. **Plugin registration** — dialog (file pickers), shell (open URLs), clipboard-manager (copy/paste)
3. **State injection** — `DbState(Mutex<Connection>)` shared across all command handlers
4. **Command registration** — all IPC handlers declared via `generate_handler!`

### 5.3 Database Location (Platform-Specific)

| Platform | Path |
|----------|------|
| **Windows** | `%APPDATA%/api-tester-oss/api_tester.db` |
| **macOS** | `~/Library/Application Support/api-tester-oss/api_tester.db` |
| **Linux** | `~/.local/share/api-tester-oss/api_tester.db` |

### 5.4 Command Layer (IPC Handlers)

Commands are the **only** interface between frontend and backend. Each command is a `#[tauri::command]` async function:

| Command | File | Purpose |
|---------|------|---------|
| `send_request` | `commands/request.rs` | Execute HTTP request via reqwest, return `ApiResponse` |
| `get_collections` | `commands/collection.rs` | Fetch all collections |
| `create_collection` | `commands/collection.rs` | Create new collection |
| `delete_collection` | `commands/collection.rs` | Delete collection (cascade) |
| `save_request` | `commands/collection.rs` | Upsert request definition |
| `get_environments` | `commands/environment.rs` | Fetch all environments |
| `create_environment` | `commands/environment.rs` | Create new environment |
| `get_history` | `commands/history.rs` | Fetch recent history (limit 500) |
| `save_history` | `commands/history.rs` | Persist request/response pair |
| `clear_history` | `commands/history.rs` | Delete all history |
| `grpc_call` | `commands/grpc.rs` | gRPC unary call (planned) |

**Example command signature:**

```rust
#[tauri::command]
pub async fn send_request(
    method: String,
    url: String,
    headers: std::collections::HashMap<String, String>,
    body: String,
) -> Result<ApiResponse, String> { ... }
```

### 5.5 Data Model Layer

All models live in `model/mod.rs` as serde-annotated structs:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestDefinition {
    pub id: String,
    pub collection_id: Option<String>,
    pub folder_id: Option<String>,
    pub name: String,
    pub method: String,
    pub url: String,
    pub headers: String,       // JSON-serialized KeyValuePair[]
    pub query_params: String,  // JSON-serialized KeyValuePair[]
    pub body: String,          // JSON-serialized RequestBody
    pub auth: String,          // JSON-serialized AuthConfig
    pub pre_script: String,
    pub test_script: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}
```

**Design note:** Complex nested types (`headers`, `body`, `auth`) are stored as JSON strings in both SQLite and Rust structs. They are deserialized to typed structures only at the boundary where they're needed (e.g., when building the HTTP request).

### 5.6 Data Access Layer (Repository)

The repository pattern in `db/repository.rs` provides typed CRUD functions over the raw SQLite connection:

```rust
pub fn get_all_collections(conn: &Connection) -> Result<Vec<Collection>> { ... }
pub fn create_collection(conn: &Connection, name: &str, desc: &str) -> Result<Collection> { ... }
pub fn save_request(conn: &Connection, req: &RequestDefinition) -> Result<RequestDefinition> { ... }
pub fn get_all_history(conn: &Connection) -> Result<Vec<HistoryEntry>> { ... }
```

All functions return `rusqlite::Result<T>`, which command handlers map to `Result<T, String>` for IPC.

### 5.7 Planned Backend Modules

These modules are defined in the PRD but not yet implemented:

| Module | Crate | Purpose | Phase |
|--------|-------|---------|-------|
| `script/engine.rs` | boa_engine | JS runtime for pre-request & test scripts | Phase 2 |
| `script/api.rs` | — | `pm.*` API objects (variables, environment, request, response) | Phase 2 |
| `script/sandbox.rs` | — | Security sandbox (no filesystem/network access) | Phase 2 |
| `commands/websocket.rs` | tungstenite | WebSocket connect/send/receive | Phase 3 |
| `commands/graphql.rs` | reqwest | GraphQL introspection & query | Phase 2 |
| `commands/import_export.rs` | serde_json | Postman/Insomnia/Bruno import | Phase 1 (MVP) |
| `error.rs` | thiserror | Unified error type | Ongoing |

---

## 6. Data Flow

### 6.1 Request Lifecycle (Full Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REQUEST LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────┘

  User Action          Frontend Store         IPC (invoke)         Rust Backend
  ───────────          ──────────────         ────────────         ────────────

  1. Type URL
     & method    ───►  request store
                       .update()

  2. Set headers       ───►  request store
     / params /              .update()
     body / auth

  3. (Optional)        ───►  environment store
     Select env              .activeEnvironmentId

  4. Click "Send"      ───►  request store
     (Ctrl+Enter)            .isSending = true
                       ───►  variable-substitution.ts
                             substitute {{vars}} & {{$dynamic}}
                       ───►  invoke('send_request', {
                               method, url, headers, body
                             })
                                                    ───►  commands/request.rs
                                                          ::send_request()

  5.                                                   [Build reqwest client]
                                                       [Parse method]
                                                       [Attach headers]
                                                       [Attach body]
                                                       [Send HTTP request]
                                                       [Await response]

  6.                                                   [Extract status]
                                                       [Extract headers]
                                                       [Read body text]
                                                       [Parse cookies]
                                                       [Measure elapsed time]
                                                    ◄───  Result<ApiResponse, String>
                       ◄───  response store
                             .set(apiResponse)

  7. (Auto)            ───►  history store
     Save history            .add(entry)
                       ───►  invoke('save_history', {...})
                                                    ───►  commands/history.rs
                                                          ::save_history()
                                                          → repository::save_history()
                                                          → INSERT INTO history

  8. (Optional)        ───►  Script execution (planned)
     Run test script         invoke('run_test_script', {...})
                                                    ───►  script/engine.rs
                                                          [Boa executes script]
                                                          [pm.response available]
                                                          [Chai assertions run]
                                                    ◄───  TestResult[]

  9.                   ───►  request store
                             .isSending = false
                             .testResults = results

 10. Response               ResponseViewer renders:
     displayed               - Status badge (color-coded)
                             - Pretty JSON / Raw / Preview
                             - Headers table
                             - Cookies table
                             - Test results (pass/fail)
```

### 6.2 IPC Communication Pattern

All frontend-to-backend communication follows this pattern:

```typescript
// Frontend (TypeScript)
import { invoke } from '@tauri-apps/api/core';

const response = await invoke<ApiResponse>('send_request', {
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: { 'Authorization': 'Bearer xxx' },
  body: '',
});
```

```rust
// Backend (Rust)
#[tauri::command]
pub async fn send_request(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: String,
) -> Result<ApiResponse, String> {
    // ... execution ...
    Ok(api_response)
}
```

**IPC contract rules:**
1. Arguments use camelCase (matching `serde(rename_all = "camelCase")`)
2. Return type is always `Result<T, String>` — errors become rejected promises on the frontend
3. The `DbState` is injected via `tauri::State<DbState>` where needed
4. All async commands run on the Tokio runtime

### 6.3 Collection Save Flow

```
Frontend                  IPC                      Backend
─────────                 ────                     ───────

User edits request
  in RequestBuilder
       │
       ▼
  Click "Save"
       │
       ▼
  collection store
  .saveRequest(req)
       │
       ├──► invoke('save_request', { req })
       │         │
       │         ▼
       │    commands/collection.rs
       │    ::save_request(req)
       │         │
       │         ▼
       │    repository::save_request(conn, &req)
       │         │
       │         ▼
       │    INSERT INTO requests ... ON CONFLICT(id) DO UPDATE
       │         │
       │    ◄─── Result<RequestDefinition>
       │
       ▼
  collection store
  .updateRequest(saved)
```

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌─────────────────────┐         ┌──────────────────────────┐
│    collections       │         │    folders                │
│─────────────────────│         │──────────────────────────│
│ id          PK      │◄──┐    │ id              PK        │
│ name               │   │    │ collection_id   FK ───────│──► collections.id
│ description         │   └───│ parent_id       FK (self) │──► folders.id
│ created_at          │         │ name                      │
│ updated_at          │         │ sort_order                │
└─────────────────────┘         └──────────────────────────┘
          │
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│                    requests                                │
│──────────────────────────────────────────────────────────│
│ id              PK                                        │
│ collection_id   FK ──────► collections.id (CASCADE)       │
│ folder_id       FK ──────► folders.id (SET NULL)          │
│ name                                                      │
│ method                                                    │
│ url                                                       │
│ headers          TEXT (JSON: KeyValuePair[])              │
│ query_params     TEXT (JSON: KeyValuePair[])              │
│ body             TEXT (JSON: RequestBody)                 │
│ auth             TEXT (JSON: AuthConfig)                  │
│ pre_script       TEXT                                     │
│ test_script      TEXT                                     │
│ sort_order       INTEGER                                  │
│ created_at       TEXT                                     │
│ updated_at       TEXT                                     │
└──────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────────┐
│   environments       │         │    variables              │
│─────────────────────│         │──────────────────────────│
│ id          PK      │◄──┐    │ id              PK        │
│ name               │   └───│ environment_id  FK ───────│──► environments.id (CASCADE)
│ created_at          │         │ key                       │
│ updated_at          │         │ value                     │
└─────────────────────┘         │ is_secret       INTEGER   │
                                │ description               │
                                │ sort_order                │
                                └──────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    history                                 │
│──────────────────────────────────────────────────────────│
│ id                  PK                                    │
│ method              TEXT                                  │
│ url                 TEXT                                  │
│ request_body        TEXT (nullable)                       │
│ request_headers     TEXT (JSON)                           │
│ response_status     INTEGER (nullable)                    │
│ response_body       TEXT (nullable)                       │
│ response_headers    TEXT (nullable, JSON)                 │
│ response_time_ms    INTEGER (nullable)                    │
│ response_size_bytes INTEGER (nullable)                    │
│ created_at          TEXT                                  │
└──────────────────────────────────────────────────────────┘
                       INDEX: idx_history_created_at (DESC)
```

### 7.2 Schema Definition

The complete schema is defined in `src-tauri/src/db/migration.rs`:

```sql
-- Core tables
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    parent_id TEXT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    collection_id TEXT,
    folder_id TEXT,
    name TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET',
    url TEXT NOT NULL DEFAULT '',
    headers TEXT DEFAULT '[]',
    query_params TEXT DEFAULT '[]',
    body TEXT DEFAULT '{"mode":"none"}',
    auth TEXT DEFAULT '{"type":"none"}',
    pre_script TEXT DEFAULT '',
    test_script TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS environments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS variables (
    id TEXT PRIMARY KEY,
    environment_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT DEFAULT '',
    is_secret INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    request_body TEXT,
    request_headers TEXT DEFAULT '{}',
    response_status INTEGER,
    response_body TEXT,
    response_headers TEXT,
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_collection ON requests(collection_id);
CREATE INDEX IF NOT EXISTS idx_variables_environment ON variables(environment_id);
```

### 7.3 Design Decisions

| Decision | Rationale |
|----------|-----------|
| **UUID v4 as PK** | No auto-increment; safe for distributed/sync scenarios; generated in Rust via `uuid` crate |
| **JSON columns for complex fields** | `headers`, `body`, `auth` stored as JSON text — flexible schema without JOIN overhead |
| **`is_secret` as INTEGER** | SQLite has no native BOOL; 0/1 convention |
| **`ON DELETE CASCADE`** | Deleting a collection automatically removes its folders, requests, and variables |
| **`ON DELETE SET NULL`** for `folder_id` | Deleting a folder promotes its requests to collection level (doesn't lose data) |
| **WAL mode** | Write-Ahead Logging enables concurrent reads during writes; critical for responsive UI |
| **Foreign keys ON** | Enforced via `PRAGMA foreign_keys=ON` at connection time |
| **History limit 500** | `ORDER BY created_at DESC LIMIT 500` prevents unbounded growth |

### 7.4 Body JSON Schema

```json
{
  "mode": "none | json | form-data | urlencoded | binary | graphql | text",
  "json": "string (raw JSON text)",
  "formData": [{ "key": "", "value": "", "type": "text|file", "filePath": "" }],
  "urlencoded": [{ "key": "", "value": "" }],
  "graphql": { "query": "", "variables": {} },
  "text": "string",
  "binary": "file path string"
}
```

### 7.5 Auth JSON Schema

```json
{
  "type": "none | bearer | basic | oauth2 | api-key",
  "bearer": { "token": "" },
  "basic": { "username": "", "password": "" },
  "oauth2": { "clientId": "", "clientSecret": "", "tokenUrl": "", "scope": "", "accessToken": "" },
  "apiKey": { "key": "", "value": "", "in": "header|query" }
}
```

---

## 8. Security Architecture

### 8.1 Threat Model

| Threat | Mitigation |
|--------|-----------|
| Malicious script accessing filesystem | Boa engine sandbox — no `fs`, `net`, or `process` APIs exposed |
| Sensitive data (API keys) in cloud | 100% local storage; no cloud sync unless explicitly user-enabled |
| Telemetry leaking user data | Zero telemetry; no analytics SDK; no crash reporting to third parties |
| CSRF / unauthorized IPC | Tauri IPC is same-process; no HTTP server exposed to network |
| XSS in response viewer | Response body rendered as text, never injected as HTML (except explicit Preview tab with sandboxed iframe) |
| Secret variables accidentally exported | `is_secret` flag; export warnings; masked display in UI |
| Man-in-the-middle on HTTP requests | User responsibility (HTTPS recommended); planned: certificate pinning |

### 8.2 Scripting Sandbox (Planned)

```
┌─────────────────────────────────────────────┐
│              Boa JS Engine                   │
│  ┌─────────────────────────────────────────┐│
│  │          Restricted Scope                ││
│  │                                         ││
│  │  Available APIs:                        ││
│  │    pm.variables (get/set)               ││
│  │    pm.environment (get/set)             ││
│  │    pm.request (url, method, headers)    ││
│  │    pm.response (status, body, headers)  ││
│  │    pm.expect (Chai-style assertions)    ││
│  │    pm.test (name, fn)                   ││
│  │    console.log                          ││
│  │    JSON, Math, Date, String, Array      ││
│  │                                         ││
│  │  Blocked:                               ││
│  │    ❌ require / import                  ││
│  │    ❌ fetch / XMLHttpRequest            ││
│  │    ❌ fs / process / child_process      ││
│  │    ❌ eval / Function constructor       ││
│  │    ❌ window / document / DOM           ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 8.3 Data Privacy Guarantees

1. **No account required** — the app works fully offline with zero authentication
2. **No network calls except user-initiated requests** — no "phone home" for updates, analytics, or crash reports
3. **No third-party SDKs** — no Sentry, no Google Analytics, no Mixpanel
4. **Local-only storage** — all collections, environments, history in `api_tester.db` on the user's disk
5. **Secret variable protection** — `is_secret` flag masks values in UI and warns on export

### 8.4 Tauri Security Configuration

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "csp": null    // CSP disabled in dev; will be tightened for production
    }
  }
}
```

**Production hardening (planned):**
- Enable strict CSP: `default-src 'self'; script-src 'self'`
- Restrict Tauri capabilities in `capabilities/default.json`
- Enable Tauri's isolation pattern for sensitive IPC

---

## 9. Performance Architecture

### 9.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Binary size | <20MB | `ls -la` on built `.exe` / `.app` / `.deb` |
| RAM (idle) | <80MB | System profiler after 30s idle |
| Startup time | <1s | Time from launch to interactive window |
| Request overhead | <100ms | Time from `invoke` to reqwest `.send()` |
| Collection load (100 req) | <200ms | Time from DB query to tree render |
| JSON pretty print (1MB) | <50ms | Time to parse + format 1MB JSON |
| Tab switch | <16ms (60fps) | Frame time between tab activation and render |

### 9.2 Optimization Strategies

#### Frontend Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│  Strategy                    │  Implementation               │
├──────────────────────────────┼───────────────────────────────┤
│  Svelte compilation          │  No VDOM runtime; compiles    │
│  (no runtime tax)            │  to vanilla DOM operations     │
├──────────────────────────────┼───────────────────────────────┤
│  Tailwind CSS purging        │  Only used utility classes    │
│  (zero unused CSS)           │  shipped in final bundle       │
├──────────────────────────────┼───────────────────────────────┤
│  Lazy component mounting     │  Response panel only renders  │
│                              │  after first response received │
├──────────────────────────────┼───────────────────────────────┤
│  Virtual scrolling (planned) │  Collection tree >1000 items  │
│                              │  renders only visible nodes    │
├──────────────────────────────┼───────────────────────────────┤
│  Debounced search            │  300ms debounce on collection  │
│                              │  search to prevent re-renders  │
├──────────────────────────────┼───────────────────────────────┤
│  Monaco editor on-demand     │  Loaded only when Script tab   │
│  (planned)                   │  is activated                  │
└──────────────────────────────┴───────────────────────────────┘
```

#### Backend Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│  Strategy                    │  Implementation               │
├──────────────────────────────┼───────────────────────────────┤
│  SQLite WAL mode             │  Concurrent reads during      │
│                              │  writes; no reader/writer     │
│                              │  blocking                     │
├──────────────────────────────┼───────────────────────────────┤
│  Prepared statements         │  rusqlite prepares queries     │
│  (via rusqlite)              │  for repeated execution        │
├──────────────────────────────┼───────────────────────────────┤
│  reqwest connection pool     │  HTTP keep-alive; connection   │
│                              │  reuse across requests         │
├──────────────────────────────┼───────────────────────────────┤
│  Async I/O (Tokio)           │  All network I/O non-blocking; │
│                              │  UI never freezes during       │
│                              │  request execution             │
├──────────────────────────────┼───────────────────────────────┤
│  Response streaming          │  Large responses stream to     │
│  (planned)                   │  temp file instead of memory   │
├──────────────────────────────┼───────────────────────────────┤
│  History cap (500 entries)   │  Prevents unbounded DB growth  │
└──────────────────────────────┴───────────────────────────────┘
```

### 9.3 Memory Budget

```
┌────────────────────────────────────┬──────────┐
│  Component                         │  ~Memory │
├────────────────────────────────────┼──────────┤
│  Tauri shell + system WebView      │  ~30MB   │
│  Svelte app (compiled JS + CSS)    │  ~5MB    │
│  Rust runtime (Tokio + reqwest)    │  ~10MB   │
│  SQLite engine + connection        │  ~5MB    │
│  Active request/response buffers   │  ~10MB   │
│  WebView DOM + rendering           │  ~15MB   │
│  ──────────────────────────────────┼──────────┤
│  Total (target)                    │  <80MB   │
└────────────────────────────────────┴──────────┘
```

### 9.4 Benchmark Plan (Per Release)

Automated benchmarks run before each release:
- Cold startup (first launch after install)
- Warm startup (subsequent launch)
- Memory: idle, after 10 requests, after 100 requests
- Response time: local endpoint, remote endpoint, large payload (10MB JSON)
- Collection import: Postman v2.1 with 100 requests

---

## 10. Build & Deployment

### 10.1 Development Workflow

```
┌──────────────────────────────────────────────────┐
│                 DEVELOPMENT                        │
│                                                    │
│  $ npm run tauri dev                               │
│                                                    │
│  ┌──────────────┐    ┌──────────────────────────┐ │
│  │  Vite Dev    │───►│  Tauri dev shell         │ │
│  │  Server      │    │  (hot reload frontend)   │ │
│  │  :1420       │    │  (recompile Rust on      │ │
│  │              │    │   .rs file change)       │ │
│  └──────────────┘    └──────────────────────────┘ │
│                                                    │
│  Frontend HMR: instant                             │
│  Rust recompile: ~5-15s (incremental)             │
└──────────────────────────────────────────────────┘
```

### 10.2 Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server only (no Tauri) |
| `npm run build` | Build frontend to `dist/` |
| `npm run tauri dev` | Full dev: Vite + Tauri + Rust compilation |
| `npm run tauri build` | Production build: frontend + Rust → installable binary |

### 10.3 Production Build Pipeline

```
  npm run tauri build
       │
       ├──► npm run build (Vite)
       │    └──► Svelte compile → dist/
       │    └──► Tailwind purge → dist/assets/*.css
       │    └──► TypeScript → JavaScript
       │
       ├──► cargo build --release
       │    └──► Optimize Rust (LTO, opt-level=3)
       │    └──► Bundle frontend dist/ into binary
       │    └──► Link with Tauri runtime
       │
       └──► Tauri bundler
            ├──► Windows → .msi installer + .exe
            ├──► macOS   → .dmg + .app
            └──► Linux   → .deb + .AppImage + .rpm
```

### 10.4 Build Configuration

**`tauri.conf.json` key settings:**

```json
{
  "productName": "API Tester OSS",
  "version": "0.1.0",
  "identifier": "com.apitesteross.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{
      "title": "API Tester OSS",
      "width": 1280,
      "height": 800,
      "minWidth": 1024,
      "minHeight": 600,
      "resizable": true
    }]
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

### 10.5 CI/CD Pipeline (Planned)

```
  GitHub Actions
       │
       ├──► on: push to main
       │    └──► Build (Windows, macOS, Linux matrix)
       │         └──► Run tests
       │         └──► Build binary
       │         └──► Upload artifact
       │
       ├──► on: tag v*
       │    └──► Build all platforms
       │         └──► Create GitHub Release
       │         └──► Attach installers
       │         └──► Publish release notes
       │
       └──► on: PR
            └──► Run lint (clippy + eslint)
            └──► Run tests
            └──► Check binary size <20MB
            └──► Verify no telemetry
```

### 10.6 Quality Gates

Every release must pass:
- [ ] All Rust tests pass (`cargo test`)
- [ ] Clippy clean (`cargo clippy -- -D warnings`)
- [ ] TypeScript type-check (`tsc --noEmit`)
- [ ] Binary size <20MB
- [ ] Memory idle <80MB
- [ ] Startup <1s
- [ ] Dark mode renders correctly
- [ ] No telemetry leak (network audit)
- [ ] Postman v2.1 import works

---

## 11. Extension Points

### 11.1 Planned Plugin System (Phase 4)

The architecture is designed to support a plugin system without major restructuring:

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Architecture (Planned)              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Core Application                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │    │
│  │  │ Tauri    │ │ Rust     │ │ SQLite            │    │    │
│  │  │ Shell    │ │ Backend  │ │ Storage           │    │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘    │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                    │
│          ┌───────────────┼───────────────┐                   │
│          ▼               ▼               ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Theme Plugin │ │ Protocol     │ │ Importer     │         │
│  │              │ │ Plugin       │ │ Plugin       │         │
│  │ - Custom CSS │ │ - Custom     │ │ - Custom     │         │
│  │ - Custom     │ │   protocol   │ │   format     │         │
│  │   colors     │ │   handler    │ │   parser     │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Script       │ │ Code Snippet │ │ Assertion    │         │
│  │ Library      │ │ Generator    │ │ Library      │         │
│  │ Plugin       │ │ Plugin       │ │ Plugin       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Extension Surfaces

| Extension Point | Interface | Example Use Case |
|----------------|-----------|------------------|
| **Custom protocol** | Rust trait `ProtocolHandler` | Add MQTT, AMQP, or custom RPC testing |
| **Theme** | CSS variables + JSON manifest | Custom dark theme, solarized, high-contrast |
| **Importer** | `trait Importer { fn parse(&self, input: &str) -> Collection }` | Import from HAR, OpenAPI spec, curl command |
| **Code snippet generator** | `trait SnippetGenerator { fn generate(&self, req: &Request) -> String }` | Generate code in Kotlin, Swift, Ruby, PHP |
| **Assertion library** | JS module loaded into Boa sandbox | Custom assertion DSL, extended Chai matchers |
| **Script library** | Pre-built script snippets | OAuth2 token refresh, HMAC signing, JWT decode |

### 11.3 CLI Mode (Planned)

A headless collection runner for CI/CD pipelines:

```bash
# Run a collection from CLI
api-tester run --collection my-collection.json --environment dev.json

# Output as JSON report
api-tester run --collection my-collection.json --format json --output report.json

# Exit code based on test results
api-tester run --collection my-collection.json --fail-on-error
```

### 11.4 VS Code Extension (Planned)

Reuse the Svelte components as a VS Code webview extension:
- Shared `lib/stores/` and `lib/utils/` between desktop and VS Code
- Tauri commands replaced with VS Code extension API calls
- Same TypeScript types for consistency

### 11.5 Future Protocol Support

| Protocol | Crate | Priority | Notes |
|----------|-------|----------|-------|
| WebSocket | tungstenite | High (Phase 3) | Real-time API testing |
| gRPC | tonic | High (Phase 3) | Unary + streaming |
| SSE | reqwest (streaming) | Medium (Phase 3) | Event stream listener |
| GraphQL | reqwest + introspection | Medium (Phase 2) | Schema-aware query builder |
| MQTT | rumqttc | Low | IoT protocol testing |
| AMQP | lapin | Low | Message queue testing |

---

## Appendix A: File-to-Feature Mapping

| Feature | Frontend Files | Backend Files |
|---------|---------------|---------------|
| REST request | `RequestBuilder.svelte`, `ParamsEditor.svelte`, `HeadersEditor.svelte`, `RequestBody.svelte`, `PathVariables.svelte`, `stores/request.ts` | `commands/request.rs`, `model/mod.rs` |
| Response viewing | `ResponseViewer.svelte`, `stores/request.ts` | `commands/request.rs` (`ApiResponse`) |
| Collections | `CollectionBrowser.svelte`, `CollectionRunner.svelte`, `stores/collection.ts` | `commands/collection.rs`, `db/repository.rs` |
| Environments | `EnvironmentManager.svelte`, `stores/environment.ts`, `utils/variable-substitution.ts` | `commands/environment.rs`, `db/repository.rs` |
| History | `HistoryPanel.svelte`, `stores/history.ts` | `commands/history.rs`, `db/repository.rs` |
| Auth | `AuthPanel.svelte` | (handled in frontend; headers sent to backend) |
| Import | `ImportModal.svelte`, `utils/postman-importer.ts` | (planned: `commands/import_export.rs`) |
| Code snippets | `CodeSnippetModal.svelte`, `utils/code-snippets.ts` | (frontend-only) |
| gRPC | `GRPCPanel.svelte` | `commands/grpc.rs` (stub) |
| WebSocket | `WebSocketPanel.svelte` | (planned: `commands/websocket.rs`) |
| SSE | `SSEPanel.svelte` | (planned) |
| Scripting | `ScriptEditor.svelte` | (planned: `script/` module) |

## Appendix B: IPC Command Reference

| Command | Arguments | Returns | Status |
|---------|-----------|---------|--------|
| `send_request` | `method`, `url`, `headers`, `body` | `ApiResponse` | ✅ Implemented |
| `get_collections` | — | `Collection[]` | ✅ Implemented |
| `create_collection` | `name`, `description` | `Collection` | ✅ Implemented |
| `delete_collection` | `id` | `()` | ✅ Implemented |
| `save_request` | `RequestDefinition` | `RequestDefinition` | ✅ Implemented |
| `get_environments` | — | `Environment[]` | ✅ Implemented |
| `create_environment` | `name` | `Environment` | ✅ Implemented |
| `get_history` | — | `HistoryEntry[]` | ✅ Implemented |
| `save_history` | `HistoryEntry` | `()` | ✅ Implemented |
| `clear_history` | — | `()` | ✅ Implemented |
| `grpc_call` | — | — | 🔲 Stub |
| `cancel_request` | — | — | 🔲 Planned |
| `run_test_script` | `script`, `response` | `TestResult[]` | 🔲 Planned |
| `connect_websocket` | `url` | `WebSocketHandle` | 🔲 Planned |
| `send_websocket_message` | `handle`, `message` | `()` | 🔲 Planned |

---

*This document is a living reference. Update it whenever architectural decisions change or new modules are added.*
