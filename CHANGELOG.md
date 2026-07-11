# Changelog

All notable changes to **API Tester OSS** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

- **Repository:** https://github.com/apitesteross/apitesteross
- **Releases:** https://github.com/apitesteross/apitesteross/releases
- **Roadmap:** https://github.com/apitesteross/apitesteross/milestones

## Guide

Each release groups changes into the following categories, as recommended by
Keep a Changelog:

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** for vulnerability fixes and hardening.

---

## [Unreleased]

Planned for upcoming releases. Items may shift between milestones as
development progresses.

### Added (planned)

- **GraphQL introspection** — automatic schema discovery, query autocompletion,
  and field-level documentation panel.
- **gRPC streaming** — unary, server-streaming, client-streaming, and
  bidirectional streaming calls with live message log and `.proto` import.
- **WebSocket client** — connect, send/receive text and binary frames, ping/pong
  heartbeat, and reconnect strategies with backoff.
- **Scripting engine (Boa)** — pre-request and post-response JavaScript scripts
  executed in an embedded Boa runtime (no Node, no network egress) for
  variable generation, assertions, and chained requests.
- **OAuth 2.0 flow** — Authorization Code (with PKCE), Implicit, Password, and
  Client Credentials grants; token auto-refresh and scope management.
- **Server-Sent Events (SSE)** — persistent EventSource listener with event
  filtering, reconnection, and export of captured events.

### Changed (planned)

- Refactor request pipeline into a pluggable transport layer to unify
  REST, GraphQL, gRPC, WebSocket, and SSE under one execution model.

---

## [0.1.0] - 2026-07-10

Initial MVP release. First public, stable build of API Tester OSS.

### Added

#### REST API Client
- Full HTTP method support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`,
  `OPTIONS`.
- Query parameters editor with bulk-paste (one `key=value` per line).
- Path variables with auto-detection from URL segments (`{{id}}`).
- Custom headers editor with common-value presets.
- Configurable request timeout and redirect policy.
- Cancel-in-flight support via `AbortController`.

#### Request Body Types
- **JSON** — syntax-highlighted editor with schema validation and formatting.
- **Form-Data (multipart)** — file upload and text fields, boundary handling.
- **URL-Encoded** — key/value pairs editor.
- **Text** — raw body with configurable `Content-Type`.
- **Binary** — file attachment with mime detection.
- **GraphQL** — query, variables, and operation name editor.

#### Authentication
- **Bearer Token** — static or variable-substituted tokens.
- **Basic Auth** — username/password with Base64 encoding.
- **API Key** — header or query parameter placement.
- Auth headers are redacted in history and exports by default.

#### Collections & Folders
- Full CRUD for collections and nested folders.
- Drag-and-drop reordering and nesting.
- Per-request notes and tags.
- Collection-level variables and auth inheritance.

#### Environments & Variables
- Multiple environments (e.g., `dev`, `staging`, `prod`) with one-click switch.
- `{{variable}}` substitution across URL, headers, body, and auth.
- Dynamic variables: `{{$guid}}`, `{{$timestamp}}`, `{{$randomInt}}`,
  `{{$randomString}}`.
- Secret variables: masked in UI, excluded from exports and logs.

#### Response Viewer
- **Pretty JSON** — collapsible tree view with syntax highlighting.
- **Raw** — unformatted response body.
- **Headers** — response headers table with search.
- **Cookies** — parsed `Set-Cookie` entries.
- **Preview** — rendered HTML and image responses.
- Response time, size, and status breakdown panel.

#### History
- Auto-save of every executed request.
- Date grouping: Today, Yesterday, This Week, This Month, Older.
- Full-text search across URL, method, and status.
- One-click replay from history with original parameters.

#### Import
- **Postman Collection v2.1** — full schema support including auth and
  variables.
- **Insomnia Export v4** — workspace, environments, and requests.
- **Bruno Collection** — `.bru` file parsing.
- Smart conflict resolution with duplicate detection.

#### Export
- Collection export to JSON (Postman v2.1-compatible schema).
- Environment export as a standalone JSON file.
- Secret variables excluded from all exports unless explicitly opted in.

#### Code Snippets
- One-click request-to-code generation for:
  - **cURL**
  - **JavaScript** (`fetch`)
  - **Python** (`requests`)
  - **Go** (`net/http`)
  - **Rust** (`reqwest`)
  - **Java** (`HttpClient`)
- Copy-to-clipboard with formatting options.

#### User Experience
- **Dark / Light mode** with system preference detection and manual override.
- **Keyboard shortcuts** for common actions (send request, save, new tab,
  switch environment, toggle theme).
- Tabbed interface for concurrent request editing.
- Resizable panels for request/response split view.

#### Storage & Platform
- **SQLite local storage** — all collections, environments, history, and
  settings persisted on-device via Tauri's SQL plugin. No external database.
- **Tauri 2.x native desktop** — single binary under 20 MB, RAM footprint
  under 80 MB. Bundled for Windows, macOS, and Linux.

### Security

- All data (requests, responses, secrets) stored locally in an
  application-scoped SQLite database; no telemetry, no analytics, no cloud
  sync.
- Secret variables are masked in the UI and excluded from exports by default.

---

<!-- Link references for Semantic Versioning anchors -->

[Unreleased]: https://github.com/apitesteross/apitesteross/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/apitesteross/apitesteross/releases/tag/v0.1.0
