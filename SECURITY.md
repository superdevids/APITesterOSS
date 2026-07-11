# Security Policy

## Reporting a Vulnerability

The API Tester OSS maintainers take security reports seriously. We appreciate
responsible disclosure and will make every effort to acknowledge and address
reports promptly.

### Supported Versions

Only the most recent release receives security updates. Users are strongly
encouraged to run the latest version.

| Version | Supported          | Status        |
|---------|--------------------|---------------|
| 0.1.x   | :white_check_mark: | Current       |
| < 0.1.0 | :x:                | Not supported |

### Private Disclosure Process

**Do not open a public GitHub issue for security vulnerabilities.**

Please report suspected vulnerabilities through one of the following private
channels, in order of preference:

1. **GitHub Security Advisory (preferred)**
   - Navigate to the repository's **Security** tab.
   - Select **Advisories** and click **Report a vulnerability**.
   - Fill in the advisory form with reproduction steps and impact assessment.

2. **Email**
   - Send a PGP-encrypted report to: **security@apitesteross.dev**
   - Public key fingerprint:
     `0xAB12 CD34 EF56 7890 1234 5678 9ABC DEF0 1234 5678`
   - If you cannot encrypt, plain email is acceptable; please do not include
     live secrets or production credentials.

### What to Include in a Report

To help us triage and fix the issue quickly, please provide:

- A clear description of the vulnerability and its impact.
- The affected version (run *Help → About* in the app, or check
  `package.json`).
- Step-by-step reproduction instructions (minimal repro preferred).
- Proof-of-concept code, request payloads, or screenshots if applicable.
- Your assessment of severity (Low / Medium / High / Critical).
- Suggested mitigation or fix, if you have one.
- Your contact details for follow-up questions.

### Response Timeline

| Stage                        | Target      |
|------------------------------|-------------|
| Acknowledgement of report    | Within 48 hours |
| Initial assessment & severity | Within 5 business days |
| Fix or mitigation released   | Within 30 days (High/Critical sooner) |
| Public advisory published    | After fix is available, or 90 days |

We will keep you informed at each stage and credit you in the advisory unless
you prefer to remain anonymous.

### Scope

In scope:

- The API Tester OSS desktop application (Tauri 2.x runtime and Svelte
  front-end).
- Local SQLite storage handling of collections, environments, and history.
- Import/export parsers (Postman, Insomnia, Bruno).
- The embedded Boa scripting sandbox (when released).
- Code snippet generation output that could lead to injection or unsafe code
  execution when copy-pasted.

Out of scope:

- Vulnerabilities in third-party dependencies not reachable through the
  application. Please report those upstream.
- Issues requiring physical access to an unlocked, unattended machine.
- Self-XSS or issues only exploitable by importing a malicious collection the
  user explicitly chose to load (though we still welcome hardening
  suggestions).

---

## Security Measures

API Tester OSS is designed with a **local-first, zero-telemetry** philosophy.
The following measures are in place:

### Local-Only Storage

- All application data — collections, folders, environments, variables,
  request/response history, and settings — is stored in an
  **application-scoped SQLite database** on the user's local filesystem.
- No data ever leaves the machine unless the user explicitly exports it.
- The database file is created under the OS-specific application data directory
  (e.g., `%APPDATA%` on Windows, `~/Library/Application Support` on macOS,
  `~/.local/share` on Linux) with restrictive file permissions.

### No Telemetry, No Analytics, No Cloud Sync

- The application makes **zero outbound network requests** for telemetry,
  crash reporting, usage analytics, or feature flags.
- There is no account system, no login, and no cloud backend.
- Update checks, if enabled, are user-initiated and fetch only the release
  manifest from GitHub Releases; no usage data is transmitted.
- The only network traffic the application generates is the HTTP/gRPC/WebSocket
  traffic the user explicitly sends to their target APIs.

### Sandboxed Script Execution

- Pre-request and post-response scripts (planned feature) execute inside the
  **Boa** JavaScript engine — a pure-Rust, embedded interpreter with **no
  Node.js, no `require`, no filesystem access, and no network egress**.
- Scripts are constrained to a limited global scope: variable get/set,
  environment switching, assertions, and logging to the in-app console.
- There is no access to `process`, `child_process`, native modules, or the
  host filesystem from scripts.

### Secret Handling

- Variables marked as **secret** are:
  - Masked in the UI (displayed as `••••••••`).
  - Excluded from collection and environment exports unless the user
    explicitly opts in.
  - Redacted in request/response history entries.
  - Never written to application logs or crash dumps.

### Dependency Hygiene

- Dependencies are pinned and reviewed on upgrade.
- `npm audit` is run on every CI build; high-severity findings block release.
- The Tauri backend is a minimal Rust binary with a deliberately small
  dependency surface to reduce supply-chain risk.

### Binary Integrity

- Release binaries are built in CI from tagged commits.
- SHA-256 checksums are published alongside every release.
- Where supported by the platform, binaries are signed (macOS notarization,
  Windows Authenticode) — see release notes for current signing status.

---

## Best Practices for Users

While API Tester OSS is designed to be safe by default, users handling
sensitive APIs should follow these practices:

### 1. Use Secret Variables for Credentials

- Store tokens, API keys, passwords, and client secrets in variables marked as
  **Secret**.
- Secret variables are masked in the UI, excluded from exports, and redacted
  in history — preventing accidental exposure in screenshots, screen shares,
  or shared exports.

### 2. Never Share Environments Containing Secrets

- Environment files can be shared for convenience, but always review them
  before sharing.
- Use the **"Exclude secrets on export"** option (enabled by default) when
  exporting environments for teammates.
- Prefer sharing a template environment with placeholder values and instruct
  recipients to fill in their own credentials locally.

### 3. Be Cautious When Importing Collections

- Imported collections (Postman, Insomnia, Bruno) may contain pre-configured
  auth, scripts, or URLs pointing to unexpected hosts.
- Review the import summary before applying it.
- Treat collections from untrusted sources with the same caution as any other
  untrusted code — scripts in particular can perform assertions and variable
  manipulation on your machine.

### 4. Rotate Compromised Credentials

- If you suspect a credential was exposed (e.g., exported accidentally, shown
  in a screen share, or present in a history entry on a shared machine),
  **rotate it immediately** at the issuing provider.
- Clear the local history (*Settings → Clear History*) and update the
  affected secret variable.

### 5. Protect the Local Database

- The SQLite database is protected by OS-level file permissions, but anyone
  with physical access to your machine or malware on it can read it.
- Use full-disk encryption (BitLocker, FileVault, LUKS) on machines used for
  API testing.
- Do not store production credentials on shared or unmanaged devices.

### 6. Keep the Application Updated

- Run the latest version to receive security fixes.
- Verify the SHA-256 checksum of downloaded binaries against the published
  release manifest before running.

### 7. Review Scripts Before Execution

- When the scripting engine is released, review any pre-request or
  post-response scripts included in shared collections.
- Although scripts run in a sandbox without network or filesystem access, they
  can still overwrite variables, alter request payloads, and emit console
  output. Understand what a script does before running it.

---

## Contact

- **Security reports:** security@apitesteross.dev (PGP preferred)
- **General security discussions:** open a draft GitHub Security Advisory
- **Security-related PRs:** welcome; please reference the advisory or issue
  number in the commit message.

This policy is reviewed and updated with each release. Last reviewed:
**2026-07-10** for version **0.1.0**.
