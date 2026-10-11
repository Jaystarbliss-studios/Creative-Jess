# Pilot Source Review: PhotoCraft, VectorCraft, DesignCraft

Reviewed public README, Cargo workspace manifest, and documented control/MCP protocol files on 2026-10-11. This is a documentation/manifest review only; no upstream checkout was built or run from this integration repository.

## Findings

| Project | Manifest version | Rust toolchain floor | License declared in workspace manifest | Agent interface documented | Integration notes |
|---|---:|---|---|---|---|
| [PhotoCraft](https://github.com/storytold/photocraft) | 0.7.0 | Rust 1.95, edition 2024 | MIT OR Apache-2.0 | CLI, JSON control protocol, MCP | Early alpha per README. Control protocol uses loopback plus a per-launch token. CLI MCP can run headlessly or bridge to a live UI. |
| [VectorCraft](https://github.com/storytold/vectorcraft) | 0.9.0 | Rust 1.95, edition 2024 | MIT OR Apache-2.0 | CLI, JSON control protocol, MCP | README documents native and WebAssembly targets. Control server is loopback-only but its documented protocol has no authentication token; prefer its stdio MCP server rather than exposing the control port to a browser. |
| [DesignCraft](https://github.com/storytold/designcraft) | Not captured in this review | README says Rust 1.95+ | README badge says MIT OR Apache-2.0; verify manifest/LICENSE | CLI, JSON control protocol, MCP | README documents native and browser targets. Its control server is loopback-only but unauthenticated in the reviewed docs; prefer stdio MCP via a local broker rather than browser-to-port requests. |

## Shared dependency observation

PhotoCraft and VectorCraft manifests both pin `craft-ui` from `storytold/craft-libs` at Git revision `5c874d51eeb3de70e735c8ce87a59a7dedd47675`, and both use Cargo workspace resolver 3, edition 2024, Rust 1.95, and a `wasm-release` profile. The shared dependency pin should be kept consistent in the first pilot. Do not upgrade one app's UI dependency in isolation without testing the other app and the shared crate.

## Implementation status in the integration shell

A generic local MCP subprocess broker has since been added to the integration branch. It starts configured CLI executables with fixed `mcp` arguments, performs MCP initialization, discovers the live `tools/list` catalog, validates tool names and a bounded JSON-schema subset, and forwards `tools/call` requests over stdio. Cloud and Ollama-compatible local AI can propose one discovered tool call, but execution remains behind an explicit user approval step. Automated CI uses a fake MCP CLI to test the protocol; **this does not mean PhotoCraft, VectorCraft, or DesignCraft themselves have been built or tested**.

## Recommended integration shape

1. **Use the local companion as a broker, not as a generic shell.** It should start only a configured, absolute CLI path with a fixed argument set. The browser must never supply a process path or arbitrary command-line arguments.
2. **Prefer stdio MCP for editor operations.** Each CLI subprocess should have a short, explicit timeout, a bounded request/response size, clean termination, and a normalized error result. Tool names and schemas must be discovered from the actual CLI `tools/list` response, not hard-coded from marketing copy.
3. **Separate read-only and write-capable tools.** Require a fresh user approval for file writes, exports that overwrite a target, destructive edits, or access to user files. Apply configured read/write roots wherever the upstream CLI supports them.
4. **Treat PhotoCraft as a candidate first pilot**, pending a reproducible Windows build and a real create/open/edit/save/export test. Its token-authenticated control protocol and documented headless MCP route are a good starting point, but the README itself labels the app early alpha.
5. **Use VectorCraft and DesignCraft as the next candidates**, only after the MCP subprocess broker exists and each app's CLI is built and smoke-tested. Do not point browser JavaScript directly at their unauthenticated loopback control ports.
6. **Keep browser WebAssembly builds as an optional later track.** Browser builds have different filesystem, GPU, and control-channel constraints; do not assume that a browser build has the same automation interface as the native app.

## Evidence and limitations

- PhotoCraft: `Cargo.toml` declares version 0.7.0, edition 2024, Rust 1.95, and `MIT OR Apache-2.0`; `docs/control-protocol.md` documents token authentication and file-root flags; `docs/mcp.md` documents headless and bridge MCP modes.
- VectorCraft: `Cargo.toml` declares version 0.9.0, edition 2024, Rust 1.95, and `MIT OR Apache-2.0`; `docs/control-protocol.md` explicitly says the control port has no authentication; `docs/mcp.md` documents a stdio MCP server with headless and connected modes.
- DesignCraft: `docs/control-protocol.md` documents loopback JSON control and says the control port has no authentication; `docs/mcp.md` documents a stdio MCP server with headless and connected modes. The manifest and exact version still need to be recorded.
- This review does not verify that any command builds on Windows, that an installed CLI exists, or that real editing/export operations pass. Keep all three at their existing unverified integration status until those tests are run.
