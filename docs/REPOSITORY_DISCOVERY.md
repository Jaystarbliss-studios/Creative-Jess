# Upstream Repository Discovery

Checked through GitHub repository metadata on 2026-10-11. This is a discovery snapshot, not a source/build audit. All repositories reported `main` as their default branch and were not archived at the time of the check.

| Repository | Primary language | GitHub license metadata | GitHub repository size (KB) | Initial handling |
|---|---|---|---:|---|
| [artcraft](https://github.com/storytold/artcraft) | Rust | Apache-2.0 | 1,374,746 | Large checkout; inspect subprojects and model/assets before cloning/building |
| [photocraft](https://github.com/storytold/photocraft) | Rust | Apache-2.0 | 31,434 | Candidate pilot; confirm CLI/JSON/MCP contracts and web build |
| [artcraftx](https://github.com/storytold/artcraftx) | Rust | No SPDX license reported | 38,755 | Resolve license before redistributing/bundling |
| [lightcraft](https://github.com/storytold/lightcraft) | Rust | Apache-2.0 | 35,424 | Inspect RAW/image dependencies and platform support |
| [filmcraft](https://github.com/storytold/filmcraft) | Rust | Apache-2.0 | 23,932 | Inspect codecs, rendering dependencies, and sample export |
| [artcraft-services](https://github.com/storytold/artcraft-services) | Rust | NOASSERTION | 1,314,192 | Very large checkout; audit secrets/config and service boundary before reuse |
| [vectorcraft](https://github.com/storytold/vectorcraft) | Rust | Apache-2.0 | 37,972 | Candidate pilot; verify SVG round-trip and documented control interface |
| [craft-launcher](https://github.com/storytold/craft-launcher) | Rust | Apache-2.0 | 4,950 | Audit update/install behavior and privilege boundaries |
| [craft-fonts](https://github.com/storytold/craft-fonts) | Rust | Apache-2.0 | 37,742 | Review bundled font-by-font licenses, not only repository license |
| [cadcraft](https://github.com/storytold/cadcraft) | Rust | Apache-2.0 | 4,071 | Inspect geometry engine and import/export correctness |
| [wordcraft](https://github.com/storytold/wordcraft) | Rust | Apache-2.0 | 9,060 | Inspect document model and formats; test real save/export |
| [soundcraft](https://github.com/storytold/soundcraft) | Rust | Apache-2.0 | 4,896 | Inspect audio backends, devices, and render/export support |
| [pdfcraft](https://github.com/storytold/pdfcraft) | Rust | Apache-2.0 | 28,756 | Inspect PDF engine and actual edit/annotation capabilities |
| [designcraft](https://github.com/storytold/designcraft) | Rust | Apache-2.0 | 12,898 | Verify browser/native parity and exports |
| [effectcraft](https://github.com/storytold/effectcraft) | Rust | Apache-2.0 | 25,944 | Inspect renderer/GPU requirements and automation support |
| [deckcraft](https://github.com/storytold/deckcraft) | Rust | Apache-2.0 | 3,080 | Verify PPTX import/export with a real fixture |
| [craft-libs](https://github.com/storytold/craft-libs) | Rust | Apache-2.0 | 176 | Inspect workspace crates and dependency/version compatibility |
| [gridcraft](https://github.com/storytold/gridcraft) | Rust | Apache-2.0 | 5,206 | Inspect formula engine and spreadsheet import/export |
| [craft-repo-status-app](https://github.com/storytold/craft-repo-status-app) | Rust | Cargo workspace says MIT; GitHub metadata has no SPDX and root LICENSE was not found | 1,063 | Confirm license files for all distributed files; inspect as optional developer utility |
| [photocraft-corpus](https://github.com/storytold/photocraft-corpus) | JavaScript | Apache-2.0 | 5,326 | Verify fixture provenance and any embedded asset licenses |
| [terraform-aws-observability-accelerator](https://github.com/storytold/terraform-aws-observability-accelerator) | Not reported | Apache-2.0 | 2,605 | Separate infrastructure concern; do not provision AWS resources without explicit approval |

## Interpretation and caveats

- The license column is the SPDX value (or lack of one) reported by GitHub repository metadata. It is not a substitute for reading each repository's LICENSE/COPYING files, package manifests, dependency licenses, model terms, fonts, fixtures, or third-party assets.
- `artcraftx` has no root LICENSE file at the reviewed path, and its root Cargo workspace does not declare a workspace license. Do not assume it is redistributable; inspect per-crate licenses and obtain clarification from maintainers.
- `artcraft-services` has no root LICENSE file at the reviewed path and GitHub reports `NOASSERTION`; do not assume it is redistributable. Audit per-crate manifests, deployment assets, secrets/configuration, and third-party terms before reuse.
- `craft-repo-status-app` has no root LICENSE file at the reviewed path, but its Cargo workspace declares MIT. Verify whether that declaration covers every file and any bundled assets.
- GitHub's repository size is an approximate repository-size figure in KB, not an exact checkout size or an estimate of compiled artifacts. The very large reported sizes for ArtCraft and ArtCraft Services make a targeted manifest/history/LFS review preferable to blindly cloning and building both first.
- Metadata lookups do not prove that any project builds on Windows, supports WebAssembly, exposes MCP/CLI/JSON control, or works with a real file. Those claims require source inspection and reproducible tests.
- This metadata snapshot is still not a source/license audit. Runtime/build evidence has since been recorded separately in [INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md): 12 Rust desktop/CLI apps have passed Windows build and MCP discovery checks, with read-only calls succeeding for 9 of them. None has passed a full create/edit/save/export acceptance workflow. Statuses must be read from the integration-status document, not inferred from this historical discovery snapshot.
