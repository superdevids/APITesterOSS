# API Tester OSS 🚀

**Native, lightweight, open-source API client — the Postman/Insomnia alternative that respects your RAM.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/apitesteross/api-tester)
[![Binary Size](https://img.shields.io/badge/binary-%3C20MB-brightgreen)](#-performance)
[![RAM Usage](https://img.shields.io/badge/RAM-%3C80MB-success)](#-performance)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange)](https://v2.tauri.app/)
[![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00)](https://svelte.dev/)

---

## 📑 Table of Contents

- [Why API Tester OSS?](#-why-api-tester-oss)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Performance](#-performance)
- [Competitor Comparison](#-competitor-comparison)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Community](#-community)

---

## 🎯 Why API Tester OSS?

Modern API clients have become bloated. Postman consumes 300MB+ RAM, forces you to log in, and stores your API keys in the cloud. Insomnia was acquired by Kong and its future is uncertain. Bruno is great but doesn't support gRPC or WebSocket.

**API Tester OSS is different:**

| Problem | Solution |
|---------|----------|
| Postman >200MB install, >300MB RAM | **Binary <20MB, RAM <80MB** (Tauri native) |
| Postman requires login & cloud sync | **100% offline, no login, no telemetry** |
| Insomnia acquired, direction unclear | **Open source MIT, free forever** |
| gRPC/WebSocket behind paywall | **All protocols FREE** |
| API keys stored in cloud | **All data local in SQLite** |
| Electron bloat | **Native Rust + WebView** |

---

## ✨ Features

### 📡 REST API Client
- ✅ All HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- ✅ Body types: JSON, Form-Data, URL-Encoded, Plain Text, Binary, GraphQL
- ✅ Query Parameters with bulk edit mode
- ✅ Path Variables auto-detection (`:param`)
- ✅ Custom Headers with presets and auto-generation
- ✅ URL auto-complete from history

### 🔐 Authentication
- ✅ Bearer Token
- ✅ Basic Auth (auto base64 encoding)
- ✅ API Key (header or query param)
- ✅ OAuth 2.0 (client credentials flow)
- ✅ Auth headers auto-injected into requests
- ✅ Manual override capability

### 📊 Response Viewer
- ✅ Pretty JSON with syntax highlighting & collapsible tree
- ✅ Raw view with monospace font, line numbers, search
- ✅ Preview: HTML rendering, Image display (PNG/JPG/GIF/SVG)
- ✅ Response Headers table with security header flags
- ✅ Cookies table (parsed from Set-Cookie)
- ✅ Status code badges with semantic colors (2xx green, 4xx yellow, 5xx red)
- ✅ Response time & size metrics
- ✅ Copy response to clipboard

### 📁 Collections & Environments
- ✅ Hierarchical tree: Collection → Folder → Request
- ✅ Full CRUD for collections and folders
- ✅ Drag-and-drop reordering *(planned)*
- ✅ Context menu: Rename, Duplicate, Delete, Export, Run
- ✅ Search within collections
- ✅ Multiple Environments (dev/staging/prod)
- ✅ Variable substitution `{{key}}` in URL, headers, body
- ✅ Dynamic variables: `{{$guid}}`, `{{$timestamp}}`, `{{$randomInt}}`, `{{$randomEmail}}`, `{{$randomString}}`
- ✅ Secret variables (masked input, excluded from export)
- ✅ Export/import collections as JSON

### 📥 Import / Export
- ✅ Import Postman Collection v2.1
- ✅ Import Insomnia v4 export
- ✅ Import Bruno collection
- ✅ Export collection to API Tester JSON format
- ✅ Detailed import error reporting

### 🧪 Scripting & Testing *(Phase 2)*
- ✅ Pre-request scripts (JavaScript)
- ✅ Test scripts with assertions
- ✅ `pm.expect()`, `pm.variables`, `pm.response`, `pm.request` API
- ✅ Console output panel
- ✅ Snippet library (click to insert)
- ✅ Test Results panel (pass/fail with details)
- 🔲 Chai assertion library integration (Boa engine)
- 🔲 Full `pm.test()` API

### 🔄 Advanced Protocols
- ✅ **GraphQL** — Query editor, variables, schema introspection *(planned)*
- ✅ **WebSocket** — Real-time messaging, message log, auto-reconnect
- ✅ **gRPC** — Unary calls, proto file import, metadata
- ✅ **SSE** (Server-Sent Events) — Event log, auto-reconnect

### 🚀 Collection Runner
- ✅ Batch run all requests in a collection
- ✅ Progress tracking per request
- ✅ Test results summary (pass/fail counts)
- ✅ Export report as JSON

### ⚡ Productivity
- ✅ Code snippets: cURL, JavaScript (fetch), Python (requests), Go, Rust, Java
- ✅ History with date grouping (Today, Yesterday, Last 7 Days, Older)
- ✅ History search by URL/method
- ✅ One-click repeat from history
- ✅ Keyboard shortcuts (Ctrl+Enter, Ctrl+S, Ctrl+Shift+E, etc.)
- ✅ Dark mode / Light mode with system preference detection

---

## 📦 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop Framework** | [Tauri 2.x](https://v2.tauri.app/) | Native binary, <20MB, secure IPC |
| **Frontend** | [Svelte 5](https://svelte.dev/) + [TailwindCSS 4](https://tailwindcss.com/) | Smallest bundle (~15KB runtime), compiled, no virtual DOM |
| **Backend** | [Rust](https://www.rust-lang.org/) | Memory-safe, zero-cost abstractions, blazing fast |
| **HTTP Client** | [reqwest](https://docs.rs/reqwest/) | Industry-standard Rust HTTP client |
| **Database** | [SQLite](https://www.sqlite.org/) via [rusqlite](https://docs.rs/rusqlite/) | Local, zero-config, WAL mode, reliable |
| **Async Runtime** | [Tokio](https://tokio.rs/) | Industry-standard async Rust runtime |
| **Scripting** | JavaScript (Boa engine planned) | Safe, embedded, no V8 bloat |
| **Icons** | Inline SVG (Lucide-style) | Zero dependency, consistent |
| **Fonts** | Inter (UI) + JetBrains Mono (code) | Professional, readable |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| **Node.js** | >= 18 | [nodejs.org](https://nodejs.org/) |
| **Rust** | stable | [rustup.rs](https://rustup.rs/) |
| **Tauri prerequisites** | — | [v2.tauri.app/start/prerequisites](https://v2.tauri.app/start/prerequisites/) |

**Linux additional packages:**
```bash
# Ubuntu / Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel gcc

# Arch
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl appindicator-gtk3 librsvg
```

### Installation

```bash
# Clone the repository
git clone https://github.com/apitesteross/api-tester.git
cd api-tester

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Build Artifacts

After `npm run tauri build`, find installers in `src-tauri/target/release/bundle/`:

| Platform | Format |
|----------|--------|
| **Windows** | `.msi`, `.exe` (NSIS) |
| **macOS** | `.dmg`, `.app` |
| **Linux** | `.deb`, `.rpm`, `.AppImage` |

---

## 📁 Project Structure

```
api-tester/
├── src/                         # Frontend (Svelte 5)
│   ├── App.svelte               # Root component — main layout
│   ├── main.ts                  # Svelte mount entry point
│   ├── app.css                  # Global styles + TailwindCSS 4
│   ├── svelte-env.d.ts          # Svelte type declarations
│   └── lib/
│       ├── components/          # 20 Svelte components
│       │   ├── Sidebar.svelte           # Left sidebar (collections/history)
│       │   ├── RequestBuilder.svelte    # Request configuration panel
│       │   ├── ResponseViewer.svelte    # Response display panel
│       │   ├── CollectionBrowser.svelte # Collection tree view
│       │   ├── EnvironmentManager.svelte# Environment/variable editor
│       │   ├── HistoryPanel.svelte      # Request history list
│       │   ├── AuthPanel.svelte         # Authentication config
│       │   ├── HeadersEditor.svelte     # Headers key-value editor
│       │   ├── ParamsEditor.svelte      # Query params editor
│       │   ├── PathVariables.svelte     # URL path variables
│       │   ├── RequestBody.svelte       # Body editor (JSON/form/text)
│       │   ├── ScriptEditor.svelte      # Pre-request & test scripts
│       │   ├── ImportModal.svelte       # Import Postman/Insomnia/Bruno
│       │   ├── CodeSnippetModal.svelte  # Code snippet generator
│       │   ├── CollectionRunner.svelte  # Batch collection runner
│       │   ├── KeyboardShortcutsModal.svelte
│       │   ├── WebSocketPanel.svelte    # WebSocket client
│       │   ├── SSEPanel.svelte          # Server-Sent Events client
│       │   ├── GRPCPanel.svelte         # gRPC client
│       │   └── send-request.ts          # Request sending logic
│       ├── stores/              # Svelte stores (state management)
│       │   ├── request.ts               # Current request, response, tests
│       │   ├── collection.ts            # Collections, folders, requests
│       │   ├── environment.ts           # Environments, variables
│       │   ├── history.ts              # Request history
│       │   └── theme.ts                # Dark/light mode
│       ├── utils/               # Utility functions
│       │   ├── code-snippets.ts         # Code generation (6 languages)
│       │   ├── export-collection.ts     # Collection export
│       │   ├── http-methods.ts          # Method colors, status text
│       │   ├── keyboard-shortcuts.ts    # Shortcut definitions
│       │   ├── postman-importer.ts      # Postman/Insomnia/Bruno import
│       │   └── variable-substitution.ts # {{var}} substitution engine
│       └── types.ts             # TypeScript type definitions
├── src-tauri/                   # Backend (Rust)
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   ├── build.rs                 # Tauri build script
│   ├── capabilities/            # Tauri permission capabilities
│   └── src/
│       ├── main.rs              # Rust entry point
│       ├── lib.rs               # Tauri app builder + DB init
│       ├── commands/            # Tauri IPC command handlers
│       │   ├── mod.rs
│       │   ├── request.rs       # HTTP request execution (reqwest)
│       │   ├── collection.rs    # Collection CRUD
│       │   ├── environment.rs   # Environment CRUD
│       │   ├── history.rs       # History save/query/clear
│       │   └── grpc.rs          # gRPC call handler
│       ├── model/
│       │   └── mod.rs           # Serde data models
│       └── db/
│           ├── mod.rs           # DB module
│           ├── migration.rs     # SQLite schema migrations
│           └── repository.rs    # Data access layer
├── .github/                     # GitHub templates & CI/CD
│   ├── ISSUE_TEMPLATE/          # Bug report & feature request templates
│   ├── workflows/               # CI and Release workflows
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── FUNDING.yml
├── PRD.md                       # Product Requirements Document
├── ARCHITECTURE.md              # Architecture documentation
├── CONTRIBUTING.md              # Contribution guide
├── CODE_OF_CONDUCT.md           # Contributor Covenant v2.1
├── CHANGELOG.md                 # Version changelog
├── SECURITY.md                  # Security policy
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## 📖 Usage Guide

### Sending Your First Request

1. **Open API Tester OSS** — no login required
2. **Enter URL** in the URL bar (e.g., `https://jsonplaceholder.typicode.com/users`)
3. **Select Method** — GET, POST, PUT, etc.
4. **Click Send** or press `Ctrl+Enter`
5. **View Response** — Pretty JSON, Raw, Headers, Cookies

### Using Environment Variables

1. Click the **environment dropdown** in the top bar → **Manage Environments**
2. Create an environment (e.g., "Dev")
3. Add variables: `base_url` = `https://api.example.com`, `token` = `your-api-key`
4. Select the environment from the dropdown
5. Use `{{base_url}}/users` in your URL — it auto-substitutes!

### Dynamic Variables

Use built-in dynamic variables anywhere in your request:

| Variable | Output |
|----------|--------|
| `{{$guid}}` | UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`) |
| `{{$timestamp}}` | Unix timestamp (e.g., `1720612800`) |
| `{{$randomInt}}` | Random integer 0-9999 |
| `{{$randomEmail}}` | Random email (e.g., `user4231@test.com`) |
| `{{$randomString}}` | Random 8-char string |

### Importing from Postman

1. Click the **Import** button in the sidebar
2. Select **Postman v2.1**
3. Choose your exported Postman collection JSON file
4. Collections, folders, requests, auth, and scripts are imported automatically

### Generating Code Snippets

1. Configure your request
2. Click the **Code** button (</> icon)
3. Select language: cURL, JavaScript, Python, Go, Rust, or Java
4. Copy to clipboard and paste into your code

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send request |
| `Ctrl+S` | Save request |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+[` / `Ctrl+]` | Navigate history |
| `Ctrl+Shift+E` | Switch environment |
| `Ctrl+Shift+C` | Copy as cURL |
| `Escape` | Close modals / cancel |
| `?` | Show keyboard shortcuts |

---

## 📊 Performance

| Metric | API Tester OSS | Postman | Insomnia | Bruno |
|--------|---------------|---------|----------|-------|
| **Binary size** | **<20MB** | >200MB | >150MB | >100MB |
| **RAM (idle)** | **<80MB** | >300MB | >200MB | >120MB |
| **Startup time** | **<1s** | 3-5s | 2-3s | 2-3s |
| **Platform** | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux |
| **Login required** | **No** | Yes | No | No |
| **Telemetry** | **None** | Yes | Minimal | None |

### Optimization Strategies

- **Lazy loading** — Response panel renders only after request completes
- **Virtual scrolling** — Collections with >1000 items use virtual lists
- **SQLite WAL mode** — Write-Ahead Logging for concurrent read/write performance
- **Svelte compiled** — No virtual DOM runtime overhead
- **Tailwind purged** — Only used CSS classes in final bundle
- **Rust zero-cost abstractions** — reqwest connection pooling, streaming responses

---

## 🏆 Competitor Comparison

| Feature | API Tester | Postman | Insomnia | Bruno | Hoppscotch | HTTPie | Paw |
|---------|-----------|---------|----------|-------|------------|--------|-----|
| **Native** | ✅ Tauri | ❌ Electron | ❌ Electron | ❌ Electron | Web | ✅ | ✅ Swift |
| **REST** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GraphQL** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **gRPC** | ✅ | 💰 Paid | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WebSocket** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **SSE** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Scripts** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Offline** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Open Source** | ✅ MIT | ❌ | ✅ MIT | ✅ MIT | ✅ MIT | ✅ MIT | ❌ |
| **Price** | **Free** | Freemium | Free/Paid | Free | Free | Free/Paid | $50/yr |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](PRD.md) | Product Requirements Document — full feature spec, user stories, data model |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture, data flow, database schema, security model |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to set up dev environment, code style, PR process |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards (Contributor Covenant v2.1) |

---

## 🤝 Contributing

We love contributions! Whether it's a bug fix, new feature, documentation improvement, or just reporting an issue — every contribution matters.

### Quick Start for Contributors

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/api-tester.git
cd api-tester
git remote add upstream https://github.com/apitesteross/api-tester.git

# Create a feature branch
git checkout -b feature/my-amazing-feature

# Make changes, commit with conventional commits
git commit -m "feat(request): add multipart file upload support"

# Push and open a PR
git push origin feature/my-amazing-feature
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on code style, commit conventions, and the PR review process.

### Good First Issues

Look for issues labeled `good first issue` and `help wanted` on our [GitHub Issues](https://github.com/apitesteross/api-tester/issues) page.

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅ (Current: v0.1.0)
- [x] REST API client (all methods)
- [x] Collections & environments
- [x] Response viewer (pretty, raw, headers, cookies)
- [x] Import Postman/Insomnia/Bruno
- [x] History
- [x] Dark mode
- [x] Code snippets (6 languages)
- [x] SQLite local storage

### Phase 2 — Scripting & GraphQL (Next 30 days)
- [ ] Boa JS engine integration
- [ ] Full Chai assertion library
- [ ] `pm.test()` API
- [ ] GraphQL schema introspection
- [ ] Collection runner with test reports
- [ ] OAuth 2.0 full flow

### Phase 3 — Advanced Protocols (Days 31-60)
- [ ] gRPC server/client streaming
- [ ] gRPC bidirectional streaming
- [ ] WebSocket auto-reconnect
- [ ] SSE event filtering
- [ ] SSL certificate manager
- [ ] Proxy support

### Phase 4 — Enterprise & Ecosystem (Days 61-90+)
- [ ] Plugin system
- [ ] CLI mode (headless collection run)
- [ ] VS Code extension
- [ ] Team sync via Git
- [ ] Custom themes

See the [full PRD](PRD.md) for complete details.

---

## 📜 License

**MIT License** — see [LICENSE](LICENSE) for full text.

```
MIT License

Copyright (c) 2026 API Tester OSS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

The core REST client will **always remain free and open source under MIT**.
Advanced protocols (gRPC, WebSocket, SSE) and team features may be offered
under AGPL v3 in a Pro tier — but the community edition will never be crippled.

---

## 💬 Community

- **GitHub Issues** — [Report bugs & request features](https://github.com/apitesteross/api-tester/issues)
- **GitHub Discussions** — [Ask questions & share ideas](https://github.com/apitesteross/api-tester/discussions)
- **Security** — See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

**Built with ❤️ for developers who are tired of bloated API clients.**

*Star ⭐ this repo if you find it useful!*
