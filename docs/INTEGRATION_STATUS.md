# Integration Status and Verification Plan

Last updated: 2026-10-11

## Baseline

- Integration shell repository: Jaystarbliss-studios/Creative-Jess
- Default branch at audit start: main
- Workspace stack observed: React, TypeScript, Vite, Tailwind CSS.
- Upstream catalog size: 21 repositories.
- GitHub repository metadata checked for all 21 catalog entries; see REPOSITORY_DISCOVERY.md. This is metadata discovery only, not source inspection.
- Upstream verification: Windows Server 2025 CI built desktop + CLI packages and completed MCP initialize/tools/list for PhotoCraft (21 tools), VectorCraft (32), DesignCraft (25), PDFCraft (145), LightCraft (326), FilmCraft (17), EffectCraft (27), WordCraft (16), DeckCraft (25), GridCraft (21), CADCraft (11), and SoundCraft (17). The smoke test also executed a read-only zero-argument command for PhotoCraft, VectorCraft, DesignCraft, LightCraft, FilmCraft, EffectCraft, WordCraft, DeckCraft, and GridCraft. CADCraft and SoundCraft had no eligible zero-argument read-only tool in the advertised schemas. This is real build/protocol/read-only-call evidence, not proof of create/edit/save/export acceptance. Real MCP acceptance scenarios are included for PhotoCraft (create/inspect/export PNG), VectorCraft (create document, draw a rectangle, inspect and export SVG), WordCraft (create/type/read/save Markdown), GridCraft (create/write/read/save CSV), and DeckCraft (create a presentation, insert text, inspect the slide, export PPTX, and validate its ZIP signature). These scenarios must pass CI before any app is counted as `integrated_verified`; PhotoCraft's current scenario validates document creation/export but does not yet prove a pixel-edit operation. Workflow run `38165237565` passed PDFCraft's desktop/CLI build and MCP discovery (145 tools, with read-only `doc_list` successful). The newer acceptance-scenario workflow remains queued.
- Local companion: loopback-only Node/Express service supports configured executable launches plus a persistent stdio MCP broker for configured CLI paths. CI covers health/pairing rejection, MCP tool discovery, schema validation, and the frontend build. The real VectorCraft CLI at upstream commit `53bc86fdb454ed33cd26cba5e29695ebe0befeff` passed MCP initialize/tools/list and reported 32 tools; the real PhotoCraft CLI at upstream commit `e5dbcab335b16ca99f540f97b27d08ef60e6626d` passed the same check and reported 21 tools in workflow run `38162282458`. No tool-call or editing/export acceptance operation has been verified yet.
- File import: Project Browser uses IndexedDB to store real selected file bytes and localStorage for project metadata. Download of imported originals is implemented. Suggested app mappings do not imply format compatibility.
- Cloud AI route: server-side Gemini route added; requires GEMINI_API_KEY and a protected deployment.
- Local AI: the workspace lets the user set an Ollama-compatible endpoint and model, saves those preferences on the device, and tests `/api/tags`. Chat/function calling still depends on the local runtime, model support, and browser CORS/network policy.
- Integration shell validation: passed in GitHub Actions on commit e28735de020adf925b3a788dd3370431255cb3dc (TypeScript check, adapter safety tests, local companion health/pairing/authorization test, production frontend build).
- Upstream build/protocol evidence: Windows GitHub Actions run `38165071495` passed build + MCP smoke checks for PhotoCraft, DesignCraft, WordCraft, DeckCraft, CADCraft, SoundCraft, EffectCraft, FilmCraft, and GridCraft; run `38165237565` passed the full 12-app matrix, including PDFCraft (145 tools; read-only `doc_list` call succeeded). The real smoke test reports the requested scoped-root flags, not that an app enforces them; containment has not been tested. These runs do not prove editing, saving, or export acceptance.

The earlier catalog contained specific versions, licenses, crate counts, file formats, and statements such as “integrated and verified” without supporting build logs or test evidence in this repository. Catalog metadata has been made conservative until each upstream repository is audited. GitHub metadata reports no SPDX license for artcraftx and craft-repo-status-app and reports NOASSERTION for artcraft-services; resolve these before redistribution/reuse. ArtCraft and ArtCraft Services report unusually large repository sizes, so inspect manifests and asset/LFS/history structure before a full clone.

The integration shell now includes a typed adapter registry. It fails closed when an app adapter or capability is missing, validates arguments when a validator is supplied, checks adapter health before execution, and validates result shape. The companion can launch configured apps using a fixed open-app command and can discover/call tools from configured MCP CLI processes using JSON-RPC over stdio. AI can propose these tool calls, but the user must approve each proposal. PhotoCraft and VectorCraft have passed real CLI MCP initialization and tool discovery in Windows CI; no actual tool-call, file-edit, save, or export acceptance operation has been verified yet.

