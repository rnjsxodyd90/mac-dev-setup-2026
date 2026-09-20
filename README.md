# Mac Dev Setup 2026

**Open-source first. The essentials for a fresh Mac, without the bloat.**

[![CI](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/ci.yml)
[![Freshness](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/freshness.yml/badge.svg)](https://github.com/rnjsxodyd90/mac-dev-setup-2026/actions/workflows/freshness.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A curated toolkit for setting up a new Mac: everyday apps, developer tools, terminal utilities, containers, media, file sharing, notes and backups. **Open-source tools are the preferred path.** Proprietary, mixed-license and unverified-open-source alternatives live in a separate, explicit `optional` profile.

**50 choices: 42 open-source entries and 8 optional exceptions.** These are options, not 50 things everybody needs. Start small, pick the profiles you actually use, and review the plan before installing.

[Browse all apps and licenses](docs/apps.md) · [After-install checklist](docs/after-install.md) · [Freshness policy](docs/maintenance.md)

## The open-source-first choices

| Need | Preferred choice | Why |
| --- | --- | --- |
| Browser | **Firefox** | Open-source everyday browser |
| Passwords | **KeePassXC** | Local encrypted database; no hosted account required |
| Code editor | **VSCodium** | Community-built VS Code distribution under an open-source license |
| Terminal | **Ghostty** | Native terminal with GPU acceleration |
| Window positioning | **Rectangle** | Keyboard-driven window layouts |
| Containers | **Colima + Docker CLI** | Open-source local container tooling, without Docker Desktop or OrbStack |
| Languages and Python | **mise + uv** | Project-specific runtimes and Python environments |
| Clipboard and system stats | **Maccy + Stats** | Focused desktop utilities |
| Local file sharing | **LocalSend** | Transfer files between nearby devices |
| Media | **VLC or IINA** | Choose your preferred player |
| Notes and backups | **Joplin + restic** | Optional notes app and encrypted backup CLI |
| Local-model runtime | **Ollama** | Optional runtime; model licenses are separate |

Already happy with Apple's built-in apps? Keep them. This script never changes your default browser, password manager, editor or shell. Paid services can exist alongside open-source applications; licensing details are linked in the catalog.

## Quick start

Target: current Apple Silicon Macs on macOS 15+. Requirements vary by package. Intel compatibility is not comprehensively verified.

1. Install Apple's command-line tools if needed: `xcode-select --install`.
2. Install Homebrew using its [official instructions](https://brew.sh/). We never install Homebrew automatically.
3. Clone, inspect, and preview:

```bash
git clone https://github.com/rnjsxodyd90/mac-dev-setup-2026.git
cd mac-dev-setup-2026

# Everyday essentials only. No network, installations or settings changes.
bash setup.sh

# A broader developer setup, still preview-only.
bash setup.sh --profile essentials --profile developer --profile terminal

# After reviewing the files and preview, install the same selection.
bash setup.sh --profile essentials --profile developer --profile terminal --apply
```

No Ansible, Node or Python is needed to run `setup.sh`. Homebrew is needed only to apply a plan. Node.js 22+ is for maintainers and tests.

## Optional Ansible workflow

Prefer a repeatable YAML configuration? Use the [Ansible playbook](docs/ansible.md). It runs the same guarded installer locally: preview by default, explicit apply, and no changes on an already-complete rerun. No Terraform state, remote hosts or duplicate package lists are needed.

After installing the optional controller dependency described in the guide:

```bash
# Preview the default essentials profile.
.venv-ansible/bin/ansible-playbook -i localhost, ansible/playbook.yml --check

# Explicitly install missing essentials; no upgrades or app adoption.
.venv-ansible/bin/ansible-playbook -i localhost, ansible/playbook.yml \
  -e '{"mac_setup_apply":true}'
```

The Bash workflow stays dependency-light. Ansible adds optional YAML orchestration, not automatic machine-wide configuration.

## Safe to rerun

**Run the same command again whenever you add tools or move to a partially configured Mac.** The default apply mode installs missing entries rather than reinstalling the whole selection.

```bash
bash setup.sh --profile essentials --profile developer --profile terminal --apply
```

- **Already tracked by Homebrew:** skip it by exact package name.
- **Manually installed GUI app:** check the expected app name in `/Applications`, `~/Applications`, and an explicitly selected `--appdir`. A structurally valid existing app is left alone, never adopted or overwritten.
- **Missing package:** install it and confirm it appears in Homebrew's installed inventory.
- **Everything already present:** do not run a metadata update, install or upgrade.
- **One package fails:** continue independent entries, print a failure summary, and exit nonzero. Rerun the same command to retry missing entries; successful earlier installs stay installed.
- **Want newer versions too?** Add `--upgrade` for selected Homebrew-managed entries only. Externally installed apps are still left alone. The summary reports completed upgrade checks, not a claim that every checked package changed version.

```bash
# Optional custom app location; paths with spaces are supported.
bash setup.sh --profile developer --appdir "$HOME/Applications" --apply

# Explicitly allow Homebrew upgrades for this selection.
bash setup.sh --profile developer --apply --upgrade
```

App detection checks the known bundle name, readable app metadata and executable presence without running the app. It is **not** an authenticity check or a health/version test. Incomplete/conflicting app folders are reported as conflicts, not silently accepted or replaced. Renamed apps or other locations are not detected automatically. Homebrew receipts count as installed; corrupted managed installs need manual repair. CLI tools installed outside Homebrew are not treated as managed formulae just because a command exists on PATH.

Inherited `HOMEBREW_CASK_OPTS` and `HOMEBREW_FORCE_API_AUTO_UPDATE` are cleared for installer commands, so environment flags cannot silently request force/adopt or change app locations. Use `--appdir` explicitly.

Preview mode remains fully read-only and does not invoke Homebrew. It lists your requested selection; actual installed-state checks happen after apply confirmation. App mappings come from verified Homebrew cask artifacts in `catalog/app-bundles.tsv`. Custom Ruby in profile Brewfiles is rejected by the setup wrapper; use Homebrew directly for your own advanced Brewfiles.

## Choose your profiles

Profiles are independent and repeatable. **Nothing automatically includes `optional`.**

| Profile | Includes |
| --- | --- |
| `essentials` (default) | Firefox, KeePassXC, Rectangle, Git, GitHub CLI, jq |
| `developer` | VSCodium, Ghostty, mise, uv, direnv, ShellCheck, just, HTTPie CLI |
| `terminal` | ripgrep, fd, fzf, bat, eza, zoxide, Starship, tmux, btop, tlrc (tldr client) |
| `cloud` | Colima, Docker CLI, Docker Compose, kubectl, Helm, K9s, OpenTofu |
| `apps` | VLC, IINA, Stats, Maccy, LocalSend |
| `extras` | Zed, iTerm2, Neovim, Joplin, restic |
| `ai` | Ollama runtime only; no model downloads or hosted AI account setup |
| `optional` | Aside, Cursor, Claude, Microsoft VS Code, OrbStack, Raycast, Obsidian, Bitwarden |

`extras` contains alternatives, not prerequisites. `apps` includes both media players for discoverability; trim the profile if you want just one. See [individual selection](#install-only-what-you-want).

### Install only what you want

```bash
# Preview a single profile.
bash setup.sh --profile cloud

# Confirm and install it, without starting services.
bash setup.sh --profile cloud --apply

# Allow upgrades for selected packages, explicitly.
bash setup.sh --profile developer --apply --upgrade

# Proprietary/mixed-license exceptions are always opt-in.
bash setup.sh --profile optional
```

For finer selection, copy a profile to `My.Brewfile`, remove entries you do not want, inspect it, then run:

```bash
brew bundle install --file=My.Brewfile --no-upgrade
```

Brewfiles are executable Ruby. Review any file before running it. Keep personal configuration and secrets out of this public repo. `--yes` skips confirmation only with `--apply`; `--dry-run` always wins if both are supplied.

## Safe by default

- Preview mode makes no network calls and never invokes Homebrew.
- The Bash CLI requires apply confirmation unless `--yes` is explicitly supplied. Ansible requires `mac_setup_apply: true`, which explicitly supplies `--apply --yes`.
- Homebrew metadata is refreshed only when installs or explicit upgrade checks are needed. Already-installed packages are not upgraded unless `--upgrade` is selected. Required dependencies can still be installed or updated by Homebrew.
- No dotfile replacement, uninstall/cleanup operations, background service starts, model downloads or macOS preference changes.
- No account sign-ins, credentials, purchases or permissions are configured for you.
- Existing apps are detected conservatively and left untouched. Conflicts are reported rather than forcibly replaced.

## Open source means more than free

The catalog records a license classification and evidence link for every entry. Open-source entries refer to the upstream project's declared license, not a complete legal audit of every bundled dependency or optional service.

- **VSCodium and Microsoft's VS Code binary are not the same licensing choice.** Some Microsoft extensions and marketplace features may be unavailable in VSCodium.
- **Docker CLI and Docker Compose are not Docker Desktop.** Colima supplies the local VM/runtime; it still needs to be started manually.
- **Bitwarden has mixed licensing across its repository.** It remains an optional choice; we do not label the entire distribution uniformly open source.
- **Ollama's runtime license does not cover downloaded models.** Check each model separately. Nothing starts or downloads automatically.
- Proprietary or insufficiently verified apps, including Aside, stay optional. Inclusion does not imply affiliation or endorsement.

## Freshness you can inspect

**2026 is the curation edition, not a version lock or a claim to be the newest repo.** Installs use Homebrew's available versions at execution time; Homebrew can lag vendor releases.

- `catalog/apps.json`: profiles, purpose, license classification and evidence links.
- `catalog/verified.json`: last successful committed Homebrew metadata snapshot.
- `catalog/app-bundles.tsv`: generated app names for conservative external-app detection.
- `profiles/*.Brewfile` and `docs/apps.md`: generated lists, observed versions and dates.
- CI validates the catalog and enforces that only `optional` can contain non-open-source entries. Installer tests use mocks, not real installs.
- Weekly freshness checks report version, compatibility, app-bundle-name and formula-license changes and open/update one review issue. They do not silently change package choices.

Failed checks preserve the last valid snapshot. A green metadata check is **not** clean-Mac installation testing, upstream license revalidation, a security audit or verification of every vendor release. GitHub schedules can be delayed or disabled; inspect the latest run.

## After installing

Follow the [manual checklist](docs/after-install.md) for shell activation, containers, backups, privacy and optional accounts. No clean-Mac end-to-end installation is claimed. Hosted macOS/Linux CI covers mocked installer behavior and catalog checks only.

## Contribute

Prefer a maintained open-source tool with a clear everyday use case over adding every fashionable app. See [CONTRIBUTING.md](CONTRIBUTING.md).

Inspired by [mac-dev-playbook](https://github.com/geerlingguy/mac-dev-playbook), [Lissy93/Brewfile](https://github.com/Lissy93/Brewfile) and [Homebrew Bundle](https://docs.brew.sh/Brew-Bundle-and-Brewfile). Independent implementation, not a fork.

[MIT license](LICENSE). Individual apps keep their own licenses.
