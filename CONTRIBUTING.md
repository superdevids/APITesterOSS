# Contributing to API Tester OSS

First off, thank you for taking the time to contribute! API Tester OSS is a community-driven, open-source alternative to Postman and Insomnia built with Tauri 2.x, Rust, and Svelte 5. Every contribution -- whether it's a bug report, a feature idea, a documentation improvement, or a pull request -- makes this project better for developers everywhere who want a fast, lightweight, and truly open API client.

This document is the single source of truth for how to contribute. Please read it carefully before opening an issue or pull request.

---

## Table of Contents

1. [Code of Conduct](#1-code-of-conduct)
2. [Getting Started](#2-getting-started)
3. [Project Structure](#3-project-structure)
4. [Development Workflow](#4-development-workflow)
5. [Code Style Guidelines](#5-code-style-guidelines)
6. [Commit Message Convention](#6-commit-message-convention)
7. [Pull Request Process](#7-pull-request-process)
8. [Testing Guidelines](#8-testing-guidelines)
9. [Reporting Bugs](#9-reporting-bugs)
10. [Suggesting Features](#10-suggesting-features)
11. [Areas Needing Contribution](#11-areas-needing-contribution)
12. [License](#12-license)

---

## 1. Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md), which is adapted from the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct.html). Please read it in full before contributing.

In short: be kind, be respectful, be constructive. We welcome contributors of all experience levels, backgrounds, and identities. Harassment, personal attacks, and discriminatory behavior will not be tolerated.

If you witness or experience behavior that violates the Code of Conduct, please report it to the maintainers at **conduct@apitesteross.dev** (replace with the official contact listed in the Code of Conduct file). All reports will be handled with confidentiality.

---

## 2. Getting Started

### Prerequisites

Before you begin, make sure you have the following tools installed on your system:

| Tool | Minimum Version | How to Verify | Install Link |
|------|-----------------|---------------|--------------|
| **Node.js** | >= 18 | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | >= 9 (ships with Node 18+) | `npm --version` | included with Node.js |
| **Rust** | stable (latest) | `rustc --version` | [rustup.rs](https://rustup.rs/) |
| **Cargo** | latest (ships with Rust) | `cargo --version` | included with rustup |
| **Git** | >= 2.30 | `git --version` | [git-scm.com](https://git-scm.com/) |

You will also need the **Tauri 2.x system prerequisites** which vary by operating system:

- **Windows**: Microsoft Visual C++ Build Tools (or full Visual Studio with the "Desktop development with C++" workload), WebView2 (pre-installed on Windows 11; on Windows 10 it may need to be installed from the [Microsoft Edge WebView2 page](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **macOS**: Xcode Command Line Tools (`xcode-select --install`), Clang (`clang --version`), and the `cargo-tauri` bundle dependencies.
- **Linux**: A set of system libraries including `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, ` librsvg2-dev`, and related packages.

For the full, up-to-date list of Tauri prerequisites per platform, see the official guide:
**https://v2.tauri.app/start/prerequisites/**

### Cloning the Repository

```bash
git clone https://github.com/api-tester-oss/api-tester.git
cd api-tester
```

If you plan to contribute, fork the repository first and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/api-tester.git
cd api-tester
git remote add upstream https://github.com/api-tester-oss/api-tester.git
```

### Installing Dependencies

The project has two dependency trees -- JavaScript (frontend) and Rust (backend):

```bash
# Install frontend dependencies (Svelte, Vite, TailwindCSS, Tauri CLI, etc.)
npm install

# Rust dependencies are fetched automatically on first build
# but you can pre-fetch them:
cd src-tauri && cargo fetch && cd ..
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all frontend and Tauri CLI dependencies. |
| `npm run tauri dev` | Start the full app in development mode (launches the Tauri desktop window with hot module replacement for the frontend and incremental Rust recompilation for the backend). This is the primary command you will use during development. |
| `npm run tauri build` | Produce a production-ready desktop binary and installer for the current platform. |
| `npm run dev` | Start only the Vite frontend dev server at `http://localhost:1420` (useful for rapid UI iteration without the Rust backend). |
| `npm run build` | Build only the frontend into the `dist/` directory (no native binary). |
| `npm run preview` | Preview the production frontend build locally. |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Run Rust unit and integration tests. |
| `cargo clippy --manifest-path src-tauri/Cargo.toml` | Run the Clippy linter on the Rust backend. |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | Check Rust formatting without modifying files. |

### Running the App for the First Time

```bash
npm install
npm run tauri dev
```

The first build will take a few minutes because Rust needs to compile all dependencies. Subsequent builds are incremental and much faster (typically a few seconds for frontend-only changes). The Tauri development window will appear once compilation finishes, and the Vite dev server will be available at `http://localhost:1420`.

---

## 3. Project Structure

Understanding the project layout will help you navigate and find the right place for your changes:

```
api-tester/
├── src/                          # Frontend (Svelte 5 + TypeScript)
│   ├── App.svelte                # Root component
│   ├── main.ts                   # Application entry point
│   ├── app.css                   # Global styles (TailwindCSS 4 directives)
│   ├── lib/
│   │   ├── components/            # Reusable Svelte UI components
│   │   │   ├── RequestPanel.svelte
│   │   │   ├── ResponseViewer.svelte
│   │   │   ├── CollectionTree.svelte
│   │   │   ├── EnvironmentManager.svelte
│   │   │   └── ...
│   │   ├── stores/                # Svelte stores (reactive state management)
│   │   │   ├── collections.ts
│   │   │   ├── environments.ts
│   │   │   ├── settings.ts
│   │   │   └── ...
│   │   ├── utils/                 # Utility functions (helpers, formatters)
│   │   │   ├── http.ts
│   │   │   ├── variables.ts
│   │   │   └── ...
│   │   └── types.ts              # Shared TypeScript type definitions
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── commands/              # Tauri IPC command handlers (frontend calls these)
│   │   ├── db/                    # Database layer (SQLite via rusqlite)
│   │   ├── model/                 # Data models / domain structs
│   │   ├── lib.rs                 # App initialization, command registration
│   │   └── main.rs                # Binary entry point
│   ├── Cargo.toml                 # Rust dependencies and crate config
│   ├── tauri.conf.json            # Tauri build configuration
│   ├── build.rs                   # Tauri build script
│   └── capabilities/              # Tauri permission/capability definitions
│
├── package.json                  # Node.js project config and scripts
├── vite.config.ts                # Vite bundler configuration
├── svelte.config.js              # Svelte compiler configuration
├── tsconfig.json                 # TypeScript compiler configuration
├── README.md                     # Project overview
├── PRD.md                        # Product Requirements Document
├── CODE_OF_CONDUCT.md            # Contributor Covenant
├── CONTRIBUTING.md               # This file
└── LICENSE                       # MIT License
```

### Architecture at a Glance

The app follows a **Tauri IPC bridge** architecture:

1. The **frontend** (Svelte 5) handles all UI rendering, user interaction, and state management. It communicates with the backend exclusively through Tauri's `invoke()` API.
2. The **backend** (Rust) handles system-level operations: HTTP requests (via `reqwest`), database persistence (via `rusqlite`/SQLite), file I/O, and native OS integrations.
3. The **database** (SQLite in WAL mode) stores collections, environments, request history, and settings locally. No data ever leaves the user's machine.
4. **Types** are shared conceptually between frontend and backend via serde-compatible Rust structs on the backend side and corresponding TypeScript interfaces in `src/lib/types.ts` on the frontend side. Keep these in sync when modifying data models.

---

## 4. Development Workflow

### Branching Strategy

We use a simple, prefix-based branching model. Always create a new branch from `main` (or the relevant feature branch if coordinated with a maintainer):

| Branch Prefix | Use Case | Example |
|---------------|----------|---------|
| `feature/` | New functionality or enhancements | `feature/websocket-client` |
| `fix/` | Bug fixes | `fix/response-headers-truncated` |
| `docs/` | Documentation changes only | `docs/update-contributing-guide` |
| `chore/` | Maintenance, tooling, dependencies, refactoring | `chore/upgrade-tauri-2-1` |
| `refactor/` | Code restructuring with no behavior change | `refactor/extract-http-client` |
| `test/` | Adding or improving tests | `test/add-collection-runner-tests` |
| `release/` | Release preparation (maintainers only) | `release/v0-2-0` |

### Step-by-Step Workflow

```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create a descriptively named branch
git checkout -b feature/my-awesome-feature

# 3. Make your changes, committing logically and often
#    (see Commit Message Convention below)
git add <files>
git commit -m "feat(request): add multipart form-data body editor"

# 4. Push to your fork
git push origin feature/my-awesome-feature

# 5. Open a Pull Request against the `main` branch of the upstream repo
#    Fill in the PR template and link any related issues.
```

### Keeping Your Branch Up to Date

If the `main` branch advances while you are working, rebase your branch to avoid merge commits:

```bash
git fetch upstream
git rebase upstream/main
# Resolve any conflicts, then force-push to your fork
git push origin feature/my-awesome-feature --force-with-lease
```

Use `--force-with-lease` instead of `--force` to avoid overwriting others' work if the remote branch has unexpected changes.

### Branch Lifetime

- Keep branches short-lived. Ideally, a branch should be merged within a few days of opening.
- If a PR goes stale, a maintainer may close it and ask you to reopen it after rebasing.
- Delete your branch after the PR is merged to keep the repository tidy.

---

## 5. Code Style Guidelines

### Rust (Backend)

The Rust backend must pass `cargo fmt` and `cargo clippy` with zero warnings.

**Formatting:**
- Run `cargo fmt --manifest-path src-tauri/Cargo.toml` before committing. You can check formatting without modifying files with `cargo fmt -- --check`.
- Use 4-space indentation (rustfmt default).
- Keep lines under 100 characters where practical.

**Idioms:**
- Prefer `?` operator over `match` for error propagation.
- Use `thiserror` for library errors and `anyhow` for application-level errors (or follow the existing error handling pattern in the codebase).
- Prefer `&str` and `String` appropriately -- `&str` for function parameters, `String` for owned data.
- Use `serde::Serialize` / `Deserialize` for all structs that cross the IPC boundary.
- Use `#[derive(Debug)]` on all public types.
- Avoid `unwrap()` and `expect()` in production code -- use proper error handling. They are acceptable in test code.
- Prefer iterator chains over explicit loops when it improves readability.
- Document public functions and modules with `///` doc comments.

**Example:**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

/// Creates a new collection in the database.
///
/// # Errors
/// Returns an error if the database write fails.
pub async fn create_collection(
    db: &Database,
    name: &str,
) -> Result<Collection, DatabaseError> {
    let collection = Collection::new(name);
    db.insert_collection(&collection).await?;
    Ok(collection)
}
```

### TypeScript & Svelte (Frontend)

**TypeScript:**
- The project uses `strict: true` in `tsconfig.json`. All code must be strictly typed.
- Do not use `any` unless absolutely necessary. If you must, add a comment explaining why.
- Prefer `interface` for object shapes and `type` for unions/intersections.
- Use `const` by default; `let` only when reassignment is needed; never `var`.
- Use template literals over string concatenation.
- Prefer arrow functions for callbacks; named function declarations for exported utilities.
- Use `async/await` over raw `.then()`/`.catch()` chains.

**Svelte 5:**
- Svelte 5 introduces **runes** (`$state`, `$derived`, `$effect`, `$props`). Prefer runes over the legacy `let`-based reactivity for new components.
- Follow the existing component conventions in `src/lib/components/`.
- Component filenames use PascalCase: `RequestPanel.svelte`, not `requestPanel.svelte` or `request_panel.svelte`.
- Co-locate styles within the component using `<style>` blocks. Use TailwindCSS utility classes for layout and spacing; reserve `<style>` blocks for component-specific or dynamic styles.
- Keep components focused and small. If a component grows beyond ~300 lines, consider splitting it.
- Use `@tauri-apps/api`'s `invoke()` to call backend commands. Always type the return value.

**Example Svelte 5 component:**

```svelte
<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import type { Collection } from "$lib/types";

  let { collectionId }: { collectionId: string } = $props();

  let collection = $state<Collection | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    invoke<Collection>("get_collection", { id: collectionId })
      .then((result) => {
        collection = result;
      })
      .catch((err) => {
        error = String(err);
      })
      .finally(() => {
        loading = false;
      });
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if collection}
  <h2 class="text-lg font-semibold">{collection.name}</h2>
{/if}
```

### CSS & TailwindCSS 4

- The project uses **TailwindCSS 4** via the `@tailwindcss/vite` plugin. Global directives live in `src/app.css`.
- Prefer Tailwind utility classes over custom CSS. Only write custom CSS when Tailwind cannot express what you need.
- Do not use inline `style="..."` attributes unless the value is dynamic and cannot be expressed with classes.
- Use semantic color tokens (e.g., `text-green-500` for success, `text-red-500` for error) consistently.
- Support both light and dark mode. Use Tailwind's `dark:` variant where appropriate.
- Keep the visual language consistent with existing components (spacing, border radius, shadows).

### General Rules (All Languages)

- **No commented-out code** in committed files. If you need to keep a reference, use a scratch file or a commit message.
- **No `console.log` / `println!` debug statements** in committed code. Use the project's logging mechanism instead. If the project does not yet have one, open an issue.
- **Remove trailing whitespace** and ensure files end with a newline.
- **Imports**: group and order imports logically (standard library, third-party, local). Avoid unused imports.
- **Naming**: use `snake_case` for Rust and TypeScript variables/functions, `PascalCase` for types/structs/components, `SCREAMING_SNAKE_CASE` for constants.
- **Files**: one primary export per file where practical. Keep file names descriptive.

---

## 6. Commit Message Convention

We follow [**Conventional Commits**](https://www.conventionalcommits.org/) v1.0.0. This standard enables automatic changelog generation and semantic versioning.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature for the user |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect the meaning of the code (whitespace, formatting, missing semicolons, etc.) |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | A code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `build` | Changes that affect the build system or external dependencies (Cargo.toml, package.json, etc.) |
| `ci` | Changes to CI configuration files and scripts |
| `chore` | Other changes that don't modify `src` or `src-tauri/src` files |
| `revert` | Reverting a previous commit |

### Scopes

Scopes are optional but encouraged. Use the area of the codebase the change affects:

- `request` -- HTTP request building/sending
- `response` -- Response viewing/parsing
- `collection` -- Collections and folders
- `environment` -- Environments and variables
- `scripting` -- Pre-request and test scripts
- `graphql` -- GraphQL client
- `websocket` -- WebSocket client
- `grpc` -- gRPC client
- `sse` -- Server-Sent Events
- `runner` -- Collection runner
- `db` -- Database layer
- `ui` -- General UI/components
- `auth` -- Authentication mechanisms
- `import` -- Import/export functionality
- `history` -- Request history
- `settings` -- App settings/preferences

### Rules

1. The **subject line** (first line) must be in lowercase, start with a capital verb is NOT required (use lowercase), and must not end with a period.
2. Keep the subject line under **72 characters**.
3. Use the **imperative mood** ("add", not "added" or "adds"): "feat(request): add multipart body support".
4. The **body** (if any) should explain the "why" and "what", not the "how". Wrap at 100 characters.
5. The **footer** can reference issues and breaking changes. Breaking changes must start with `BREAKING CHANGE:` on its own line.
6. Squash commits before merging so the history stays clean. One PR = one logical commit (or a small number of well-organized commits).

### Examples

```
feat(websocket): add real-time message panel

Adds a live message feed for WebSocket connections with support
for sending text and binary frames. Includes connection status
indicator and auto-reconnect toggle.

Closes #142
```

```
fix(db): prevent duplicate collection IDs on rapid creation

Race condition in the UUID generation path could produce
duplicate IDs when multiple collections were created in quick
succession. Switched to a synchronous ID generation with a mutex.

Fixes #87
```

```
refactor(response): extract JSON viewer into separate component

BREAKING CHANGE: ResponseViewer no longer accepts rawBody as a prop.
Use the new JsonViewer component for raw JSON rendering.
```

```
docs: expand contributing guide with testing section
```

```
chore(deps): bump reqwest from 0.11 to 0.12
```

---

## 7. Pull Request Process

### Before You Open a PR

1. **Search existing PRs** to make sure your change is not already being worked on. If it is, join the discussion there.
2. **Open an issue first** for any non-trivial feature or architectural change. This avoids wasted effort if the change does not align with the project's direction.
3. **Keep PRs small and focused.** A PR should address one issue or one feature. Large, sprawling PRs are difficult to review and slow to merge. If your change is large, break it into a series of smaller PRs.
4. **Ensure all checks pass locally:**
   ```bash
   # Frontend
   npm run build

   # Backend
   cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
   cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
   cargo test --manifest-path src-tauri/Cargo.toml
   ```

### PR Checklist

Before requesting review, confirm that your PR satisfies all of the following:

- [ ] My branch is up to date with `main` (rebased, no merge commits).
- [ ] My code follows the [Code Style Guidelines](#5-code-style-guidelines).
- [ ] My commits follow the [Conventional Commits](#6-commit-message-convention) format.
- [ ] I have added or updated tests for my changes (see [Testing Guidelines](#8-testing-guidelines)).
- [ ] I have updated the documentation (README, PRD, inline docs) if my change affects user-facing behavior or the API.
- [ ] `cargo fmt --check` passes.
- [ ] `cargo clippy` produces no warnings.
- [ ] `cargo test` passes.
- [ ] `npm run build` succeeds without errors.
- [ ] The app launches successfully with `npm run tauri dev` and my changes work as intended.
- [ ] I have linked the related issue in the PR description (e.g., "Closes #123").
- [ ] I have self-reviewed my diff and explained non-obvious design decisions in the PR description.

### PR Template

When you open a PR, please use the following structure in the description:

```markdown
## Description

<!-- A clear and concise description of what this PR does and why. -->

## Related Issue

Closes #<issue-number>
<!-- or -->
Related to #<issue-number>

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactor (no functional change)
- [ ] Performance improvement
- [ ] Test addition/improvement

## How Has This Been Tested?

<!-- Describe the tests you ran and how a reviewer can reproduce them. -->

## Screenshots / Recordings

<!-- If your change affects the UI, include before/after screenshots or a short recording. -->

## Checklist

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex/hard-to-understand code
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] No new warnings introduced
```

### Review Process

1. **Automated checks**: All CI checks (linting, formatting, tests, build) must pass before a PR can be merged.
2. **Peer review**: At least one maintainer must approve the PR. For significant changes (new features, architectural changes, breaking changes), two approvals may be required.
3. **Address feedback**: Please respond to all review comments. If you disagree with a suggestion, explain your reasoning respectfully. Do not dismiss feedback without discussion.
4. **Requested changes**: Push fixes as new commits (do not force-push during active review unless asked). The reviewer will re-review.
5. **Approval and merge**: Once approved, a maintainer will squash-merge your PR. You do not need to squash commits yourself unless asked.
6. **Timeline**: We aim to review PRs within **7 days**. If you have not heard back after 7 days, please politely ping the maintainers by leaving a comment on the PR.

---

## 8. Testing Guidelines

Testing is critical for a tool that developers rely on daily. We are steadily building out test coverage and welcome contributions that improve it.

### Rust Tests

Rust tests live alongside the source code using the standard `#[cfg(test)]` module pattern:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collection_new_generates_id() {
        let collection = Collection::new("My Collection");
        assert!(!collection.id.is_empty());
        assert_eq!(collection.name, "My Collection");
    }
}
```

Run all Rust tests:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Run a specific test:

```bash
cargo test --manifest-path src-tauri/Cargo.toml test_collection_new
```

**Guidelines for Rust tests:**
- Write unit tests for all public functions in the `db/`, `model/`, and `commands/` modules.
- Use a temporary SQLite database for database tests (create in a temp directory, tear down after the test).
- Test edge cases: empty input, maximum-length input, invalid input, boundary values.
- Name test functions descriptively: `test_<what>_<condition>` (e.g., `test_insert_collection_with_empty_name_returns_error`).

### Frontend Tests

As the frontend test framework is being established, prefer tests that verify component behavior and utility functions. When adding a utility function to `src/lib/utils/`, include a co-located test file.

**What to test:**
- Utility functions (pure functions in `src/lib/utils/`) -- test all branches.
- Store logic -- test state transitions and computed values.
- Component behavior -- test that user interactions produce the expected effects (especially Tauri `invoke()` calls with correct arguments).

**What not to test:**
- Implementation details that are likely to change (private functions, internal data structures).
- The Tauri runtime itself (mock `invoke()` calls).
- Third-party libraries.

### Manual Testing Checklist

Before submitting a PR that changes user-facing behavior, manually verify:

- [ ] The app launches without errors via `npm run tauri dev`.
- [ ] Core flows still work: send a request, view the response, save to a collection, switch environments.
- [ ] No new console errors or Rust panics appear during normal use.
- [ ] Both light and dark themes render correctly.
- [ ] The UI is usable at the minimum window size (1024x600).
- [ ] If you changed database logic, verify migrations work on an existing database file.

### Performance Testing

API Tester OSS prides itself on being lightweight. If your change could affect performance, check:

- [ ] Binary size has not increased significantly (target: <20MB).
- [ ] Idle RAM usage has not increased significantly (target: <80MB).
- [ ] Startup time has not regressed (target: <1 second).

---

## 9. Reporting Bugs

Bugs are tracked as GitHub Issues. Before opening a bug report, please:

1. **Search existing issues** (including closed ones) to avoid duplicates. If you find a match, add a thumbs-up reaction and any additional context as a comment.
2. **Update to the latest version** and verify the bug still exists.
3. **Collect debug info**: app version, OS, Rust/Node versions, and any error messages.

### Bug Report Template

When opening a bug report, use the following template (a GitHub issue template will guide you):

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Set '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Actual behavior**
What actually happened (error message, unexpected output, crash, etc.).

**Screenshots / Logs**
If applicable, add screenshots or paste relevant log output.
- Rust panic backtraces (if any)
- Browser console errors (right-click in dev tools of the Tauri window)
- Relevant Tauri console output

**Environment**
- OS: [e.g., Windows 11, macOS 14.2, Ubuntu 24.04]
- API Tester version: [e.g., 0.1.0]
- Node version: [run `node --version`]
- Rust version: [run `rustc --version`]
- Did you build from source or use a pre-built binary?

**Additional context**
Add any other context about the problem here (workarounds, when it started happening, etc.).
```

### Security Vulnerabilities

If you discover a security vulnerability, **do not open a public issue**. Instead, email the maintainers privately at **security@apitesteross.dev** (or the contact specified in the security policy). Include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce or a proof of concept.
- Any suggested mitigations.

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 90 days, coordinated with you before any public disclosure.

---

## 10. Suggesting Features

We love feature ideas! To maximize the chance your suggestion is accepted:

1. **Search existing issues** (open and closed) for similar suggestions.
2. **Open a discussion first** (if the project has GitHub Discussions enabled) or a feature request issue using the template below. This lets the community weigh in before you invest time coding.
3. **Align with the project vision**: API Tester OSS prioritizes being lightweight, offline-first, privacy-respecting, and 100% free. Features that add heavy dependencies, require cloud services, or introduce telemetry are unlikely to be accepted.

### Feature Request Template

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex: "I'm always frustrated when [...]"

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context, screenshots, or mockups about the feature request here.

**Would you be willing to contribute this feature?**
- [ ] Yes, I can implement this and submit a PR.
- [ ] Yes, but I need guidance on where to start.
- [ ] No, I'm just suggesting the idea.
```

### Scope and Prioritization

The maintainers prioritize features based on:
- Alignment with the project's lightweight, offline-first philosophy.
- Number of users who would benefit.
- Implementation complexity and maintenance burden.
- Whether the feature can be added without bloating the binary or memory footprint.

Features that are accepted will be labeled `enhancement` and may be tagged `good first issue` if they are beginner-friendly.

---

## 11. Areas Needing Contribution

We welcome contributions of all sizes. Here are areas where the project especially needs help:

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/api-tester-oss/api-tester/labels/good%20first%20issue) on GitHub. These are specifically chosen because they:
- Have a clear, well-defined scope.
- Do not require deep knowledge of the entire codebase.
- Include hints about which files to look at.
- Are great for getting familiar with the contribution workflow.

### Help Wanted

Issues labeled [`help wanted`](https://github.com/api-tester-oss/api-tester/labels/help%20wanted) are higher-priority items where we actively need community assistance. These may require more familiarity with the codebase.

### Ongoing Areas

| Area | Description | Difficulty |
|------|-------------|------------|
| **Protocol clients** | Improve GraphQL, WebSocket, gRPC, and SSE support | Medium-Hard |
| **Scripting engine** | Expand the `pm.*` API for pre-request and test scripts | Medium |
| **Import/Export** | Add support for more formats (OpenAPI, HAR, Insomnia export) | Easy-Medium |
| **Code snippets** | Add new language generators (PHP, Ruby, Dart, etc.) | Easy |
| **UI components** | Build new components or improve existing ones | Easy-Medium |
| **Documentation** | Improve README, add usage guides, write tutorials | Easy |
| **Testing** | Add unit and integration tests across the codebase | Easy-Medium |
| **Performance** | Optimize binary size, startup time, and memory usage | Hard |
| **Internationalization** | Add support for multiple languages in the UI | Medium |
| **Accessibility** | Improve keyboard navigation, screen reader support, ARIA | Medium |

### Your First Contribution

Never contributed to open source before? Here are some ideas:

- Fix a typo in the documentation.
- Improve an error message to be more helpful.
- Add a test for an existing utility function.
- Pick a `good first issue` and ask for help if you get stuck.

We are committed to helping first-time contributors. If you open a PR and need guidance, mention it in the PR description and a maintainer will help you through the process.

---

## 12. License

By contributing to API Tester OSS, you agree that your contributions will be licensed under the [**MIT License**](./LICENSE).

The MIT License is permissive: it allows anyone to use, copy, modify, merge, publish, distribute, sublicense, and even sell copies of the software, provided the original copyright notice and permission notice are included.

You do not need to sign a Contributor License Agreement (CLA). However, by submitting a pull request, you attest that:

1. You have the right to contribute the code you are submitting.
2. You are not knowingly infringing on any third party's intellectual property.
3. Your contribution is licensed under the same MIT License that covers the project.

If your contribution includes code from another source, you must:
- Credit the original author(s).
- Include the original license notice.
- Ensure the license is compatible with MIT (e.g., MIT, BSD, Apache 2.0).

---

## Acknowledgments

This contributing guide is inspired by the conventions of many great open-source projects, including the [Contributor Covenant](https://www.contributor-covenant.org/), [Conventional Commits](https://www.conventionalcommits.org/), and the Tauri, Svelte, and Rust communities.

Thank you for being part of API Tester OSS. Your time and effort make a real difference for developers who deserve a fast, free, and open API client.

---

*If you have questions about this guide or the contribution process, feel free to open a [discussion](https://github.com/api-tester-oss/api-tester/discussions) or reach out to the maintainers. We are here to help.*
