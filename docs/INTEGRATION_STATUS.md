# Craft Workspace Integration Status

Last updated: 2026-10-12

## Current status at a glance

This repository is the integration shell for 21 upstream `storytold/*` repositories. It does not merge or rewrite their source. The web workspace, local companion, project file bridge, and AI routing are developed here; the upstream editors remain independent applications.

**Verified in Windows CI so far**

- All 12 native creative apps in the pilot matrix built their desktop and CLI packages and completed real MCP initialization plus `tools/list`: PhotoCraft, VectorCraft, LightCraft, FilmCraft, EffectCraft, SoundCraft, WordCraft, DesignCraft, DeckCraft, PDFCraft, CADCraft, and GridCraft.
- Five create/edit/save/export acceptance scenarios passed in run [38202304968](https://github.com/Jaystarbliss-studios/Creative-Jess/actions/runs/38202304968): PhotoCraft PNG, PDFCraft open/rotate/save PDF, WordCraft Markdown, GridCraft CSV, and DeckCraft PPTX.
- VectorCraft's first SVG acceptance exposed a real confinement mismatch: the CLI requires an absolute export path inside its write root. The fix is committed as `6e8e24a`; the corrected acceptance run is queued/in progress and VectorCraft must remain unverified for SVG export until it passes.
- The support repository matrix passed tests and release builds for Craft Launcher, Craft Fonts, Craft Libraries, and Craft Repo Status App in run [38167765282](https://github.com/Jaystarbliss-studios/Creative-Jess/actions/runs/38167765282).
- PhotoCraft corpus SHA-256 verification and Terraform format/validation (without provisioning) passed in run [38168003339](https://github.com/Jaystarbliss-studios/Creative-Jess/actions/runs/38168003339).

These results establish reproducible builds and protocol-level integration for the listed apps. They do **not** prove complete feature parity, every format, or all create/edit/save/export workflows.

## Current workspace capabilities

- React + TypeScript + Vite workspace with a searchable, compact directory for all 21 repositories.
- Separate **Launch desktop app** and **Workspace preview** actions. Native launches require an absolute executable path, an authenticated paired local companion, and the user's direct click or approval.
- Loopback-only local companion with pairing token, origin allowlist, fixed allowlisted launch command, safe child-process environment, and persistent stdio MCP sessions.
- Live MCP tool discovery from configured CLI executables, schema-subset validation, bounded requests, and explicit user approval before every AI-proposed tool call.
- Cloud AI via server-side Gemini route when `GEMINI_API_KEY` is configured as a server-side secret; local AI via an Ollama-compatible endpoint/model. Provider connectivity is not assumed until a real health/request succeeds.
- Browser-local project metadata and imported file bytes in IndexedDB; download originals, export files to a selected local folder, and manually import native-edited files back from a selected project folder.
- Windows helper `scripts/start-companion.ps1` loads generated local path settings and starts the companion.

### File bridge limits

Browser assets are stored in IndexedDB and are not automatically synced to disk. Use **Export to folder** and select the configured `CraftProjects/exports` directory to copy files into the local MCP write scope. After editing in a native app, select that exported project subfolder with **Import folder changes** to refresh browser copies. This is manual import/export, not continuous bidirectional sync; browser security does not reveal the absolute selected path to the web app.

## Repository-by-repository status

| Repository | Current status | Remaining work / notes |
|---|---|---|
| `photocraft` | Build + MCP discovery passed; PNG acceptance passed | PNG scenario proves create/inspect/export, not a pixel-edit operation; expand edit/save acceptance |
| `vectorcraft` | Build + MCP discovery passed; SVG acceptance failed once | Absolute-path confinement fix committed; rerun must pass before SVG acceptance is marked passed |
| `lightcraft` | Build + MCP discovery + read-only `command_list` passed | Add real RAW/sample develop/export acceptance |
| `filmcraft` | Build + MCP discovery passed | Add project/sequence edit and render/export acceptance |
| `effectcraft` | Build + MCP discovery + read-only `list_commands` passed | Add composition/render/export acceptance |
| `soundcraft` | Build + MCP discovery passed | No eligible zero-argument read-only tool was advertised; add session save/reopen and audio acceptance |
| `wordcraft` | Build + MCP discovery + read-only tool call passed; Markdown acceptance passed | Add more document formats and reopen acceptance |
| `designcraft` | Build + MCP discovery + read-only `list_commands` passed | Add document/text-frame/PNG or PDF acceptance |
| `deckcraft` | Build + MCP discovery + read-only tool call passed; PPTX acceptance passed | Add reopen/format coverage |
| `pdfcraft` | Build + MCP discovery + read-only `doc_list` passed; PDF open/rotate/save acceptance passed | Expand coverage to other PDF operations and malformed-file handling |
| `cadcraft` | Build + MCP discovery passed | No eligible zero-argument read-only tool was advertised; add drawing/render/export acceptance |
| `gridcraft` | Build + MCP discovery + read-only tool call passed; CSV acceptance passed | Add formula and workbook reopen coverage |
| `artcraft` | Opt-in only in bootstrap; not yet verified by the pilot matrix | Large repository; audit license, native/web build, service/model dependencies, and any documented automation interface |
| `artcraftx` | Experimental desktop project; no verified MCP interface in this integration | Inspect actual build targets and license; native launch is not AI editing integration |
| `artcraft-services` | **Blocked** | Current WIP fair-source license prohibits use to develop a competing product/business; require written maintainer permission and legal review before reuse |
| `craft-launcher` | Windows workspace tests and release build passed | Review update/download trust boundaries and packaging before production use |
| `craft-fonts` | Windows workspace tests and release build passed | Review each bundled font's license and attribution before redistribution |
| `craft-libs` | Windows workspace tests and release build passed | Consuming-app compatibility remains to be verified |
| `craft-repo-status-app` | UI model test and Windows workspace test/release build passed | Review diagnostics/automation surface and licensing |
| `photocraft-corpus` | SHA-256 integrity check passed | Audit fixture provenance, license, and permitted redistribution separately |
| `terraform-aws-observability-accelerator` | Terraform format and validation passed without provisioning | Infrastructure only; never apply automatically |
 
## Verification rules

- `build_passed`: an actual named build command completed successfully in a named environment.
- `smoke_test_passed`: a real MCP initialize/tool-catalog operation and/or a documented safe read-only tool call succeeded.
- `integrated_verified`: the app's defined end-to-end acceptance tests passed. Do not use this status based on a catalog entry, mock, screenshot, or TypeScript build.
- Record failures and fix the cause; do not weaken a test just to make CI green.
- Review upstream licenses, bundled assets/fonts/models, third-party service terms, and platform support individually before redistribution or deployment.
- Hosted cloud AI still needs a protected deployment and authentication. Same-origin checks and rate limits are not a substitute for authentication.
- ArtCraft Services and Terraform must remain outside automatic app integration; the former is license-blocked and the latter is infrastructure.

## Next steps

1. Wait for the corrected VectorCraft SVG acceptance and latest workspace checks.
2. Add safe create/edit/save/export acceptance for LightCraft, FilmCraft, EffectCraft, SoundCraft, DesignCraft, and CADCraft.
3. Verify actual local companion startup and launch paths on the target Windows machine.
4. Test the manual browser/native file round trip with real files on Windows.
5. Audit ArtCraft and ArtCraft-X build/license/automation support; do not claim AI editing until a documented, tested interface exists.
6. Complete licensing, asset/model, and deployment review for every repository before production release.
