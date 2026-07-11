# PRD: API Tester OSS — Native API Client

> **Version:** 1.0  
> **Status:** Draft  
> **Author:** Product Team  
> **Last Updated:** 2026-07-10

---

## 1. EXECUTIVE SUMMARY

**API Tester OSS** adalah aplikasi desktop native lintas platform yang dirancang sebagai alternatif ringan, cepat, dan open source untuk Postman, Insomnia, dan API client sejenis. Tidak seperti kompetitor yang dibangun di atas Electron (mengonsumsi >200MB RAM dan >200MB disk), API Tester menggunakan **Tauri 2.x** dengan backend Rust dan frontend Svelte — menghasilkan binary <20MB dengan konsumsi memori <80MB.

Aplikasi ini mendukung pengujian **REST**, **GraphQL**, **gRPC**, dan **WebSocket** API dalam satu antarmuka yang koheren. Semua data disimpan lokal di SQLite — tidak ada cloud pihak ketiga, tidak perlu login, tidak ada telemetri paksa. Scripting pre-request dan post-response menggunakan JavaScript dengan built-in Chai assertion library.

Target MVP (30 hari) mencakup REST request builder, collections, environment variables, response viewer, dan import Postman collection. Fase berikutnya menambahkan GraphQL introspection, gRPC streaming, WebSocket real-time, dan scripting engine.

---

## 2. PROBLEM STATEMENT

### 2.1 Masalah Utama

| Problem | Dampak |
|---------|--------|
| **Postman terlalu berat** | >200MB install, >300MB RAM, boot lambat, bikin laptop lemot |
| **Postman butuh login** | Tidak bisa pakai offline, data di cloud, privasi terancam |
| **Insomnia diakuisisi Kong** | Masa depan tidak jelas, fitur mulai dibatasi, enterprise lock-in |
| **Insomnia pake Electron** | Sama beratnya dengan Postman, meski lebih ringan dikit |
| **Tidak ada native+ringan+multiprotokol** | Semua API client besar pake Electron, yang native cuma Paw (Mac, berbayar) |
| **API key di cloud** | Environment variable sensitive (API key, token) disimpan di server Postman/Insomnia |
| **gRPC dan WebSocket mahal** | Postman gRPC berbayar, Insomnia gRPC terbatas |

### 2.2 Market Gap

Analisis 5 API client terpopuler:

- **Postman**: Dominan pasar, tapi makin bloat dan closed-source. Banyak developer beralih.
- **Insomnia**: Open source core, tapi diakuisisi Kong, arah pengembangan tidak transparan.
- **Bruno**: Open source bagus, offline-first, tapi belum support gRPC/WebSocket. Pake Electron juga.
- **HTTPie**: CLI-focused, desktop masih beta. Tidak support gRPC.
- **Hoppscotch**: Web-based, butuh browser, tidak native, tidak support gRPC.
- **Paw**: Native (Swift), terbaik, tapi Mac-only dan berbayar $50/thn.

**Gap yang jelas**: Tidak ada API client yang (1) native/ringan, (2) gratis & open source, (3) support REST + GraphQL + gRPC + WebSocket, (4) offline-first, (5) lintas platform (Windows/Mac/Linux).

### 2.3 Why Now?

- **Migrasi massal dari Postman**: Komunitas developer mulai bosan dengan Postman yang makin berat dan berbayar.
- **Bruno menunjukkan demand**: Bruno mendapat 30K+ GitHub stars dalam 2 tahun karena "offline-first" dan "no login". Ini validasi bahwa developer menginginkan alternatif.
- **Tauri matang**: Tauri 2.0 sudah stable, performa native, ukuran kecil. Memungkinkan aplikasi Rust dengan UI web yang ringan.
- **gRPC makin populer**: Microservice communication, BFF pattern, dan service mesh semua pake gRPC. Alat testing gRPC masih kurang.
- **WebSocket real-time**: Real-time API makin umum (chat, notifikasi, live data). Butuh client khusus.

---

## 3. TARGET USERS

### 3.1 Persona

#### Backend Developer (Primary)
- **Usia**: 25-40 tahun
- **Pekerjaan**: Mengembangkan REST/GraphQL/gRPC API
- **Pain**: Postman berat, butuh gRPC testing, pengen alat ringan yang bisa dipake sehari-hari
- **Kebutuhan**: Request cepat, response viewer bagus, collection management, environment variable, script testing
- **Daily workflow**: Nulis API → test dengan berbagai parameter → debug response → iterasi

#### Frontend Developer
- **Usia**: 22-35 tahun
- **Pekerjaan**: Integrasi API dari frontend (React/Vue/Angular)
- **Pain**: Cuma butuh test endpoint, males buka Postman yang berat
- **Kebutuhan**: Simple request builder, response preview, copy as fetch
- **Daily workflow**: Cek endpoint → lihat response → copy code snippet

#### QA Engineer
- **Usia**: 25-45 tahun
- **Pekerjaan**: Manual/automation testing API
- **Pain**: Butuh run collection, compare response, export test result
- **Kebutuhan**: Batch run, assertion, environment switching, report
- **Daily workflow**: Setup environment → run collection → verify assertion → log bug

#### API Integrator
- **Usia**: 25-50 tahun
- **Pekerjaan**: Integrasi API pihak ketiga (payment, SMS, email, dll)
- **Pain**: Banyak API key, banyak environment (dev/staging/prod), gampang salah
- **Kebutuhan**: Multiple environment, variable substitution, history
- **Daily workflow**: Ganti environment → test → ganti API key → test lagi

#### Mobile Developer
- **Usia**: 22-35 tahun
- **Pekerjaan**: Develop iOS/Android apps
- **Pain**: Sering gonta-ganti endpoint, butuh response dalam format JSON/XML
- **Kebutuhan**: Request builder cepat, response raw view, copy response
- **Daily workflow**: Test endpoint → lihat response → coding di Xcode/Android Studio

### 3.2 Target Market Size
- **Total developer API testers**: ~15M globally
- **Postman users**: ~20M registered, ~5M active daily
- **Addressable market**: 2M developers looking for lightweight alternative
- **Early adopters**: 50K-100K developers in first year

---

## 4. USER STORIES

### 4.1 REST API Testing

**US-001: Basic GET Request**
> Sebagai backend developer, saya ingin mengirim GET request ke endpoint REST dan melihat response JSON yang diformat dengan rapi, agar saya bisa memverifikasi API saya berfungsi.

