# Non-application repository audit

Date: 2026-10-11

These repositories are part of the 21-repository inventory but are not end-user creative editors. They need different acceptance checks.

| Repository | Purpose | Safe verification | Restrictions |
|---|---|---|---|
| [photocraft-corpus](https://github.com/storytold/photocraft-corpus) | Pinned Photoshop-generated PSD fixtures used as test oracles | Verify every file against `SHA256SUMS` in CI; PhotoCraft's own `cargo xtask test-corpus` is the deeper consuming-app acceptance test | Keep corpus as a pinned external fixture set, not a copied-in Git subtree; don't regenerate or repin upstream fixtures from this integration repo |
| [terraform-aws-observability-accelerator](https://github.com/storytold/terraform-aws-observability-accelerator) | Terraform modules/examples for AWS observability | Run recursive format checks and validate the root Terraform module with backend disabled | Never run `terraform apply`, provision AWS resources, use cloud credentials, or change infrastructure from this creative-workspace project |
| [artcraft](https://github.com/storytold/artcraft) | Large AI creation desktop application and workspace | Targeted manifest/feature audit first; a default-members desktop build can be attempted only after reviewing required providers and local setup | Repository metadata reports a very large checkout; do not blindly clone the full history or attempt service-backed generation without approved credentials |
| [artcraftx](https://github.com/storytold/artcraftx) | Experimental AI image/video/audio/3D desktop app | README indicates early experimental status and says builds are forthcoming; inspect per-crate manifests and build instructions before attempting integration | GitHub metadata reports no SPDX license and the reviewed root had no LICENSE; do not bundle or reuse source/assets until maintainers clarify permission |
| [artcraft-services](https://github.com/storytold/artcraft-services) | Production backend, auth, media, generation jobs, billing and workers | Separate security/licensing/deployment review; test only isolated crates/services after required dependencies and safe fixtures are identified | GitHub reports NOASSERTION and no root LICENSE was found in the reviewed path; the repo is very large and may contain operational configuration. Do not deploy, seed databases, run migrations, or contact production services from this workflow |

## Current verification boundary

`non-app-repo-validation.yml` verifies corpus integrity and Terraform syntax/formatting without provisioning resources. It does not make the corpus part of the product runtime, and it does not grant permission to bundle the experimental ArtCraft-X or production ArtCraft Services source. The ArtCraft and ArtCraft Services workspaces need a separate targeted build plan once size, licenses, provider configuration, and external dependencies are resolved.
