# Craft Workspace

Craft Workspace is the integration shell for the Storytold Craft repository ecosystem. It is being developed as a web application first, with a planned local companion for native application access and local AI.

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
- Ollama-compatible local chat requests, subject to local runtime and browser network/CORS policy.
- Loopback-only local companion that can launch explicitly configured native executables through a structured allowlisted command; it cannot execute arbitrary shell commands.
- Cloud AI can propose a native app launch through a constrained function declaration. The client requires explicit approval and a paired companion before sending the fixed launch command; no file editing is performed.
- Companion pairing token is generated at launch and printed locally; configured app paths are read from CRAFT_APP_PATHS_JSON.
- Companion health, pairing rejection, and unauthorized command requests are covered by a runtime test.
- The only AI-proposed native action currently supported is opening a configured application. No upstream editor operations are exposed.

## Development

Use a supported Node.js release for the installed Vite version.

1. Install dependencies with npm install.
2. Set GEMINI_API_KEY in the server environment if cloud AI is needed. Never put it in client-side code or commit it.
3. Run npm run dev to start the Vite-backed Express development server.
4. Run npm run lint and npm run build before pushing.
5. For production, build the frontend and run npm start with NODE_ENV=production.

GitHub Actions on the integration branch runs TypeScript checking, adapter/companion safety tests, and a production frontend build. These checks passed on commit 5b205f3908de63fdc2080724bab7abb4b6dfe60a. This verifies the workspace shell only; it does not compile or smoke-test the 21 upstream applications.

## Security notes

The AI endpoint has a same-origin check and a basic in-memory per-IP rate limit. These are not a substitute for user authentication. Before exposing the web service publicly, deploy it behind appropriate authentication or an access-controlled hosting layer. Cloud API keys must remain server-side. The AI assistant can only propose launching a configured app; the user must approve the proposal and the paired local companion must authorize the app ID. It cannot edit project files or run arbitrary commands.

Run npm run companion on the machine where native applications are installed. On Windows PowerShell, configure the actual executable path, then start the companion:

    $env:CRAFT_APP_PATHS_JSON='{"photocraft":"C:\\CraftApps\\PhotoCraft\\photocraft.exe"}'
    npm run companion

The path above is an example only; replace it with the real installed executable path. Set CRAFT_WORKSPACE_ORIGINS to the exact web origin that should be allowed to connect. The companion binds only to 127.0.0.1 and prints a fresh pairing token at startup. Enter that token in the workspace companion dialog. It currently supports process launch only; it does not prove editor readiness, edit files, or expose arbitrary shell execution. The companion process must be run on the same computer as the configured apps. Review the protocol before production use.

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