**Acceptance Criteria:**
- Bisa input URL dan kirim GET request
- Response ditampilkan dalam format pretty-print JSON dengan syntax highlighting
- Response time dan status code ditampilkan
- Bisa copy response ke clipboard

---

**US-002: POST with JSON Body**
> Sebagai frontend developer, saya ingin mengirim POST request dengan JSON body dan header Authorization untuk menguji endpoint yang memerlukan autentikasi.

**Acceptance Criteria:**
- Bisa pilih method POST
- Body editor dengan JSON syntax highlighting dan auto-format
- Header editor key-value
- Bisa save sebagai Bearer/ApiKey auth

---

**US-003: Form Data Upload**
> Sebagai QA engineer, saya ingin mengirim multipart form-data termasuk file upload untuk menguji endpoint upload gambar.

**Acceptance Criteria:**
- Bisa tambah key-value dengan tipe text dan file
- File picker dialog untuk pilih file
- Content-Type otomatis multipart/form-data

---

### 4.2 Collections & Environments

**US-004: Collection Management**
> Sebagai backend developer, saya ingin mengelompokkan request dalam folder collection agar workflow testing tetap terorganisir.

**Acceptance Criteria:**
- Bisa create collection dengan nama
- Bisa create folder di dalam collection
- Drag-and-drop reorder
- Export/import collection JSON
- Search/filter dalam collection

---

**US-005: Environment Variables**
> Sebagai API integrator, saya ingin menggunakan environment variables ({{base_url}}, {{token}}) di URL, headers, dan body agar gampang switching antara dev/staging/prod.

**Acceptance Criteria:**
- Bisa create environment (dev, staging, prod)
- Key-value variable dengan description
- Variable otomatis tersubstitusi di URL, headers, body
- Active environment indicator
- Quick switch antar environment

---

**US-006: Dynamic Variables**
> Sebagai QA engineer, saya ingin menggunakan dynamic variable seperti {{$guid}}, {{$timestamp}}, {{$randomEmail}} untuk generate data test secara otomatis.

**Acceptance Criteria:**
- Built-in dynamic variable: $guid, $timestamp, $randomInt, $randomEmail, $randomString
- Variable di-substitute saat request dikirim
- User bisa membuat custom dynamic variable via script

---

### 4.3 Scripting & Testing

**US-007: Pre-request Scripts**
> Sebagai backend developer, saya ingin menjalankan JavaScript sebelum request dikirim untuk menyiapkan data atau menghitung signature.

**Acceptance Criteria:**
- Script editor dengan syntax highlighting
- Akses ke pm.variables, pm.environment, pm.request
- Bisa set variable dari script
- Console.log output visible di panel

---

**US-008: Test Scripts with Assertions**
> Sebagai QA engineer, saya ingin menulis test script yang menjalankan assertion terhadap response untuk otomatis memvalidasi hasil.

**Acceptance Criteria:**
- Test script berjalan setelah response diterima
- Built-in Chai assertion library (expect, should, assert)
- Akses ke pm.response, pm.expect
- Test result: pass/fail dengan detail
- Summary bar: berapa test passed/failed

---

**US-009: Run Collection (Batch)**
> Sebagai QA engineer, saya ingin menjalankan semua request dalam collection secara berurutan agar bisa melakukan regression test cepat.

**Acceptance Criteria:**
- Run button di level collection
- Progress bar: request x dari y
- Hasil per-request: status, time, test pass/fail
- Export result sebagai JSON/HTML report
- Stop/cancel running collection

---

### 4.4 Advanced Protocols

**US-010: GraphQL Query**
> Sebagai frontend developer, saya ingin mengirim GraphQL query dan melihat response dengan dukungan schema introspection.

**Acceptance Criteria:**
- GraphQL endpoint support
- Query editor dengan syntax highlighting
- Variables editor (JSON)
- Schema introspection: docs, types, fields
- Response sesuai struktur query

---

**US-011: gRPC Unary & Streaming**
> Sebagai backend developer, saya ingin menguji gRPC endpoint (unary dan server streaming) dengan import proto file.

**Acceptance Criteria:**
- Import .proto file
- List service dan method
- Input request message (JSON)
- Response message ditampilkan
- Server streaming: messages muncul real-time
- Metadata support

---

**US-012: WebSocket Real-Time**
> Sebagai mobile developer, saya ingin terhubung ke WebSocket server dan mengirim/menerima pesan real-time.

**Acceptance Criteria:**
- Connect ke ws:// atau wss:// URL
- Send message (JSON, text)
- Message log dengan timestamp
- Filter log (sent/received/all)
- Auto-reconnect option
- Export log

---

**US-013: Import from Postman/Insomnia/Bruno**
> Sebagai developer yang migrasi dari Postman, saya ingin import collection Postman (v2.1) agar tidak perlu membuat ulang dari awal.

**Acceptance Criteria:**
- Import Postman collection JSON (v2.1)
- Import Insomnia JSON export
- Import Bruno collection
- Mapping: auth, variables, scripts terkonversi dengan benar
- Error report untuk item yang tidak bisa di-import

---

**US-014: History & Recents**
> Sebagai backend developer, saya ingin melihat history request yang pernah saya kirim agar bisa mengulang request tanpa menyusun ulang.

**Acceptance Criteria:**
- History otomatis menyimpan setiap request yang dikirim
- Group by date (Today, Yesterday, Last 7 Days, Older)
- Search history by URL/method
- One-click repeat dari history
- Clear history

---

### 4.5 Productivity

**US-015: Code Snippet Generation**
> Sebagai frontend developer, saya ingin generate code snippet dari request yang sudah jadi agar bisa langsung paste ke kode aplikasi.

**Acceptance Criteria:**
- Generate cURL, Python, JavaScript (fetch), Java (OkHttp), Go, Rust
- Include headers dan body
- Copy to clipboard
- Format rapi

---

**US-016: Keyboard Shortcuts**
> Sebagai power user, saya ingin menggunakan keyboard shortcuts untuk mempercepat workflow testing API.

**Acceptance Criteria:**
- Ctrl+Enter: Send request
- Ctrl+S: Save request
- Ctrl+Shift+S: Save As
- Ctrl+[ / ]: Navigasi history
- Ctrl+Shift+E: Switch environment
- Ctrl+Shift+C: Copy as cURL
- Fully customizable

---

## 5. FITUR DETAIL

