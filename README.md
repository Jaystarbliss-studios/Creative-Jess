# Craft Workspace

Craft Workspace is the integration shell for the Storytold Craft repository ecosystem. It is being developed as a web application first, with a planned local companion for native application access and local AI.

## Important implementation status

This repository currently contains a React/Vite workspace prototype and an initial catalog of 21 upstream repository records. The catalog and workspace previews do not mean the upstream applications are integrated. The original upstream source repositories have not yet been built and smoke-tested from this project, and no native companion implementation is included here.

The project intentionally uses conservative integration statuses. Do not change a repository to build_passed, smoke_test_passed, or integrated_verified until the corresponding real test has passed and the result is documented.

## Current capabilities

- React + TypeScript workspace shell.
- Dark/light theme tokens.
- Application and supporting-repository directory.
- Initial project browser and workspace previews.
- Cloud/local AI mode selection.
- Cloud AI chat through a server-side Gemini API route when GEMINI_API_KEY is configured as a server-side secret.
- Ollama-compatible local chat requests, subject to local runtime and browser network/CORS policy.
- Local companion health and pairing attempts fail closed rather than simulating a successful connection.
- No upstream application commands are exposed as AI tools yet.

## Development

Use a supported Node.js release for the installed Vite version.

1. Install dependencies with npm install.
2. Set GEMINI_API_KEY in the server environment if cloud AI is needed. Never put it in client-side code or commit it.
3. Run npm run dev to start the Vite-backed Express development server.
4. Run npm run lint and npm run build before pushing.
5. For production, build the frontend and run npm start with NODE_ENV=production.

The GitHub connector session used for these edits does not provide a Node runtime, so no local build or type-check result is claimed by these commits. CI should provide that verification.

## Security notes

The AI endpoint has a same-origin check and a basic in-memory per-IP rate limit. These are not a substitute for user authentication. Before exposing this service publicly, deploy it behind appropriate authentication or an access-controlled hosting layer. Cloud API keys must remain server-side. The AI assistant currently has no permission to execute application tools.

The local companion is not included in this repository. Pairing and command requests will only be considered successful if a real companion returns an explicit successful response. The corresponding companion protocol must be implemented and reviewed before production use.

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

See docs/INTEGRATION_STATUS.md for the staged integration plan and verification baseline.
