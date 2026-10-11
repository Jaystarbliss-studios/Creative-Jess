# Craft Workspace

Craft Workspace is the integration shell for the Storytold Craft repository ecosystem. It is being developed as a web application plus a local companion for native application access and local AI.

## Important implementation status

This repository contains a React/Vite workspace and an initial catalog of 21 upstream repository records. The catalog and workspace previews do not mean the upstream applications are integrated. The original upstream source repositories have not yet been built and smoke-tested from this project. A separate loopback-only companion is implemented for launching configured native executables, but it is not an editor API.

The project intentionally uses conservative integration statuses. Do not change a repository to build_passed, smoke_test_passed, or integrated_verified until the corresponding real test has passed and the result is documented.

## Current capabilities

- React + TypeScript workspace shell.
- Dark/light theme tokens.
- Application and supporting-repository directory.
- Initial project browser and workspace previews.
- Real file selection/import into IndexedDB-backed local asset storage, plus download of imported originals.
- Browser-local persistence for project metadata, active project selection, and theme preferences.
- Typed, fail-closed adapter registry with tests; no upstream editing/automation adapters are registered yet.
- Cloud/local AI mode selection.
- Cloud AI chat through a server-side Gemini API route when GEMINI_API_KEY is configured as a server-side secret.
- Ollama-compatible local chat and function-call requests, subject to local runtime, model tool-call support, and browser network/CORS policy.
- Loopback-only local companion that can launch explicitly configured native executables through a structured allowlisted command; it cannot execute arbitrary shell commands.
- Cloud AI can propose a native app launch through a constrained function declaration. The client requires explicit approval and a paired companion before sending the fixed launch command; no file editing is performed.
- Companion pairing token is generated at launch and printed locally; configured app paths are read from CRAFT_APP_PATHS_JSON.
- Persistent local MCP broker discovers tools from configured Craft CLI executables and invokes only tool names returned by each CLI's live tools/list response, with argument-schema validation and bounded requests.
- Companion health, pairing rejection, and unauthorized command requests are covered by a runtime test.
- Cloud and Ollama-compatible local AI can propose tool calls from configured MCP CLI catalogs. Each proposal requires explicit user approval; the companion validates the configured app/tool and arguments before forwarding a JSON-RPC tools/call request.

## Development

Use a supported Node.js release for the installed Vite version.

1. Install dependencies with npm install.
2. Copy .env.example to .env and set GEMINI_API_KEY if cloud AI is needed. Never put it in client-side code or commit the real .env file.
3. Run npm run dev to start the Vite-backed Express development server.
4. Run npm run lint and npm run build before pushing.
5. For production, build the frontend and run npm start with NODE_ENV=production.

GitHub Actions on the integration branch runs TypeScript checking, adapter/companion safety tests, and a production frontend build. These checks passed on commit 5b205f3908de63fdc2080724bab7abb4b6dfe60a. This verifies the workspace shell only; it does not compile or smoke-test the 21 upstream applications.

## Security notes

The AI endpoint has a same-origin check and a basic in-memory per-IP rate limit. These are not a substitute for user authentication. Before exposing the web service publicly, deploy it behind appropriate authentication or an access-controlled hosting layer. Cloud API keys must remain server-side. The AI assistant can propose launching a configured app or invoking a discovered MCP tool; the user must approve each proposal and the paired local companion must validate the app/tool ID and arguments. It cannot run arbitrary shell commands. Child processes receive an allowlisted operating-system environment rather than the companion's full environment, so provider API keys are not inherited.

Run npm run companion on the machine where native applications are installed. On Windows PowerShell, configure actual installed executable paths. These examples are illustrative; replace paths with the files installed on your machine:

    $env:CRAFT_APP_PATHS_JSON='{"photocraft":"C:\\Program Files\\PhotoCraft\\photocraft.exe"}'
    $env:CRAFT_MCP_PATHS_JSON='{"photocraft":"C:\\Program Files\\PhotoCraft\\photocraft-cli.exe","vectorcraft":"C:\\Program Files\\VectorCraft\\vectorcraft-cli.exe","designcraft":"C:\\Program Files\\DesignCraft\\designcraft-cli.exe"}'
    $env:CRAFT_MCP_SCOPED_ROOTS_JSON='{"photocraft":{"readRoot":"C:\\Users\\you\\Documents\\CraftProjects","writeRoot":"C:\\Users\\you\\Documents\\CraftProjects\\exports"},"vectorcraft":{"readRoot":"C:\\Users\\you\\Documents\\CraftProjects","writeRoot":"C:\\Users\\you\\Documents\\CraftProjects\\exports"}}'
    $env:CRAFT_MCP_EXTRA_ARGS_JSON='{"pdfcraft":["--root","C:\\Users\\you\\Documents\\CraftProjects"]}'
    $env:CRAFT_WORKSPACE_ORIGINS='http://localhost:3000'
    npm run companion

