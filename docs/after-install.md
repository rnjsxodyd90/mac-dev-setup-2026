# After installation

- Open each installed app once and review permissions before granting them.
- Sign into your password manager. Configure recovery and MFA before relying on it.
- Configure Git name/email locally and choose whether to publish your email in commits.
- Authenticate GitHub CLI yourself with `gh auth login`; do not paste credentials into this repo.
- Choose one primary editor, terminal and browser. No defaults are changed by setup.sh.
- For Aside, Cursor and Claude, review account requirements, billing, external processing, retention settings and workplace policies before adding sensitive context.
- Install language runtimes for your projects through mise; the setup does not select versions or modify shell initialization. uv does not automatically migrate existing Python projects.
- Open OrbStack and check its licensing for your use. Installing Kubernetes tools does not connect to any cluster.
- Xcode is optional and installed separately through Apple. Sign in and accept its terms yourself.
- Configure Time Machine/backups and inspect FileVault in System Settings. This repo does not change either.
- Keep credentials, device names, work files and local configuration out of public commits.

## If a package fails

Read the Homebrew error. Check OS/architecture requirements, disk space, conflicts with a manually installed app, and vendor availability. Do not disable Gatekeeper or System Integrity Protection to force an installation. Re-run the same reviewed selection after fixing the issue; previously installed packages are not forcibly removed. There is no rollback of successful earlier installs.
