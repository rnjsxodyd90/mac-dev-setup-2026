# Mac Dev Setup 2026

**A fresh Mac. A current developer toolkit. No mystery script.**

[![CI](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/ci.yml)
[![Freshness](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/freshness.yml/badge.svg)](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/freshness.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An opinionated, open-source Mac setup for developers in 2026: **Aside, Cursor, Claude, Ghostty, VS Code, Zed, uv, mise, OrbStack** and a small set of everyday tools.

Browse the [app catalog](docs/apps.md), choose your profiles, review the plan, then install. No Ansible, Node, Python or account is required to run the setup script. Homebrew is required only when you choose to install.

## Why another Mac setup repo?

Good setup repos exist. This one focuses on **freshness you can inspect**, rather than a giant personal package dump:

- **23 curated packages**, organized into five optional profiles.
- **Aside and modern AI tools** included explicitly, not buried in an outdated list.
- **Dated Homebrew metadata** with source links and observed versions.
- **Weekly automated checks** for removed/deprecated packages, version drift and compatibility changes.
- **Review-first installation.** Running the script without `--apply` only prints a plan.
- **No forced upgrades, dotfile replacement, macOS tweaks or cleanup.**

**2026 is the curation edition, not a version lock.** Installs use the versions Homebrew makes available at execution time. This project does not claim to be the newest repo or track every vendor release instantly. A green freshness check verifies metadata, not successful installation or app security.

## Quick start

Target: an Apple Silicon Mac on macOS 15 or later. Check individual app requirements. Intel Macs are not a verified target; some optional apps are ARM-only.

1. Install Apple's command-line tools if needed: `xcode-select --install`.
2. Install Homebrew using its [official instructions](https://brew.sh/). The setup script never downloads or installs Homebrew for you.
3. Clone and inspect this repository:

```bash
git clone https://github.com/rnjsxodyd90/mac-dev-setup-2026.git
cd mac-dev-setup-2026

# Preview only: no installs, network calls or configuration changes.
bash setup.sh --profile essentials --profile developer --profile ai

# After reviewing the files and preview, apply the same selection.
bash setup.sh --profile essentials --profile developer --profile ai --apply
```

The apply step asks for confirmation. It refreshes Homebrew metadata and installs missing packages without upgrading already installed ones. Homebrew may still install or update necessary dependencies and ask for permissions. Existing manually installed apps may need individual attention; the script does not overwrite them forcibly.

### Choose your profiles

| Profile | Includes |
| --- | --- |
| `essentials` (default) | Git, GitHub CLI, jq, ripgrep, fzf, Bitwarden, Rectangle |
| `developer` | Ghostty, VS Code, mise, uv |
| `ai` | **Aside**, Cursor, Claude |
| `cloud` | OrbStack, kubectl, Helm, K9s, OpenTofu |
| `extras` | Zed, iTerm2, Raycast, Obsidian |

Profiles are independent. Selecting `ai` alone installs only that profile. Combine profiles explicitly. Cursor and Zed are editor alternatives; iTerm2 is a Ghostty alternative. You do not need all of them.

### Useful commands

```bash
bash setup.sh --help
bash setup.sh                         # preview Essentials
bash setup.sh --profile ai            # preview Aside, Cursor, Claude
bash setup.sh --profile cloud --apply # confirm and install cloud tools

# Optional: allow upgrades for selected packages.
bash setup.sh --profile developer --apply --upgrade

# Noninteractive installation after reviewing the repo:
bash setup.sh --profile essentials --apply --yes
```

For individual choices, copy a generated Brewfile to your own file, remove unwanted entries, then run `brew bundle install --file=My.Brewfile --no-upgrade`. Brewfiles are executable Ruby: review any custom file before running it. Never put passwords, API keys or personal configuration in a public repository.

## Aside

Aside is included through the [official Homebrew cask](https://formulae.brew.sh/cask/aside):

```bash
brew install --cask aside
```

Or download it from [aside.com/download](https://aside.com/download). This project is independent and is not affiliated with Aside or other listed vendors. Installing an AI app does not authorize access to your files/accounts, provide a subscription, or guarantee private/local processing. Review each app's settings and terms.

Compatibility note: Aside's vendor help states macOS 15+, whereas the checked cask declares macOS 13+. This guide follows the stricter vendor requirement. See the [catalog](docs/apps.md).

## How freshness works

- `catalog/apps.json`: curated package names, profiles, reasons and source URLs.
- `catalog/verified.json`: last committed successful Homebrew metadata snapshot.
- `docs/apps.md`: generated catalog with observed versions and timestamp.
- `profiles/*.Brewfile`: generated, unpinned install lists.
- **CI:** validates generated files and tests installer behavior with mocks, without installing apps.
- **Freshness workflow:** checks Homebrew weekly and on relevant changes; uploads a report and opens/updates one issue if review is needed. It does not silently alter your Mac or approve new packages.

Checks can fail because of networking or service outages. Failure preserves the last valid snapshot and is never presented as fresh verification. GitHub can delay or disable scheduled runs; check the latest run, not just this description. See [maintenance](docs/maintenance.md).

## What is not automated

Sign-ins, paid licenses, App Store purchases, Xcode, SSH keys, Git identity, cloud credentials, editor settings, shell changes, FileVault and backups. Follow the [after-install checklist](docs/after-install.md).

No clean-Mac or physical-device end-to-end installation has been performed for this initial release. Passing mock tests is not evidence of that. App compatibility and account-dependent features remain vendor-controlled.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Suggest tools with a clear use case and an official installation source, not just a trend. Small, maintained profiles beat an enormous list.

Inspired by [mac-dev-playbook](https://github.com/geerlingguy/mac-dev-playbook), [Lissy93/Brewfile](https://github.com/Lissy93/Brewfile) and [Homebrew Bundle](https://docs.brew.sh/Brew-Bundle-and-Brewfile). This is an independent implementation, not a fork of their scripts.

[MIT license](LICENSE). Individual apps retain their own licenses.
