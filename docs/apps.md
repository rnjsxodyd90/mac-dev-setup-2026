# App catalog

Homebrew metadata snapshot: **2026-09-20T17:17:13.043Z**.

These are curated options, not a claim that every app is best for everyone. Versions below are observations, not pins. Metadata verification is not installation testing, a security audit, or confirmation of the newest vendor release. Check vendor licensing, account requirements and supported hardware before installing.

Profiles are additive only when explicitly selected. The default is `essentials`; `extras` contains alternatives, not prerequisites.

## essentials

Small foundation: CLI utilities, passwords and windows

| App | Why it is here | Observed Homebrew version | Source |
| --- | --- | --- | --- |
| [Git](https://git-scm.com) | Version control | `2.55.0` | [formula/git](https://formulae.brew.sh/api/formula/git.json) |
| [GitHub CLI](https://cli.github.com/) | Repositories, pull requests and issues from your terminal | `2.101.0` | [formula/gh](https://formulae.brew.sh/api/formula/gh.json) |
| [jq](https://jqlang.github.io/jq/) | Inspect and transform JSON | `1.8.2` | [formula/jq](https://formulae.brew.sh/api/formula/jq.json) |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Fast code search | `15.2.0` | [formula/ripgrep](https://formulae.brew.sh/api/formula/ripgrep.json) |
| [fzf](https://junegunn.github.io/fzf/) | Interactive fuzzy finding | `0.74.4` | [formula/fzf](https://formulae.brew.sh/api/formula/fzf.json) |
| [Bitwarden](https://bitwarden.com/) | Password manager; account and setup required | `2026.9.0` | [cask/bitwarden](https://formulae.brew.sh/api/cask/bitwarden.json) |
| [Rectangle](https://rectangleapp.com/) | Keyboard-driven window positioning | `1.100` | [cask/rectangle](https://formulae.brew.sh/api/cask/rectangle.json) |

## developer

Editor, terminal and runtime tooling

| App | Why it is here | Observed Homebrew version | Source |
| --- | --- | --- | --- |
| [Ghostty](https://ghostty.org/) | Native GPU-accelerated terminal | `1.3.1` | [cask/ghostty](https://formulae.brew.sh/api/cask/ghostty.json) |
| [Visual Studio Code](https://code.visualstudio.com/) | General-purpose editor | `1.138.0` | [cask/visual-studio-code](https://formulae.brew.sh/api/cask/visual-studio-code.json) |
| [mise](https://mise.jdx.dev/) | Manage project language runtimes explicitly | `2026.9.12` | [formula/mise](https://formulae.brew.sh/api/formula/mise.json) |
| [uv](https://docs.astral.sh/uv/) | Python packages, projects and environments | `0.12.17` | [formula/uv](https://formulae.brew.sh/api/formula/uv.json) |

## ai

Opt-in AI browser, editor and assistant

| App | Why it is here | Observed Homebrew version | Source |
| --- | --- | --- | --- |
| [Aside](https://aside.com/) | AI browser for tasks across websites; review account and data-access settings | `1.0.914.1` | [cask/aside](https://formulae.brew.sh/api/cask/aside.json) |
| [Cursor](https://www.cursor.com/) | AI-assisted code editor; alternative to VS Code | `3.21.16,8ae78e8eee1e63479c7e0504b664bc0a80c6800f` | [cask/cursor](https://formulae.brew.sh/api/cask/cursor.json) |
| [Claude](https://claude.com/download) | Desktop AI assistant; account and plan terms apply | `2.2553.1,c38127e27202ddc1c8c187102f7798a93b1b8ede` | [cask/claude](https://formulae.brew.sh/api/cask/claude.json) |

## cloud

Containers, Kubernetes and infrastructure tools

| App | Why it is here | Observed Homebrew version | Source |
| --- | --- | --- | --- |
| [OrbStack](https://orbstack.dev/) | Local containers and Linux machines; check commercial licensing | `2.2.3,20963` | [cask/orbstack](https://formulae.brew.sh/api/cask/orbstack.json) |
| [kubectl](https://kubernetes.io/docs/reference/kubectl/) | Operate Kubernetes clusters; credentials are not configured | `1.37.0` | [formula/kubernetes-cli](https://formulae.brew.sh/api/formula/kubernetes-cli.json) |
| [Helm](https://helm.sh/) | Kubernetes package management | `4.3.0` | [formula/helm](https://formulae.brew.sh/api/formula/helm.json) |
| [K9s](https://k9scli.io/) | Terminal interface for Kubernetes | `0.51.0` | [formula/k9s](https://formulae.brew.sh/api/formula/k9s.json) |
| [OpenTofu](https://opentofu.org/) | Infrastructure as code | `1.12.6` | [formula/opentofu](https://formulae.brew.sh/api/formula/opentofu.json) |

## extras

Alternatives: review before installing overlapping tools

| App | Why it is here | Observed Homebrew version | Source |
| --- | --- | --- | --- |
| [Zed](https://zed.dev/) | Alternative code editor | `1.20.2` | [cask/zed](https://formulae.brew.sh/api/cask/zed.json) |
| [iTerm2](https://iterm2.com/) | Alternative terminal | `3.7.2` | [cask/iterm2](https://formulae.brew.sh/api/cask/iterm2.json) |
| [Raycast](https://raycast.com/) | Launcher and productivity tools; check current architecture support | `2.4.1.0` | [cask/raycast](https://formulae.brew.sh/api/cask/raycast.json) |
| [Obsidian](https://obsidian.md/) | Local Markdown notes; optional services have separate terms | `1.13.7` | [cask/obsidian](https://formulae.brew.sh/api/cask/obsidian.json) |

## Compatibility notes

- Aside: vendor help states macOS 15+, while the checked Homebrew cask declares macOS 13+. Follow the stricter vendor requirement until reconciled: [vendor help](https://docs.aside.com/help/get-started).
- Raycast: the checked Homebrew metadata restricts the cask to ARM64. It is optional; do not assume Intel support.
- This project targets current Apple Silicon Macs on macOS 15+; per-app requirements can be higher. Intel compatibility is not verified.
- AI applications can transmit data to external services. Review their permissions, retention terms and workspace policies. Installation does not configure or approve data access.
- Paid plans and commercial-use restrictions are vendor-controlled. Inclusion is not an endorsement, affiliation or free-license promise.