### 5.1 Request Builder

#### URL Bar
- Input URL dengan auto-complete dari history
- Method selector dropdown (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Send button (biru) dengan keyboard shortcut Ctrl+Enter
- Icon loading animasi saat request berlangsung
- Cancel button untuk membatalkan request

#### Path Variables
- Deteksi otomatis `:param` dalam URL
- Form input untuk setiap path variable
- Contoh: `/api/users/:id` → muncul input `id`

#### Query Parameters
- Table editor: key | value | description | checkbox (enable/disable)
- Bulk edit mode: paste key=value
- Sortable rows
- Auto-encode URL

#### Headers
- Table editor: key | value | description | checkbox
- Built-in header presets: Content-Type, Authorization, Accept, Cache-Control
- Auto-generated headers: Content-Type, Host
- Hidden headers toggle

#### Body Editor
- **JSON**: Monaco editor dengan syntax highlighting, validation, auto-format
- **Form-Data**: Key-value table dengan file picker
- **x-www-form-urlencoded**: Key-value table
- **Binary**: File picker (image, PDF, ZIP)
- **GraphQL**: Tab query + tab variables
- **Plain Text**: Text editor
- **none**: No body
- Content-Type header berubah otomatis sesuai body type

#### Authentication
- **Bearer Token**: Input token
- **Basic Auth**: Input username + password (otomatis base64)
- **OAuth 2.0**: Client ID, Client Secret, Token URL, Scope → Get New Token
- **API Key**: Key + Value + location (Header / Query)
- Auth headers otomatis ditambahkan ke headers table
- Bisa override manual di headers table

### 5.2 Response Viewer

#### Layout
- Panel response terdiri dari tab: **Pretty**, **Raw**, **Preview**, **Headers**, **Cookies**, **Test Results**
- Sidebar response metadata: Status code (badge warna), Response Time, Response Size

#### Pretty View
- **JSON**: Tree view collapsible + syntax highlighting, search dalam JSON
- **XML**: Formatted with indentation
- **HTML**: Rendered preview
- Auto-detect content type
- Copy node path (JSON)

#### Raw View
- Plain text dengan monospace font
- Word wrap toggle
- Line numbers
- Search & highlight

#### Preview
- **Image**: Render image (PNG, JPG, GIF, SVG)
- **PDF**: Embed PDF viewer
- **HTML**: Render iframe
- Fallback: "Preview not available"

#### Headers View
- Table: key | value
- Sort by name
- Copy all headers
- Flag untuk security headers (X-Frame-Options, CSP, dll)

#### Cookies View
- Table: name | value | domain | path | expires
- Parsed dari Set-Cookie header
- Copy cookie string

#### Status Code Badges
- Warna semantic:
  - 2xx: Hijau
  - 3xx: Biru
  - 4xx: Kuning/Orange
  - 5xx: Merah
- Text: "200 OK", "404 Not Found", dll

#### Response Metadata
- Response time (ms)
- Response size (bytes/KB/MB)
- Timestamp request dikirim

### 5.3 Collections & Environments

#### Collections
- **Tree view**: Collection → Folder → Request dengan struktur hirarkis
- **Drag-and-drop**: Reorder, move antar folder
- **Context menu**: Rename, Duplicate, Delete, Export, Run
- **Badge**: Jumlah request dalam collection
- **Search**: Cepat cari request berdasarkan nama
- **Sort**: By name, by last modified
- **Import**: Postman v2.1, Insomnia v4, Bruno

#### Environment Manager
- **List**: Dev, Staging, Prod
- **Variable editor**: Key | Value | Type (default/secret) | Description
- **Secret type**: Input masked, tidak ikut export
- **Variable substitution**: `{{key}}` di URL, headers, body
- **Nested variable**: `{{user.id}}` (dot notation)
- **Dynamic variable**: `{{$guid}}`, `{{$timestamp}}`, `{{$randomEmail}}`, `{{$randomInt}}`, `{{$randomString}}`
- **JSON/Env export**: Share environment antar tim via file

### 5.4 Testing & Scripts

#### Script Engine
- JavaScript runtime berbasis **Boa** (Rust) — safe, fast, tanpa perlu embed V8
- Event lifecycle:
  1. Environment variable substitution
  2. Pre-request script execution
  3. Dynamic variable substitution
  4. Send request
  5. Receive response
  6. Test script execution

#### Pre-request Script API
```js
// Set variables
pm.variables.set("key", "value");
pm.environment.set("key", "value");

// Access request
pm.request.url.toString();
pm.request.method;
pm.request.headers.each(h => console.log(h.key, h.value));
pm.request.body.toString();

// Logging
console.log("debug info");
```

#### Test Script API
```js
// Chai expectation
pm.expect(pm.response.statusCode).to.equal(200);
pm.expect(pm.response.json().data).to.be.an('array');
pm.expect(pm.response.responseTime).to.be.below(500);

// Extract variable
pm.variables.set("userId", pm.response.json().data.id);

// Check header
pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');

// Multiple tests
pm.test("Status code is 200", () => {
  pm.expect(pm.response.statusCode).to.equal(200);
});

pm.test("Response has data", () => {
  pm.expect(pm.response.json().data).to.exist;
});
```

#### Test Result
- **Pass**: Hijau (✓)
- **Fail**: Merah (✗) dengan error message
- **Total**: X passed, Y failed dari Z tests
- **Summary bar**: Visual progress

### 5.5 Advanced Protocols

#### GraphQL
- Tab Query: Monaco editor dengan syntax highlighting GraphQL
- Tab Variables: JSON editor
- Schema introspection otomatis (send `__schema` query)
- Sidebar Docs: Types, Fields, Arguments
- Autocomplete dari schema
- Response sesuai struktur query

#### gRPC
- Import .proto file (drag-drop atau file picker)
- List services dan methods dalam sidebar
- Pilih method → generate input template
- Input request dalam format JSON (convert ke protobuf internally)
- **Unary**: Request → Response
- **Server Streaming**: Response stream real-time
- **Client Streaming**: Kirim multiple messages
- **Bidirectional Streaming**: Full duplex
- Metadata editor (key-value)
- TLS support

#### WebSocket
- URL input dengan ws:// atau wss://
- Connect/Disconnect button
- Message input: Text / JSON
- Send button
- Message log: timestamp | direction (▶ sent, ◀ received) | content
- Filter: All, Sent, Received
- Clear log
- Export log (.txt, .json)
- Auto-reconnect toggle
- Ping/Pong

#### SSE (Server-Sent Events)
- URL input
- Connect/Disconnect
- Event log: event name | data | id | timestamp
- Auto-reconnect

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Desktop Framework** | Tauri 2.x | Native binary, small size, secure |
| **Frontend** | Svelte 5 + TailwindCSS 4 | Bundle terkecil (~15KB runtime), reactivity modern |
| **Backend/Rust** | reqwest, tungstenite, tonic, boa_engine | HTTP, WebSocket, gRPC, scripting |
| **Database** | SQLite via rusqlite | Local, zero-config, reliable |
| **State Management** | Svelte stores / runes | Built-in, no extra library |
| **Code Editor** | Monaco Editor (via web component) | Sama dengan VS Code, powerful |
| **Tray/System** | tauri-plugin-sql, tauri-plugin-shell, tauri-plugin-dialog | Plugin ekosistem Tauri |

### 6.2 Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────┐
│                   Tauri Shell                         │
│  ┌───────────────────────────────────────────────┐   │
│  │           Frontend (Svelte + Tailwind)          │   │
│  │  ┌──────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │Request│ │Collection│ │Response│ │Script  │  │   │
│  │  │Builder│ │  Browser │ │Viewer  │ │Editor  │  │   │
│  │  └──────┘ └──────────┘ └────────┘ └────────┘  │   │
│  └────────────────────────────────────────────────┘   │
│                        │ IPC (invoke)                  │
│  ┌────────────────────────────────────────────────┐   │
│  │              Rust Backend                       │   │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │reqwest │ │tungstenite│ │  tonic   │          │   │
│  │  │(HTTP)  │ │(WebSocket)│ │ (gRPC)   │          │   │
│  │  └────────┘ └──────────┘ └──────────┘          │   │
│  │  ┌────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │boengine│ │ rusqlite │ │ Import/Export    │  │   │
│  │  │(Script)│ │ (SQLite)  │ │ (Postman/Bruno) │  │   │
│  │  └────────┘ └──────────┘ └──────────────────┘  │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 6.3 Rust Crate Structure

```
api-tester/
├── src-tauri/
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs              # Entry point, Tauri builder
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── request.rs        # handle_send_request, cancel_request
│   │   │   ├── collection.rs     # CRUD collections, folders, requests
│   │   │   ├── environment.rs    # CRUD environments, variables
│   │   │   ├── history.rs        # Query/clear history
│   │   │   ├── import_export.rs  # Postman/Insomnia/Bruno import
│   │   │   ├── graphql.rs        # Introspection, query
│   │   │   ├── grpc.rs           # Proto import, call
│   │   │   └── websocket.rs      # Connect, send, receive
│   │   ├── model/
│   │   │   ├── mod.rs
│   │   │   ├── request.rs        # RequestDefinition, RequestMethod, etc
│   │   │   ├── collection.rs     # Collection, Folder, CollectionItem
│   │   │   ├── environment.rs    # Environment, Variable
│   │   │   ├── response.rs       # ApiResponse, Cookie, Header
│   │   │   └── history.rs        # HistoryEntry
│   │   ├── script/
│   │   │   ├── mod.rs
│   │   │   ├── engine.rs         # Boa engine wrapper
│   │   │   ├── api.rs            # pm.* objects
│   │   │   └── sandbox.rs        # Secure execution
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── migration.rs      # Schema migration
│   │   │   └── repository.rs     # Data access layer
│   │   └── error.rs              # Unified error type
├── src/
│   ├── App.svelte
│   ├── main.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── RequestBuilder.svelte
│   │   │   ├── ResponseViewer.svelte
│   │   │   ├── CollectionBrowser.svelte
│   │   │   ├── EnvironmentManager.svelte
│   │   │   ├── ScriptEditor.svelte
│   │   │   ├── HistoryPanel.svelte
│   │   │   └── ...
│   │   ├── stores/
│   │   │   ├── request.ts
│   │   │   ├── collection.ts
│   │   │   ├── environment.ts
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── variable-substitution.ts
│   │   │   ├── code-snippets.ts
│   │   │   └── ...
│   │   └── types.ts
└── package.json
```

### 6.4 Key Design Decisions

1. **Tauri instead of Electron**: Binary 100x lebih kecil, RAM 4x lebih hemat, akses sistem native (file dialog, tray icon) tanpa bloat.
2. **Boa instead of V8**: V8 terlalu besar untuk di-bundle dalam binary Rust. Boa adalah JavaScript engine murni Rust, cukup untuk ES5 dan sebagian ES6 yang dibutuhkan untuk script testing.
3. **SQLite instead of JSON file**: Collection besar butuh query cepat, pencarian, dan relasi. SQLite memberikan performa database tanpa perlu server.
4. **IPC invoke instead of HTTP localhost**: Komunikasi frontend-backend via Tauri invoke, tanpa overhead HTTP server. Lebih aman dan cepat.
5. **Svelte instead of React/Vue**: Svelte compiled, tidak perlu runtime virtual DOM. Bundle size terkecil, performa rendering terbaik.

### 6.5 Security Architecture

- **Sandbox scripting**: Boa dijalankan dalam sandbox tanpa akses ke filesystem atau network. Hanya API pm.* yang tersedia.
- **No telemetry**: Aplikasi tidak mengirim data apapun ke internet selain request yang dibuat user.
- **Local storage**: Semua data disimpan lokal. Tidak ada cloud sync kecuali diaktifkan user.
- **Git ignore**: Environment dengan secret variable memiliki warning eksplisit.
- **Auto-delete history**: Opsi auto-delete setelah N hari.

---

## 7. DATA MODEL

### 7.1 Entity Relationship Diagram (Text)

```
┌─────────────┐       ┌──────────────────┐
│  Collection  │       │  Folder           │
│─────────────│       │──────────────────│
│ id          │──┐    │ id               │
│ name        │  │    │ name             │
│ description │  │    │ collection_id ───│── FK to Collection
│ created_at  │  │    │ parent_id ───────│── FK to Folder (self)
│ updated_at  │  │    │ sort_order       │
└─────────────┘  │    └──────────────────┘
                 │    ┌────────────────────────────────┐
                 │    │  Request                        │
                 │    │────────────────────────────────│
                 └───│ id                              │
                      │ collection_id ─────────────────│── FK
                      │ folder_id (nullable) ─────────│── FK
                      │ name                           │
                      │ method (enum)                  │
                      │ url                            │
                      │ headers (JSON)                 │
                      │ query_params (JSON)            │
                      │ body (JSON)                    │
                      │ auth (JSON)                    │
                      │ pre_script (text)              │
                      │ test_script (text)             │
                      │ sort_order                     │
                      │ created_at                     │
                      │ updated_at                     │
                      └────────────────────────────────┘
┌──────────────────┐  ┌────────────────────────────────┐
│  Environment      │  │  History                       │
│──────────────────│  │────────────────────────────────│
│ id               │  │ id                              │
│ name             │  │ method                          │
│ created_at       │  │ url                             │
│ updated_at       │  │ request_body (JSON, nullable)   │
└──────────────────┘  │ request_headers (JSON)           │
       │               │ response_status (int)           │
       │               │ response_body (text)            │
       │               │ response_headers (JSON)          │
       │               │ response_time_ms (int)          │
       │               │ response_size_bytes (int)       │
       │               │ created_at                      │
       │               └────────────────────────────────┘
       │
┌──────────────────┐
│  Variable         │
│──────────────────│
│ id               │
│ environment_id ──│── FK to Environment
│ key              │
│ value (encrypted)│
│ is_secret (bool) │
│ description      │
│ sort_order       │
└──────────────────┘
```

### 7.2 Request Body JSON Schema

```json
{
  "type": "object",
  "properties": {
    "mode": { "type": "string", "enum": ["none", "json", "form-data", "urlencoded", "binary", "graphql", "text"] },
    "json": { "type": "object" },
    "formData": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": { "type": "string" },
          "value": { "type": "string" },
          "type": { "type": "string", "enum": ["text", "file"] },
          "filePath": { "type": "string" }
        }
      }
    },
    "urlencoded": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": { "type": "string" },
          "value": { "type": "string" }
        }
      }
    },
    "graphql": {
      "type": "object",
      "properties": {
        "query": { "type": "string" },
        "variables": { "type": "object" }
      }
    },
    "text": { "type": "string" },
    "binary": { "type": "string", "description": "file path" }
  }
}
```

### 7.3 Auth JSON Schema

```json
{
  "type": "object",
  "properties": {
    "type": { "type": "string", "enum": ["none", "bearer", "basic", "oauth2", "api-key"] },
    "bearer": { "type": "object", "properties": { "token": { "type": "string" } } },
    "basic": { "type": "object", "properties": { "username": { "type": "string" }, "password": { "type": "string" } } },
    "oauth2": { "type": "object", "properties": {
      "clientId": { "type": "string" },
      "clientSecret": { "type": "string" },
      "tokenUrl": { "type": "string" },
      "scope": { "type": "string" },
      "accessToken": { "type": "string" }
    } },
    "apiKey": { "type": "object", "properties": {
      "key": { "type": "string" },
      "value": { "type": "string" },
      "in": { "type": "string", "enum": ["header", "query"] }
    } }
  }
}
```

---

## 8. USER FLOW

### 8.1 Flow: Buat dan Kirim Request

```
START
  │
  ├─→ Buka API Tester
  │
  ├─→ (Opsional) Pilih Environment dari dropdown (dev/staging/prod)
  │     └─→ Variable {{base_url}} tersedia
  │
  ├─→ Input URL di URL bar: {{base_url}}/api/users
  │
  ├─→ Pilih Method: misal POST
  │
  ├─→ Set Headers: Content-Type: application/json
  │
  ├─→ Set Auth: Bearer {{token}}
  │
  ├─→ Pilih Body → JSON:
  │     {
  │       "name": "John",
  │       "email": "john@test.com"
  │     }
  │     └─→ Klik "Prettify" untuk format JSON
  │
  ├─→ (Opsional) Tulis Pre-request Script:
  │     pm.variables.set("timestamp", Date.now());
  │
  ├─→ Klik "Send" (Ctrl+Enter)
  │     └─→ Loading state: spinner, progress
  │
  ├─→ Response muncul di panel kanan:
  │     ├─→ Status code: 201 Created (hijau)
  │     ├─→ Response time: 230ms
  │     ├─→ Size: 1.2KB
  │     ├─→ Pretty: JSON tree view
  │     ├─→ Headers: content-type, date, server
  │     └─→ Cookies: connect.sid
  │
  ├─→ (Opsional) Tulis Test Script:
  │     pm.expect(pm.response.statusCode).to.equal(201);
  │     pm.expect(pm.response.json().data.id).to.exist;
  │     └─→ Re-run: test result (✓ 2 passed)
  │
  ├─→ (Opsional) Save ke Collection:
  │     ├─→ Pilih collection / folder
  │     ├─→ Beri nama: "Create User"
  │     └─→ Request tersimpan
  │
  └─→ END
```

### 8.2 Flow: Run Collection Batch

```
START
  │
  ├─→ Buka sidebar Collections
  │
  ├─→ Pilih collection → Klik kanan → "Run Collection"
  │
  ├─→ Runner panel terbuka:
  │     ├─→ List semua request dalam collection
  │     ├─→ Checkbox untuk include/exclude
  │     ├─→ Pilih environment
  │     ├─→ Delay antar request (ms)
  │
  ├─→ Klik "Start Run"
  │     └─→ Progress berjalan:
  │           ├─→ Request 1/5: GET /users → 200 OK (45ms) ✓
  │           ├─→ Request 2/5: POST /users → 201 (120ms) ✓
  │           ├─→ Request 3/5: GET /users/:id → 404 (12ms) ✗
  │           └─→ Request 4/5: DELETE /users/:id → 200 (30ms) ✓
  │
  ├─→ Summary:
  │     ├─→ 3 passed, 1 failed dari 4 requests
  │     ├─→ Total time: 207ms
  │     └─→ Export report: JSON / HTML
  │
  └─→ END
```

### 8.3 Flow: Import Postman Collection

```
START
  │
  ├─→ Buka menu File → Import
  │
  ├─→ Pilih format: Postman v2.1
  │
  ├─→ File picker → Pilih collection.json
  │
  ├──→ Parsing:
  │     ├─→ Collection name + folder structure
  │     ├─→ URL → URL bar
  │     ├─→ Method → Method selector
  │     ├─→ Headers → Headers table
  │     ├─→ Body → Body editor (json/form/text)
  │     ├─→ Auth → Auth tab
  │     ├─→ Variables → Environment (opsional)
  │     └─→ Scripts → Pre-request / Tests tab
  │
  ├─→ Success: "Collection imported: API Tests (15 requests)"
  │
  ├─→ (Opsional) Report item yang tidak bisa di-import
  │
  └─→ END
```

---

## 9. UI/UX

### 9.1 Layout Utama

```
┌──────────────────────────────────────────────────────────────┐
│ [● Logo] API Tester          [Env: Dev ▼] [☰ Menu] [⚙] [?] │
├──────────────────┬───────────────────────────────────────────┤
│  Collections     │  Method ▼  [{{base_url}}/api/users] [Send]│
│  ───────────     │  Params  Headers  Auth  Body  Scripts     │
│  ▶ My API        │  ┌───────────────────────────────────────┐│
│    ├ GET Users   │  │ 1 {                                  ││
│    ├ POST User   │  │ 2   "name": "John",                 ││
│    └ DELETE User │  │ 3   "email": "john@test.com"        ││
│  ▶ Auth API      │  └───────────────────────────────────────┘│
│  ▶ Payment API   │  [Prettify] [Send]                       │
│                  ├───────────────────────────────────────────┤
│  [New Collection]│  Status: 201 Created  Time: 230ms  1.2KB │
│                  │  Pretty  Raw  Preview  Headers  Cookies   │
│  History         │  ┌───────────────────────────────────────┐│
│  ───────────     │  │ {                                    ││
│  GET /users      │  │   "data": {                          ││
│  POST /users     │  │     "id": 1,                         ││
│  GET /users/1    │  │     "name": "John"                   ││
│                  │  │   }                                  ││
│                  │  └───────────────────────────────────────┘│
└──────────────────┴───────────────────────────────────────────┘
```

### 9.2 Screens Detail

#### Screen 1: Main Request Builder
- **Left sidebar**: Collection browser (resizable, collapsible)
- **Top center**: URL bar + method selector + send button
- **Tab bar**: Params | Headers | Auth | Body | Scripts (Pre-request | Tests)
- **Right panel**: Response viewer (tabbed: Pretty, Raw, Preview, Headers, Cookies, Test Results)
- **Status bar**: Environment indicator, request count, update status

#### Screen 2: Collection Browser
- **Tree view** dengan ikon folder dan method
- **Search bar** di atas (filter cepat)
- **Context menu** di setiap item
- **Drag-and-drop** untuk reorganisasi
- **Empty state**: "Belum ada collection. Import dari Postman atau buat baru."

#### Screen 3: Environment Manager
- **Modal/dialog** penuh
- **Left**: List environment (Dev, Staging, Prod) dengan active indicator
- **Right**: Key-value table editor
- **Toggle secret**: Eye icon untuk show/hide
- **Add/remove/drag** variable
- **Buttons**: Add Environment, Duplicate, Export, Import
- **Empty state**: "Belum ada environment. Buat environment pertama."

#### Screen 4: Script Editor
- **Tab**: Pre-request | Tests
- **Monaco Editor** dengan JavaScript syntax highlighting
- **Console** di bawah: log output dari console.log
- **Run button** untuk execute script (dengan request simulasi)
- **Snippet panel**: "Click to insert" snippets (pm.expect, pm.variables, dll)
- **Line numbers** dan error highlight

#### Screen 5: History Panel
- **List**: Method badge + URL + timestamp
- **Group by**: Today, Yesterday, Last 7 Days, Older
- **Search** by URL/method
- **Hover**: Preview method, URL, status code
- **Click**: Load full request (method, URL, headers, body, auth)
- **Right click**: Delete, Copy URL
- **Clear all** button

### 9.3 Design System

- **Font**: Inter (UI) + JetBrains Mono (code)
- **Color scheme**:
  - Background: Light (#fff) / Dark (#1a1b1e)
  - Primary: Blue (#3b82f6)
  - Success: Green (#22c55e)
  - Warning: Yellow (#eab308)
  - Error: Red (#ef4444)
  - Status 2xx: #22c55e, 3xx: #3b82f6, 4xx: #eab308, 5xx: #ef4444
- **Spacing**: 4px grid system
- **Dark mode**: Full support, auto-detect system preference
- **Responsive**: Minimum width 1024px (target desktop)

### 9.4 Icons

- Menggunakan **Lucide Icons** (open source, consistent)
- Method badges dengan warna spesifik:
  - GET: Biru
  - POST: Hijau
  - PUT: Orange
  - PATCH: Purple
  - DELETE: Merah
  - HEAD: Abu-abu
  - OPTIONS: Cyan

### 9.5 Accessibility

- Keyboard navigable (Tab, Enter, Escape, Arrow keys)
- Focus indicator visible
- Alt text untuk semua icon
- Color-blind friendly status badges (icon + color)
- Screen reader labels untuk form controls

---

## 10. PERFORMANCE

### 10.1 Targets

| Metric | Target | Competitor Comparison |
|--------|--------|----------------------|
| **Binary size** | <20MB | Postman: >200MB, Insomnia: >150MB |
| **Memory idle** | <80MB | Postman: >300MB, Insomnia: >200MB |
| **Startup time** | <1 detik | Postman: 3-5 detik, Insomnia: 2-3 detik |
| **Request overhead** | <100ms | Postman: ~50ms, comparable |
| **Collection load (100 req)** | <200ms | Postman: >1s |
| **JSON pretty print (1MB)** | <50ms | Postman: ~30ms |
| **Tab switch** | <16ms (60fps) | Postman: ~50ms |

### 10.2 Optimization Strategies

1. **Lazy loading**: Panel response hanya di-render setelah request selesai. Monaco editor di-load on-demand.
2. **Virtual scrolling**: Collection dengan >1000 item menggunakan virtual list (hanya render visible items).
3. **Binary caching**: SQLite WAL mode + prepared statements untuk query cepat.
4. **No bundling overhead**: Svelte compiled, tailwind purged (hanya CSS yang dipakai).
5. **Rust zero-cost abstractions**: reqwest reuse connection pool, parsing response streaming.
6. **Debounced search**: Search di collection di-debounce 300ms untuk hindari re-render berlebihan.
7. **Response streaming**: Response besar di-stream ke file sementara, tidak di-hold di memory.

### 10.3 Benchmark Plan

Automated benchmark setiap release:
- Startup cold (first launch)
- Startup warm (second launch)
- Memory usage (idle, after 10 requests, after 100 requests)
- Response time untuk berbagai endpoint (local, remote, large payload)
- Collection import (Postman 100 requests, 50MB)

---

## 11. COMPETITOR ANALYSIS

### 11.1 Feature Comparison Matrix

| Feature | API Tester | Postman | Insomnia | Bruno | Hoppscotch | HTTPie | Paw |
|---------|-----------|---------|----------|-------|-------------|--------|-----|
| **Platform** | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux | Web | Win/Mac/Linux | Mac |
| **Native/Electron** | **Native** | Electron | Electron | Electron | Web | **Native** | **Native** |
| **Binary size** | **<20MB** | >200MB | >150MB | >100MB | N/A | **<10MB** | ~40MB |
| **RAM usage** | **<80MB** | >300MB | >200MB | >120MB | Browser | **<50MB** | <100MB |
| **REST** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GraphQL** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **gRPC** | ✅ | ✅ (bayar) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WebSocket** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **SSE** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Scripts** | ✅ (JS+Chai) | ✅ (JS+Chai) | ✅ (JS) | ❌ | ❌ | ❌ | ❌ |
| **Offline-first** | ✅ | ❌ (butuh login) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Open source** | ✅ MIT | ❌ | ✅ MIT | ✅ MIT | ✅ MIT | ✅ MIT | ❌ |
| **Import Postman** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Import Insomnia** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Code snippets** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Price** | **Gratis** | Freemium | Free/Paid | Gratis | Gratis | Free/Paid | $50/thn |
| **Login required** | **Tidak** | Ya | Tidak | Tidak | Opsional | Tidak | Ya |

### 11.2 Competitive Advantages

1. **Ringan**: Binary <20MB dan RAM <80MB, bisa dipakai di laptop lama / spek rendah.
2. **Multiprotokol**: REST + GraphQL + gRPC + WebSocket + SSE dalam satu app. Postman pisahin gRPC (berbayar), Bruno belum support gRPC/WS.
3. **Native performance**: Tauri memberikan performa native tanpa bloat Electron.
4. **True offline**: Tidak perlu login, tidak ada cloud service, semua data lokal.
5. **Privacy-first**: Zero telemetry, zero cloud, zero tracking.
6. **Open source**: MIT untuk core, komunitas bisa berkontribusi.

### 11.3 Competitive Disadvantages & Mitigation

| Disadvantage | Mitigation |
|-------------|-----------|
| **No cloud sync** | Team sync via Git (export collection JSON) atau file share |
| **No team collaboration** | Enterprise version dengan SSO + team sync |
| **Kurang ekosistem** | Open source, komunitas bisa buat plugin/themes |
| **Brand awareness** | Fokus di Product Hunt, Reddit, Hacker News, GitHub |

---

## 12. TIMELINE

### 12.1 MVP (30 Hari)

**Goal**: REST API client dengan collections, environments, dan response viewer.

| Week | Sprint | Deliverables |
|------|--------|-------------|
| **Week 1** | Foundation | Tauri project setup, SQLite migration, CRUD collection/environment, UI layout main |
| **Week 2** | Request Builder | URL bar, method selector, headers editor, query params, body editor (JSON, form, text) |
| **Week 3** | Response & Auth | Response viewer (pretty, raw, headers, cookies), auth (bearer, basic, API key), variable substitution |
| **Week 4** | Polish & Import | Import Postman collection, history, dark mode, keyboard shortcuts, save/load request |
| **Week 5** | Bug Fix & Release | Testing, bug fix, build CI, first release binary |

**MVP Scope**:
- REST: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Body: JSON, Form-Data, URL-Encoded, Plain Text, none
- Auth: Bearer, Basic, API Key
- Collections: CRUD, folder, drag-drop
- Environments: CRUD, variable substitution ({{var}})
- Response: Pretty JSON, Raw, Headers, Cookies, status, time, size
- Import: Postman v2.1
- History: Auto-save, one-click repeat
- Dark mode, light mode
- Export collection JSON

### 12.2 Phase 2 (Hari 31-60)

**Goal**: GraphQL, scripting, batch run, code snippets.

| Week | Sprint | Deliverables |
|------|--------|-------------|
| **Week 5-6** | Scripting | Boa JS engine integration, pre-request script, test script, Chai assertions, pm.* API |
| **Week 7** | GraphQL | Schema introspection, query builder, docs viewer |
| **Week 8** | Batch & Code | Run collection, test result, export report, code snippet generation (cURL, fetch, Python, Go, Rust) |

### 12.3 Phase 3 (Hari 61-90)

**Goal**: gRPC, WebSocket, SSE, enterprise features.

| Week | Sprint | Deliverables |
|------|--------|-------------|
| **Week 9-10** | gRPC | Proto import, unary call, server streaming, metadata |
| **Week 11** | WebSocket + SSE | Connect, send/receive, auto-reconnect, event log |
| **Week 12** | Enterprise | SSL certificates, proxy support, OAuth2 flow, team collection share |

### 12.4 Phase 4 (Post-90 Days)

- Plugin system (custom themes, custom protocols)
- CLI mode (headless collection run)
- VS Code extension
- Web version (limited)
- Performance optimizations

---

## 13. MONETIZATION

### 13.1 Model: Open Core

| Tier | Price | Features |
|------|-------|----------|
| **Community** | **Gratis** (MIT) | REST, GraphQL, Collections, Environments, Scripts, Import, History, Dark Mode |
| **Pro** | $5/bulan atau $50/tahun | gRPC, WebSocket, SSE, OAuth2 flow, SSL cert manager, Proxy support |
| **Enterprise** | $15/user/bulan | Team sync (via Git/self-hosted), SSO (SAML/OIDC), Audit log, RBAC, Priority support |

### 13.2 Revenue Projection

| Year | Community Users | Pro Users | Enterprise Users | Revenue |
|------|----------------|-----------|------------------|---------|
| Year 1 | 50,000 | 2,000 (4%) | 10 companies | $160K |
| Year 2 | 200,000 | 8,000 (4%) | 50 companies | $640K |
| Year 3 | 500,000 | 20,000 (4%) | 150 companies | $1.6M |

### 13.3 Ethical Monetization Principles

- **No ads ever**
- **No user tracking / telemetry**
- **No feature gating for core REST functionality**
- **OSS tetap gratis selamanya**
- **Semua data tetap lokal**, tidak ada cloud paksa
- **Pro/Enterprise hanya untuk advanced protocols + team collaboration**

---

## 14. OPEN SOURCE

### 14.1 License Strategy

| Component | License | Rationale |
|-----------|---------|-----------|
| **Core** (REST client, UI, collection, env) | **MIT** | Bebas digunakan, dimodifikasi, didistribusikan |
| **Advanced** (gRPC, WebSocket, team sync) | **AGPL v3** | Mencegah proprietary forking tanpa kontribusi balik |
| **Plugins** | **MIT** | Encourages plugin ecosystem |
| **Documentation** | **CC BY 4.0** | Free to share with attribution |

### 14.2 Repository Structure

```
github.com/api-tester-oss/api-tester/
├── src/                    # Frontend (Svelte)
├── src-tauri/              # Backend (Rust)
├── plugins/                # Plugin API + examples
├── docs/                   # Documentation
├── .github/                # CI/CD, templates
├── ARCHITECTURE.md         # Architecture docs
├── CONTRIBUTING.md         # Contribution guide
├── CODE_OF_CONDUCT.md      # Code of conduct
├── LICENSE                 # MIT
└── README.md               # Project overview
```

### 14.3 Community Guidelines

- **Code of Conduct**: Contributor Covenant v2.1
- **Issue templates**: Bug report, Feature request, Question
- **PR template**: Description, Screenshots, Test evidence
- **Release cadence**: Monthly minor, quarterly major
- **Discussions**: GitHub Discussions untuk community Q&A
- **Contributors**: All contributors listed in CONTRIBUTORS.md

### 14.4 Governance

- **BDFL** (Benevolent Dictator for Life) untuk fase awal
- **Core team** (3-5 maintainers) setelah 6 bulan
- **RFC process** untuk major feature changes
- **Voting** untuk contentious decisions

---

## 15. RISK & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Tauri 2.x masih baru** | Bug, breaking changes | Medium | Lock version, kontribusi ke Tauri, fallback ke Tauri 1.x |
| **Boa engine tidak complete** | ES6 features missing | Medium | Test coverage, limit JS API ke subset yang didukung |
| **gRPC complex** | Proto parsing, streaming | High | Fokus unary dulu, streaming di fase 2 |
| **Low adoption** | Project mati | Medium | Marketing: Reddit, Hacker News, Product Hunt |
| **Competitor copy** | Fitur ditiru | Low | Brand, community, performance advantage |
| **Maintainer burnout** | Project stagnan | Medium | Open governance, share maintainer load |

---

## 16. SUCCESS METRICS

### 16.1 North Star Metric

> **Active weekly users** yang mengirim >50 request/minggu.

### 16.2 Key Results

| Metric | Target (Year 1) | Target (Year 2) |
|--------|----------------|-----------------|
| **GitHub stars** | 10,000 | 50,000 |
| **Downloads** | 50,000 | 300,000 |
| **Weekly active users** | 5,000 | 30,000 |
| **GitHub contributors** | 50 | 200 |
| **Community plugins** | 10 | 50 |
| **NPS score** | >40 | >50 |
| **Issue resolution time** | <7 days | <3 days |

### 16.3 Quality Gates

Setiap release harus memenuhi:
- ✅ All tests pass
- ✅ Binary size <20MB
- ✅ Memory idle <80MB
- ✅ Startup <1 detik
- ✅ No regression on competitor import
- ✅ Dark mode works
- ✅ No telemetry leak

---

## 17. APPENDIX

### 17.1 Glossary

| Term | Definition |
|------|------------|
| **Collection** | Grup request API yang terorganisir |
| **Environment** | Set variable yang bisa di-switch (dev/staging/prod) |
| **Pre-request Script** | JS yang dijalankan sebelum request |
| **Test Script** | JS assertion yang dijalankan setelah response |
| **Dynamic Variable** | Variable built-in yang generate nilai otomatis ({{$guid}}) |
| **Tauri** | Rust framework untuk build desktop app native dengan web UI |

### 17.2 References

- [Tauri 2.0 Documentation](https://v2.tauri.app/)
- [Svelte 5 Documentation](https://svelte.dev/)
- [reqwest Rust crate](https://docs.rs/reqwest/)
- [tonic gRPC](https://github.com/hyperium/tonic)
- [Boa JS Engine](https://boajs.dev/)
- [Bruno API Client](https://www.usebruno.com/)
- [Postman Collection Format v2.1](https://schema.getpostman.com/json/collection/v2.1.0/)

### 17.3 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-07-10 | Product Team | Initial draft |
| 1.0 | 2026-07-10 | Product Team | Full PRD with all sections |

---

---

## 18. TECHNICAL SPECIFICATION

### 18.1 Data Model

```sql
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES collections(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS')),
  url TEXT NOT NULL,
  headers JSONB DEFAULT '[]',
  query_params JSONB DEFAULT '[]',
  body_type TEXT DEFAULT 'none' CHECK(body_type IN ('none','json','form-data','x-www-form-urlencoded','binary','graphql','text')),
  body_content TEXT,
  auth_type TEXT DEFAULT 'none' CHECK(auth_type IN ('none','bearer','basic','oauth2','api-key')),
  auth_config JSONB DEFAULT '{}',
  pre_script TEXT,
  test_script TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE environments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE response_history (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES requests(id) ON DELETE CASCADE,
  status_code INTEGER,
  headers JSONB,
  body TEXT,
  body_size INTEGER,
  time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 18.2 Sprint Plan

| Sprint | Minggu | Fokus |
|--------|--------|-------|
| S1-2 | 1-2 | HTTP Engine: reqwest integration, request builder, response parser |
| S3 | 3 | Collections: CRUD, folder tree, drag-drop reorder |
| S4 | 4 | Environments: Variable system, quick switch, dynamic variables |
| S5 | 5 | Scripts: JavaScript runtime (boa_engine), pre-request, tests |
| S6 | 6 | Advanced: GraphQL, gRPC, WebSocket support |
| S7 | 7-8 | UI Polish: Keyboard shortcuts, themes, performance |

### 18.3 Budget

| Item | Biaya (Rp) |
|------|-----------|
| Developer (2 bulan) | 60.000.000 |
| UI designer (1 bulan) | 20.000.000 |
| gRPC/WebSocket specialist | 15.000.000 |
| Testing | 10.000.000 |
| Launch | 5.000.000 |
| Contingency | 16.000.000 |
| **Total** | **Rp 126.000.000** |
```

---

*End of PRD — API Tester OSS*
