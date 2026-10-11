# Integration Status and Verification Plan

Last updated: 2026-10-11

## Baseline

- Integration shell repository: Jaystarbliss-studios/Creative-Jess
- Default branch at audit start: main
- Workspace stack observed: React, TypeScript, Vite, Tailwind CSS.
- Upstream catalog size: 21 repositories.
- GitHub repository metadata checked for all 21 catalog entries; see REPOSITORY_DISCOVERY.md. This is metadata discovery only, not source inspection.
- Upstream repositories built and smoke-tested from this workspace: 0 verified by this audit.
- Local companion: loopback-only Node/Express service supports configured executable launches plus a persistent stdio MCP broker for configured CLI paths. CI covers health/pairing rejection, MCP tool discovery, schema validation, and the frontend build. The broker has not yet been tested against real upstream CLI binaries.
- File import: Project Browser uses IndexedDB to store real selected file bytes and localStorage for project metadata. Download of imported originals is implemented. Suggested app mappings do not imply format compatibility.
- Cloud AI route: server-side Gemini route added; requires GEMINI_API_KEY and a protected deployment.
- Local AI: Ollama-compatible browser request can be attempted, but success depends on the local runtime and browser network policy.
- Integration shell validation: passed in GitHub Actions on commit e28735de020adf925b3a788dd3370431255cb3dc (TypeScript check, adapter safety tests, local companion health/pairing/authorization test, production frontend build).
- Upstream app builds and smoke tests: still not run; shell CI does not prove upstream integration.

The earlier catalog contained specific versions, licenses, crate counts, file formats, and statements such as “integrated and verified” without supporting build logs or test evidence in this repository. Catalog metadata has been made conservative until each upstream repository is audited. GitHub metadata reports no SPDX license for artcraftx and craft-repo-status-app and reports NOASSERTION for artcraft-services; resolve these before redistribution/reuse. ArtCraft and ArtCraft Services report unusually large repository sizes, so inspect manifests and asset/LFS/history structure before a full clone.

The integration shell now includes a typed adapter registry. It fails closed when an app adapter or capability is missing, validates arguments when a validator is supplied, checks adapter health before execution, and validates result shape. The companion can launch configured apps using a fixed open-app command and can discover/call tools from configured MCP CLI processes using JSON-RPC over stdio. AI can propose these tool calls, but the user must approve each proposal. No real upstream CLI has yet been configured and smoke-tested in this workspace.

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
| photocraft | not_inspected | inspect manifests, web build, CLI/JSON/MCP interface, real import/export |
| artcraftx | not_inspected | inspect actual role, dependencies, and supported execution target |
| lightcraft | not_inspected | inspect RAW codecs, native/web support, and sample export |
| filmcraft | not_inspected | inspect timeline engine, media dependencies, automation API, sample render |
| artcraft-services | not_inspected | audit API, auth, deployment, secrets, dependencies, and license |
| vectorcraft | not_inspected | inspect build targets, documented control interface, SVG round trip |
| craft-launcher | not_inspected | inspect launcher/update behavior and security boundaries |
| craft-fonts | not_inspected | inspect font catalog, font licenses, distribution constraints |
| cadcraft | not_inspected | inspect geometry engine, import/export, precision tests |
| wordcraft | not_inspected | inspect document model, file compatibility, save/export tests |
| soundcraft | not_inspected | inspect audio backend, device permissions, export tests |
| pdfcraft | not_inspected | inspect PDF engine, licensing, annotation/edit capabilities |
| designcraft | not_inspected | inspect layout engine, browser/native parity, export tests |
| effectcraft | not_inspected | inspect rendering backend, GPU needs, automation interfaces |
| deckcraft | not_inspected | inspect slide model and PPTX import/export behavior |
| craft-libs | not_inspected | inspect public APIs, dependency compatibility, license |
| gridcraft | not_inspected | inspect formula engine, import/export, persistence tests |
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