The path above is an example only; replace it with the real installed executable path. Set CRAFT_WORKSPACE_ORIGINS to the exact web origin that should be allowed to connect. The companion binds only to 127.0.0.1 and prints a fresh pairing token at startup. Enter that token in the workspace companion dialog. The companion supports fixed-path application launching and MCP tool discovery/calls for configured CLI executables. MCP support is not proof that an upstream editor is installed, built, or working. Set CRAFT_MCP_PATHS_JSON to absolute CLI executable paths. Optional CRAFT_MCP_SCOPED_ROOTS_JSON entries pass --automation-read-root and/or --automation-write-root only to app IDs explicitly configured for these flags; current PhotoCraft and VectorCraft documentation supports them. Unconfigured CLIs receive only the mcp subcommand. The broker discovers tools from tools/list and validates names plus a bounded JSON-schema subset before tools/call. Review each upstream CLI's actual filesystem permissions and tool effects before enabling it; generic filesystem sandboxing is not claimed. Every AI tool proposal requires explicit approval in the workspace. The companion process must run on the same computer as the configured apps. Review the protocol before production use.


## Run real upstream pilot verification

The **Upstream MCP pilot smoke tests** GitHub Actions workflow builds PhotoCraft and VectorCraft desktop packages and CLI packages on Windows, then launches each actual CLI in MCP mode and checks initialization plus a non-empty `tools/list` response. It runs automatically when the companion broker or upstream bootstrap/smoke scripts change, and can also be run manually from **Actions → Upstream MCP pilot smoke tests → Run workflow**. It can test the documented scoped filesystem-root flags. This is the first real-upstream verification gate; it does not yet prove editing/export acceptance workflows. Review both matrix jobs and download the small metadata artifacts if needed. Do not mark an app integrated until a real create/open/edit/save/export scenario has also passed.

## Building upstream apps on Windows

The companion can use real upstream CLI executables, but those binaries must exist on the computer running the companion. A starter script clones the core native creative applications plus the launcher, font utility, and repository-status utility into a separate ignored .upstream folder. It attempts release builds of matching desktop packages and any -cli packages, runs a real MCP initialize/tools-list smoke test for discovered CLIs, records per-repository logs, and generates local absolute-path settings. ArtCraft is opt-in because of its size. Shared libraries, the PSD fixture corpus, ArtCraft Services, and Terraform are not built by this script; they need separate dependency, licensing, security, or infrastructure review:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\bootstrap-upstream.ps1
.\config\local-companion-paths.ps1
npm run companion
```

The script requires Git, Node.js, and Rust 1.95 or newer. It does not overwrite existing checkouts and continues past per-app build failures. ArtCraft is very large and excluded by default; add -IncludeArtCraft to opt in. This is a build aid, not a verification claim: inspect each log, confirm the generated executable path, run the app, and test a real create/open/edit/save/export workflow. The bootstrap also creates `.upstream/CraftProjects` and `.upstream/CraftProjects/exports`, and configures those scoped roots only for PhotoCraft and VectorCraft when their CLIs are found. **Files imported into the browser workspace are stored in browser IndexedDB and are not automatically synchronized to disk.** Use **Export to folder** in Projects and select `.upstream/CraftProjects`; the workspace writes real imported bytes into a new project subfolder that the scoped PhotoCraft/VectorCraft tools can read. Exported files are copies; edits made by a native app are not automatically synced back into browser IndexedDB. ArtCraft Services and Terraform are deliberately excluded because they require separate security/deployment review.

## Upstream repositories

The application directory references repositories under the storytold GitHub organization. Audit each repository's current source, license, dependencies, build targets, documented automation interface, and tests before integrating it. Do not infer versions, licenses, file formats, CLI options, MCP support, or runtime support from names or mock metadata.

## Architecture principles

1. Keep this integration shell separate from upstream application repositories.
2. Prefer documented APIs, CLI interfaces, MCP tools, and JSON control protocols over UI automation.
3. Keep cloud provider secrets on the server.
4. Treat browser, local companion, cloud service, and AI model as separate trust boundaries.
5. Never expose arbitrary shell execution to the browser or AI.
6. Preserve native files and require confirmation for destructive actions.
7. Show actual build and test status; never manufacture successful results.
8. Treat local workspace editor screens as previews until connected to and validated against upstream code.

See docs/REPOSITORY_DISCOVERY.md for the GitHub metadata snapshot and license/size caveats. See docs/INTEGRATION_STATUS.md for the staged integration plan and verification baseline.