## Status definitions

- not_inspected: upstream source has not been reviewed for this integration.
- inspected: source and relevant build/configuration files reviewed.
- build_attempted: an actual build was attempted and its result recorded.
- build_passed: the stated build command completed successfully in a named environment.
- smoke_test_passed: at least one documented real operation succeeded.
- integration_in_progress: adapter implementation is in progress.
- integrated_verified: acceptance tests passed for the defined integration.
- blocked: a specific issue prevents progress.
- unsupported_in_environment: required runtime or platform is unavailable.

A UI preview, mocked result, screenshot, or successful TypeScript compilation is not evidence that an upstream editor works.

## Initial repository list

| Repository | Initial status | Next verification |
|---|---|---|
| artcraft | not_inspected | inspect license, web/native build, model/service dependencies |
| photocraft | smoke_test_passed | 21 MCP tools; read-only command_list call succeeded; file-edit/save/export acceptance still pending |
| artcraftx | not_inspected | inspect actual role, dependencies, and supported execution target |
| lightcraft | smoke_test_passed | 326 MCP tools; read-only command_list call succeeded; RAW/sample export round trip still pending |
| filmcraft | smoke_test_passed | 17 MCP tools; read-only command_list call succeeded; media import/render/export round trip still pending |
| artcraft-services | not_inspected | audit API, auth, deployment, secrets, dependencies, and license |
| vectorcraft | smoke_test_passed | 32 MCP tools; read-only command_list call succeeded; SVG round trip still pending |
| craft-launcher | not_inspected | inspect launcher/update behavior and security boundaries |
| craft-fonts | not_inspected | inspect font catalog, font licenses, distribution constraints |
| cadcraft | build_passed | 11 MCP tools discovered; no zero-argument read-only call available in smoke test; drawing/export acceptance pending |
| wordcraft | smoke_test_passed | 16 MCP tools; read-only list_commands call succeeded; document create/edit/export acceptance pending |
| soundcraft | build_passed | 17 MCP tools discovered; no zero-argument read-only call available in smoke test; audio/session acceptance pending |
| pdfcraft | smoke_test_passed | 145 MCP tools; read-only doc_list call succeeded; real PDF open/edit/save/export acceptance still pending |
| designcraft | smoke_test_passed | 25 MCP tools; read-only list_commands call succeeded; document create/edit/export acceptance pending |
| effectcraft | smoke_test_passed | 27 MCP tools; read-only list_commands call succeeded; composition/render acceptance still pending |
| deckcraft | smoke_test_passed | 25 MCP tools; read-only list_commands call succeeded; presentation create/edit/export acceptance pending |
| craft-libs | not_inspected | inspect public APIs, dependency compatibility, license |
| gridcraft | smoke_test_passed | 21 MCP tools; read-only list_commands call succeeded; workbook/formula/export acceptance pending |
| craft-repo-status-app | not_inspected | inspect repository diagnostics and automation interface |
| photocraft-corpus | not_inspected | inspect asset provenance, license, and fixture conventions |
| terraform-aws-observability-accelerator | not_inspected | inspect modules and docs; never provision without explicit approval |

## Phased execution

1. Audit README, license, manifests, CI, build scripts, entry points, tests, and automation interfaces for all repositories.
2. Attempt reproducible builds in compatible environments and record exact commands, OS/runtime versions, and logs.
3. Verify navigation, themes, keyboard access, responsive layout, project state, and honest status labels.
4. Implement typed adapter capabilities, health checks, validated inputs, timeouts, cancellation, and normalized errors.
5. Choose pilot integrations from real source and build results, not from names.
6. Extend secure local pairing, origin checks, capability allowlists, structured arguments, and operation confirmation; the current companion enforces these boundaries for app launches and MCP calls.
7. Verify cloud and local provider connections; protect public AI routes with authentication.
8. Expose only documented, tested application operations to AI.
9. Integrate remaining apps in dependency-aware order with per-app acceptance tests.
10. Package and deploy only after build, security, and smoke tests pass.

## Acceptance test template

For every app, document:
- Upstream commit SHA and license evidence.
- OS and runtime versions.
- Build command and exit code.
- Test command and exit code.
- Real input fixture.
- Operation performed.
- Output path/format and validation method.
- Error/timeout behavior.
- Adapter permissions.
- Known limitations.
- Date and result.

Do not mark an app verified until these fields contain evidence.
