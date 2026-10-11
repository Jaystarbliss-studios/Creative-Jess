# Upstream repository audit — evidence collected

Audit date: 2026-10-11  
Scope: public repository README and root-directory/manifests review. This is a preliminary source-discovery audit, **not a build or integration verification report**.

## Key findings

1. The primary creative applications are mostly Rust Cargo workspaces with root Cargo.lock files, application directories, crate directories, and an xtask build/tooling directory. They should be built and tested individually before choosing integration boundaries.
2. Multiple READMEs explicitly document agent-oriented interfaces such as CLI, MCP, or control channels. These are promising adapter paths, but their commands must be checked against the current source and smoke-tested before exposing them to AI.
3. Many app repositories include LICENSE-MIT and LICENSE-APACHE files. That does not automatically clear all bundled fonts, test assets, codecs, model services, or third-party dependencies for redistribution.
4. ArtCraft Services is a separate Rust/TypeScript service monorepo with backend APIs, workers, and web frontends. Its root listing includes an .env entry and a secrets directory. Do not read, copy, or deploy these materials as part of this integration until their contents and history have been reviewed by the repository owner. If any real credentials were committed, revoke and rotate them.
5. The AWS Observability Accelerator is infrastructure-as-code and must remain separate from end-user creative applications. Never provision its resources automatically.
6. No upstream application has been compiled, launched, or smoke-tested by this audit. The integration registry therefore remains conservative.

## README and manifest observations

| Repository | Evidence reviewed | Initial technical direction | Verification still required |
|---|---|---|---|
| artcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace with a desktop application as a default member; treat its documented web/frontend and service dependencies separately | inspect AGENTS.md, workspace members, frontend build, service contracts, license details, then build native/web targets |
| photocraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README has sections for PSD, headless operations, and agent/MCP use | inspect command schemas and app entry points; build CLI and web/native targets; real import/edit/save/export smoke test |
| artcraftx | README.md and root Cargo.toml | Rust workspace with crates and frontend; README describes a desktop AI-creation application | determine relation to ArtCraft, model providers, native build requirements, and whether a supported public automation interface exists |
| lightcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace with apps/crates/xtask; photo and RAW workflows | inspect codec and camera-profile dependencies, browser/native targets, build and sample export |
| filmcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README covers editing, color, effects, audio, codecs, export, and interchange | identify native media dependencies, build targets, automation interface, and test a real media export |
| artcraft-services | README.md, root Cargo.toml, root file listing; LICENSE.md present | Rust/TypeScript service monorepo with backend, HTTP API, background workers, and frontends | security review of .env/secrets references, auth, migrations, deployment, API schemas, and third-party license obligations |
| vectorcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README includes quick start and agent-oriented workflows | verify supported CLI/MCP/control protocol and run SVG open/edit/export round trip |
| craft-launcher | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace for installing/updating/launching the app suite | inspect install locations, signatures, update trust, platform support, and invocation contract |
| craft-fonts | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace with font assets | audit font-by-font licenses and distribution restrictions; inspect APIs |
| cadcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README includes CLI/MCP-oriented instructions | verify interface schemas, geometry behavior, supported exchange formats, and output validation |
| wordcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README documents CLI/MCP-oriented workflows | inspect document model, command schemas, supported formats, and real save/export behavior |
| soundcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README documents recording, editing, mixing, and agent/script workflows | verify audio device handling, platform dependencies, command protocol, and actual export |
| pdfcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; PDF workbench | inspect PDF engine and licenses, web/native targets, annotation/edit support, and real-file smoke tests |
| designcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; page layout/publishing and graphics backend | inspect web build instructions and limitations, output formats, and representative export |
| effectcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; motion graphics, effects, and agent-oriented sections | verify rendering/GPU dependencies, tool protocol, build targets, and rendered output |
| deckcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; presentations and slide shows, with CLI/MCP-oriented documentation | verify slide file interchange, rendering/export, and app-control schema |
| craft-libs | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Shared Rust workspace libraries used by Craft apps | inspect crate public APIs, dependency versions, and compatibility before reuse |
| gridcraft | README.md, root Cargo.toml, root file listing; MIT/Apache license files present | Rust workspace; README documents spreadsheet/data workflows and CLI/MCP/control-channel sections | verify formula engine, import/export, app-control protocol, and data round trips |
| craft-repo-status-app | README.md, root Cargo.toml, Makefile and UI directory | Local Rust workspace with a repository-status dashboard and cache | inspect local config, polling/auth behavior, build and test commands; classify as developer diagnostics |
| photocraft-corpus | README.md, root file listing, LICENSE-MIT/LICENSE-APACHE, NOTICE, SHA256SUMS | Test corpus with validation oracles | verify checksums, provenance, fixture licensing, and consumption workflow before use |
| terraform-aws-observability-accelerator | README.md and root listing with Terraform files/modules/examples | Infrastructure-as-code, separate from creative applications | inspect provider versions, plan/test workflows, costs, IAM requirements, and security; never run apply without explicit approval |

## Cargo workspace versions observed

The following version strings were read from root Cargo.toml workspace metadata. They are manifest values, not release or build verification.

| Repository | Workspace version |
|---|---:|
| photocraft | 0.7.0 |
| lightcraft | 0.6.0 |
| filmcraft | 0.6.0 |
| vectorcraft | 0.9.0 |
| cadcraft | 0.5.0 |
| wordcraft | 0.5.0 |
| soundcraft | 0.5.0 |
| pdfcraft | 0.6.0 |
| designcraft | 0.6.0 |
| effectcraft | 0.8.0 |
| deckcraft | 0.5.0 |
| gridcraft | 0.5.0 |
| craft-launcher | 0.2.1 |
| craft-fonts | 0.1.0 |
| craft-libs | 0.1.0 |
| craft-repo-status-app | 0.1.0 |

ArtCraft, ArtCraft-X, and ArtCraft Services have workspace manifests whose versioning is not recorded in this table because their root metadata requires further inspection. The Terraform repository is not a Rust workspace.

## Integration priority

1. **Audit first:** resolve ArtCraft Services security and licensing questions; inspect the real adapter interfaces for PhotoCraft, VectorCraft, WordCraft, GridCraft, and the other apps.
2. **Pilot based on evidence:** PhotoCraft and VectorCraft are candidates because their READMEs describe headless or agent-oriented workflows. Do not assume an API is usable until its schema and behavior are tested.
3. **Reuse upstream mechanisms:** prefer documented CLI/MCP/JSON/control channels. Avoid copying editor implementations into the shell or rebuilding editors from scratch.
4. **Keep the local companion separate:** the integration branch now includes a loopback-only companion and a persistent stdio MCP broker. CI tests pairing/auth boundaries and the protocol against a fake CLI. This verifies the broker implementation only; it does not verify any upstream creative app. The broker does not claim generic filesystem sandboxing, so inspect each upstream CLI's file-access and destructive-operation behavior before enabling it.
5. **Gate statuses:** keep the source-audit finding separate from runtime status. An app may have a recorded Windows build/MCP smoke pass while source, bundled assets, and licenses remain incompletely audited. Do not mark `integrated_verified` until a real input fixture completes the app's create/open/edit/save/export acceptance workflow and output is independently validated.
