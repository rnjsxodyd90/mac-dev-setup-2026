# App catalog

**Open-source first. Choose what you need, not everything on the list.**

Homebrew metadata snapshot: **2026-09-20T17:39:51.157Z**.

Versions are observations, not pins. Open-source classifications refer to upstream declared licenses; they are not a full bundled-dependency audit or a promise that hosted services are free. Follow the evidence links. Formula licenses come from Homebrew metadata; cask licenses are human-reviewed upstream evidence.

Metadata checks are not clean-Mac installation tests, security reviews, upstream license revalidation or proof of the newest vendor release. The optional profile is the only place for proprietary, mixed-license or unverified-open-source choices.

## essentials

Small open-source foundation: browser, passwords, windows and core CLI

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [Firefox](https://www.mozilla.org/firefox/) | Everyday open-source browser | [MPL-2.0 (primary)](https://www.mozilla.org/en-US/foundation/licensing) (open-source) | [156.0](https://formulae.brew.sh/api/cask/firefox.json) |
| [KeePassXC](https://keepassxc.org/) | Local encrypted password database; choose your own backup and sync | [GPL-2.0-only OR GPL-3.0-only (core)](https://github.com/keepassxreboot/keepassxc/blob/develop/COPYING) (open-source) | [2.7.12](https://formulae.brew.sh/api/cask/keepassxc.json) |
| [Rectangle](https://rectangleapp.com/) | Keyboard-driven window positioning | [MIT](https://github.com/rxhanson/Rectangle/blob/main/LICENSE) (open-source) | [1.100](https://formulae.brew.sh/api/cask/rectangle.json) |
| [Git](https://git-scm.com) | Version control | [GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-3-Clause AND MIT](https://formulae.brew.sh/api/formula/git.json) (open-source) | [2.55.0](https://formulae.brew.sh/api/formula/git.json) |
| [GitHub CLI](https://cli.github.com/) | Repositories, pull requests and issues from your terminal | [MIT](https://formulae.brew.sh/api/formula/gh.json) (open-source) | [2.101.0](https://formulae.brew.sh/api/formula/gh.json) |
| [jq](https://jqlang.github.io/jq/) | Inspect and transform JSON | [MIT](https://formulae.brew.sh/api/formula/jq.json) (open-source) | [1.8.2](https://formulae.brew.sh/api/formula/jq.json) |

## developer

Open-source editor, terminal and development workflow tools

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [VSCodium](https://github.com/VSCodium/vscodium) | Open-source editor distribution; check extension compatibility | [MIT](https://github.com/VSCodium/vscodium/blob/master/LICENSE) (open-source) | [1.135.06055](https://formulae.brew.sh/api/cask/vscodium.json) |
| [Ghostty](https://ghostty.org/) | Native GPU-accelerated terminal | [MIT](https://github.com/ghostty-org/ghostty/blob/main/LICENSE) (open-source) | [1.3.1](https://formulae.brew.sh/api/cask/ghostty.json) |
| [mise](https://mise.jdx.dev/) | Project-specific language runtimes; no versions activated automatically | [MIT](https://formulae.brew.sh/api/formula/mise.json) (open-source) | [2026.9.12](https://formulae.brew.sh/api/formula/mise.json) |
| [uv](https://docs.astral.sh/uv/) | Python packages, projects and environments | [Apache-2.0 OR MIT](https://formulae.brew.sh/api/formula/uv.json) (open-source) | [0.12.17](https://formulae.brew.sh/api/formula/uv.json) |
| [direnv](https://direnv.net/) | Per-project environment variables; only trust reviewed envrc files | [MIT](https://formulae.brew.sh/api/formula/direnv.json) (open-source) | [2.37.1](https://formulae.brew.sh/api/formula/direnv.json) |
| [ShellCheck](https://www.shellcheck.net/) | Static checks for shell scripts | [GPL-3.0-or-later](https://formulae.brew.sh/api/formula/shellcheck.json) (open-source) | [0.11.0](https://formulae.brew.sh/api/formula/shellcheck.json) |
| [just](https://just.systems) | Project command runner | [CC0-1.0](https://formulae.brew.sh/api/formula/just.json) (open-source) | [1.58.0](https://formulae.brew.sh/api/formula/just.json) |
| [HTTPie CLI](https://httpie.io/) | Readable HTTP requests in the terminal | [BSD-3-Clause](https://formulae.brew.sh/api/formula/httpie.json) (open-source) | [3.2.4](https://formulae.brew.sh/api/formula/httpie.json) |

## terminal

Optional open-source command-line productivity utilities

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Fast code and text search | [Unlicense](https://formulae.brew.sh/api/formula/ripgrep.json) (open-source) | [15.2.0](https://formulae.brew.sh/api/formula/ripgrep.json) |
| [fd](https://github.com/sharkdp/fd) | Friendly file finding | [Apache-2.0 OR MIT](https://formulae.brew.sh/api/formula/fd.json) (open-source) | [10.5.0](https://formulae.brew.sh/api/formula/fd.json) |
| [fzf](https://junegunn.github.io/fzf/) | Interactive fuzzy finding | [MIT](https://formulae.brew.sh/api/formula/fzf.json) (open-source) | [0.74.4](https://formulae.brew.sh/api/formula/fzf.json) |
| [bat](https://github.com/sharkdp/bat) | Syntax-highlighted file previews | [Apache-2.0 OR MIT](https://formulae.brew.sh/api/formula/bat.json) (open-source) | [0.26.1](https://formulae.brew.sh/api/formula/bat.json) |
| [eza](https://eza.rocks) | Modern directory listings | [EUPL-1.2](https://formulae.brew.sh/api/formula/eza.json) (open-source) | [0.23.5](https://formulae.brew.sh/api/formula/eza.json) |
| [zoxide](https://github.com/ajeetdsouza/zoxide) | Jump to frequently used directories; shell activation is manual | [MIT](https://formulae.brew.sh/api/formula/zoxide.json) (open-source) | [0.10.0](https://formulae.brew.sh/api/formula/zoxide.json) |
| [Starship](https://starship.rs/) | Cross-shell prompt; shell activation is manual | [ISC](https://formulae.brew.sh/api/formula/starship.json) (open-source) | [1.26.0](https://formulae.brew.sh/api/formula/starship.json) |
| [tmux](https://tmux.github.io/) | Persistent terminal sessions and panes | [ISC](https://formulae.brew.sh/api/formula/tmux.json) (open-source) | [3.7c](https://formulae.brew.sh/api/formula/tmux.json) |
| [btop](https://github.com/aristocratos/btop) | Terminal system-resource monitor | [Apache-2.0](https://formulae.brew.sh/api/formula/btop.json) (open-source) | [1.4.7](https://formulae.brew.sh/api/formula/btop.json) |
| [tlrc](https://tldr.sh/tlrc/) | Official Rust tldr client for concise command examples | [MIT](https://formulae.brew.sh/api/formula/tlrc.json) (open-source) | [1.13.1](https://formulae.brew.sh/api/formula/tlrc.json) |

## cloud

Open-source containers, Kubernetes and infrastructure tools; no services started

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [Colima](https://colima.run) | Local container VM/runtime; not started automatically | [MIT](https://formulae.brew.sh/api/formula/colima.json) (open-source) | [0.10.3](https://formulae.brew.sh/api/formula/colima.json) |
| [Docker CLI](https://www.docker.com/) | Open-source CLI only, not Docker Desktop | [Apache-2.0](https://formulae.brew.sh/api/formula/docker.json) (open-source) | [29.8.1](https://formulae.brew.sh/api/formula/docker.json) |
| [Docker Compose](https://docs.docker.com/compose/) | Compose CLI plugin; discovery may need manual configuration | [Apache-2.0](https://formulae.brew.sh/api/formula/docker-compose.json) (open-source) | [5.5.1](https://formulae.brew.sh/api/formula/docker-compose.json) |
| [kubectl](https://kubernetes.io/docs/reference/kubectl/) | Kubernetes CLI; cluster access is not configured | [Apache-2.0](https://formulae.brew.sh/api/formula/kubernetes-cli.json) (open-source) | [1.37.0](https://formulae.brew.sh/api/formula/kubernetes-cli.json) |
| [Helm](https://helm.sh/) | Kubernetes package management | [Apache-2.0](https://formulae.brew.sh/api/formula/helm.json) (open-source) | [4.3.0](https://formulae.brew.sh/api/formula/helm.json) |
| [K9s](https://k9scli.io/) | Terminal interface for Kubernetes | [Apache-2.0](https://formulae.brew.sh/api/formula/k9s.json) (open-source) | [0.51.0](https://formulae.brew.sh/api/formula/k9s.json) |
| [OpenTofu](https://opentofu.org/) | Open-source infrastructure as code | [MPL-2.0](https://formulae.brew.sh/api/formula/opentofu.json) (open-source) | [1.12.6](https://formulae.brew.sh/api/formula/opentofu.json) |

## apps

Open-source everyday desktop utilities and media players; choose what you need

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [VLC](https://www.videolan.org/vlc/) | General-purpose media player; alternative to IINA | [GPL-2.0-or-later (player)](https://github.com/videolan/vlc/blob/master/README.md) (open-source) | [3.0.23](https://formulae.brew.sh/api/cask/vlc.json) |
| [IINA](https://iina.io/) | Mac-native media player; alternative to VLC | [GPL-3.0-only](https://github.com/iina/iina/blob/develop/LICENSE) (open-source) | [1.4.4](https://formulae.brew.sh/api/cask/iina.json) |
| [Stats](https://github.com/exelban/stats) | Menu-bar system resource information | [MIT](https://github.com/exelban/stats/blob/master/LICENSE) (open-source) | [3.0.16](https://formulae.brew.sh/api/cask/stats.json) |
| [Maccy](https://maccy.app/) | Clipboard history; configure sensitive-data exclusions | [MIT](https://github.com/p0deje/Maccy/blob/master/LICENSE) (open-source) | [2.7.1](https://formulae.brew.sh/api/cask/maccy.json) |
| [LocalSend](https://localsend.org/) | Local-network file transfers across devices | [Apache-2.0](https://github.com/localsend/localsend/blob/main/LICENSE) (open-source) | [1.18.2](https://formulae.brew.sh/api/cask/localsend.json) |

## extras

Open-source alternatives, notes and backup tools

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [Zed](https://zed.dev/) | Alternative editor; hosted AI services are separate | [GPL-3.0-or-later; Apache-2.0 where marked](https://github.com/zed-industries/zed/blob/main/README.md) (open-source) | [1.20.2](https://formulae.brew.sh/api/cask/zed.json) |
| [iTerm2](https://iterm2.com/) | Alternative terminal to Ghostty | [GPL-3.0-or-later (combined distribution)](https://github.com/gnachman/iTerm2/blob/master/COPYING) (open-source) | [3.7.2](https://formulae.brew.sh/api/cask/iterm2.json) |
| [Neovim](https://neovim.io/) | Terminal-based editor | [Apache-2.0](https://formulae.brew.sh/api/formula/neovim.json) (open-source) | [0.12.5](https://formulae.brew.sh/api/formula/neovim.json) |
| [Joplin](https://joplinapp.org/) | Notes app with optional sync services | [AGPL-3.0-or-later (default)](https://github.com/laurent22/joplin/blob/dev/LICENSE) (open-source) | [3.7.18](https://formulae.brew.sh/api/cask/joplin.json) |
| [restic](https://restic.net/) | Encrypted backup CLI; destination and recovery setup are manual | [BSD-2-Clause](https://formulae.brew.sh/api/formula/restic.json) (open-source) | [0.19.1](https://formulae.brew.sh/api/formula/restic.json) |

## ai

Optional open-source local-model runtime; model weights have separate licenses

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [Ollama](https://ollama.com/) | Open-source model runtime; no models pulled or services started | [MIT](https://formulae.brew.sh/api/formula/ollama.json) (open-source) | [0.34.2](https://formulae.brew.sh/api/formula/ollama.json) |

## optional

Explicit opt-in exceptions: proprietary, mixed-license or not verified open source

| App | Purpose | License / evidence | Homebrew version |
| --- | --- | --- | --- |
| [Aside](https://aside.com/) | Optional AI browser; review account, permission and processing terms | [Vendor terms; not verified open source](https://aside.com/) (not-verified-open-source) | [1.0.914.1](https://formulae.brew.sh/api/cask/aside.json) |
| [Cursor](https://www.cursor.com/) | Optional AI editor with vendor-controlled service terms | [Vendor terms; not verified open source](https://www.cursor.com/) (not-verified-open-source) | [3.21.16,8ae78e8eee1e63479c7e0504b664bc0a80c6800f](https://formulae.brew.sh/api/cask/cursor.json) |
| [Claude](https://claude.com/download) | Optional desktop AI assistant; account and plan terms apply | [Vendor terms; not verified open source](https://claude.com/download) (not-verified-open-source) | [2.2553.1,c38127e27202ddc1c8c187102f7798a93b1b8ede](https://formulae.brew.sh/api/cask/claude.json) |
| [Microsoft Visual Studio Code](https://code.visualstudio.com/) | Microsoft binary distribution; VSCodium is the preferred open-source path | [Microsoft product license](https://code.visualstudio.com/docs/supporting/faq) (not-verified-open-source) | [1.138.0](https://formulae.brew.sh/api/cask/visual-studio-code.json) |
| [OrbStack](https://orbstack.dev/) | Optional container app; Colima is the open-source path | [Vendor terms; not verified open source](https://orbstack.dev/) (not-verified-open-source) | [2.2.3,20963](https://formulae.brew.sh/api/cask/orbstack.json) |
| [Raycast](https://raycast.com/) | Optional launcher; verify current ARM64 support and plan terms | [Vendor terms; not verified open source](https://raycast.com/) (not-verified-open-source) | [2.4.1.0](https://formulae.brew.sh/api/cask/raycast.json) |
| [Obsidian](https://obsidian.md/) | Optional notes app; Joplin is the open-source path | [Vendor terms; not verified open source](https://obsidian.md/) (not-verified-open-source) | [1.13.7](https://formulae.brew.sh/api/cask/obsidian.json) |
| [Bitwarden](https://bitwarden.com/) | Optional password manager with mixed-license source; existing vaults are unchanged | [GPL-3.0 plus Bitwarden License modules](https://github.com/bitwarden/clients/blob/main/LICENSE.txt) (mixed) | [2026.9.0](https://formulae.brew.sh/api/cask/bitwarden.json) |

## Important distinctions

- VSCodium is the preferred editor distribution. Microsoft VS Code binaries have different terms; some Microsoft extensions and services are restricted in alternative distributions.
- Docker and Docker Compose here are CLI packages, not Docker Desktop. Colima is installed but not started; see the after-install checklist for Compose discovery.
- Ollama is an open-source runtime, not a license for model weights. No model is downloaded and no server is started automatically.
- Zed and Joplin have optional commercial services; their app-source licenses do not make those services free.
- KeePassXC is the default local password-database choice. Bitwarden remains optional because its source tree has GPL and Bitwarden-specific licensed portions; existing vaults and preferences are not changed.
- Aside: vendor help states macOS 15+, while the checked cask declares macOS 13+. Follow the stricter [vendor requirement](https://docs.aside.com/help/get-started). It is optional, not an open-source recommendation.
- Raycast is optional; the checked metadata restricts its cask to ARM64. Do not assume Intel support.
- Current Apple Silicon Macs on macOS 15+ are the target, subject to higher per-app requirements. Intel and clean-Mac installs are not comprehensively verified.
- Clipboard managers can capture sensitive data. AI tools can transmit it to external services. Review permissions, retention, model licenses and workplace policy before use.

Per-entry license-review timestamps and evidence are recorded in [catalog/apps.json](../catalog/apps.json). See [after-install.md](after-install.md) for manual configuration.
