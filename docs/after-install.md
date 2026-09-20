# After installation

Installation is only the first step. No services, accounts, shell changes or existing password-manager settings are configured automatically.

## Everyday apps

- Keep your preferred default browser. Firefox installation does not change it.
- KeePassXC: create or open an encrypted password database, set a strong master password, and make a recovery/backup plan. Sync is your choice, not configured here. Keep using Bitwarden if it suits you; it is listed separately as a mixed-license alternative.
- Rectangle, Maccy and similar tools can need system permissions. Read the request before granting it. Clipboard history can contain sensitive information: configure exclusions, retention and pause behavior.
- LocalSend: accept only transfers you expect and check local-network permissions.
- Choose VLC or IINA if you do not need both. Joplin sync and encryption settings require a separate setup decision.

## Development and shell

- Configure Git identity yourself; consider a GitHub no-reply email for public commits.
- Authenticate GitHub CLI with `gh auth login` if wanted. Never commit credentials.
- VSCodium uses an alternative extension marketplace; some Microsoft extensions/features may be restricted. Check each extension's license and compatibility.
- mise, direnv, zoxide, Starship and fzf require optional shell integration for their full experience. Follow each tool's official instructions and review changes to your shell files. `direnv allow` permits code in a project's `.envrc`; trust the project first.
- Install language runtime versions per project with mise; uv does not migrate existing Python environments for you.
- Full Xcode is optional and separate from Command Line Tools. Install it through Apple and accept its terms yourself.

## Containers and cloud

- `colima start` creates/starts a local VM when you choose to run it. It is not run by setup.sh.
- `docker` is the open-source CLI, not Docker Desktop. Verify context with `docker context ls` before contacting a daemon.
- Homebrew's Docker Compose formula may require `cliPluginsExtraDirs` in your existing `~/.docker/config.json`. Read `brew info docker-compose`; merge the entry using the value of `brew --prefix`. Do not overwrite your existing Docker configuration or credentials.
- `docker compose version` checks whether discovery works. Consult Colima and Docker docs if it does not.
- kubectl, Helm, K9s and OpenTofu install no cluster access or cloud credentials. Verify context/workspace before any real operation.

## Backups and local AI

- Configure Time Machine/backups and inspect FileVault yourself. This repo changes neither.
- restic needs a backup destination and encryption-password/recovery plan. Test restoring data before relying on backups. No repository is initialized by setup.sh.
- Ollama is installed as a runtime only. Starting a server and pulling a model are explicit separate steps. Check model licenses, memory/storage requirements, server exposure and any cloud features. An open-source runtime is not proof of private processing for every model or integration.

## Optional exceptions

Aside, Cursor, Claude, VS Code, OrbStack, Raycast, Obsidian and Bitwarden are separate opt-in choices. Review vendor terms, account requirements and permissions. For AI tools, inspect billing, external processing and retention settings before using sensitive data.

## If a package fails

Read the Homebrew error. Check OS/architecture requirements, disk space, existing-app conflicts and vendor availability. Never disable Gatekeeper or System Integrity Protection to force an install. Re-run the same reviewed selection after fixing the issue. Already-satisfied entries are skipped and only missing entries are installed. Earlier successful installs are not rolled back or forcibly removed. Invalid/incomplete app folders at a known target path are reported as conflicts and left untouched; inspect and resolve them yourself before retrying. Renamed apps or apps outside the supported search locations require individual review.
