# Support repository audit and verification plan

Date: 2026-10-11

This audit separates the 12 native creative apps from the support repositories. The support repositories can be useful without being end-user editors, but they still need reproducible builds, tests, and license checks before being bundled into Craft Workspace.

| Repository | Root manifest/source evidence reviewed | Known caution | Verification status |
|---|---|---|---|
| [craft-launcher](https://github.com/storytold/craft-launcher) | Rust workspace, edition 2024, version 0.2.1, dual MIT/Apache declaration | Installer/updater and app-launch behavior need security review; this CI checks compile/tests only, not release/update behavior | Pending Windows workspace tests/build |
| [craft-fonts](https://github.com/storytold/craft-fonts) | Rust workspace, edition 2024, version 0.1.0, dual MIT/Apache declaration; README documents per-font license metadata and SHA-256 manifest | Repository license does not replace each bundled font's own license and attribution; verify font manifest and asset provenance before redistribution | Pending Windows workspace tests/build |
| [craft-libs](https://github.com/storytold/craft-libs) | Rust workspace, edition 2024, version 0.1.0, requires Rust 1.95+, dual MIT/Apache declaration | Shared UI crate compatibility must be checked against each consuming app; do not assume replacing app-specific UI with shared primitives is safe | Pending Windows workspace tests/build |
| [craft-repo-status-app](https://github.com/storytold/craft-repo-status-app) | Rust workspace, edition 2021, version 0.1.0, manifest declares MIT; Tauri desktop shell plus HTML/CSS/ES modules UI | GitHub metadata did not report an SPDX license and a root LICENSE was not found in the earlier metadata review; verify license coverage before redistribution. This is an optional developer utility, not a core creative editor | Pending Windows workspace tests/build |

## CI added

`support-repositories.yml` checks out each support repository into the ignored `.upstream/` directory, runs `cargo test --workspace --no-fail-fast`, then runs a release-mode workspace build on Windows Server 2025. This does not modify or push to any upstream repository.

A successful compile/test run is not the same as integration verification. The launcher still needs installer/update security testing, font assets require a per-family license audit, shared libraries need compatibility checks, and the status utility needs its licensing boundary clarified. The PSD corpus, ArtCraft Services, ArtCraft, ArtCraft-X, and Terraform remain separate review tracks because their assets, licensing, service secrets, size, or infrastructure behavior require distinct treatment.
