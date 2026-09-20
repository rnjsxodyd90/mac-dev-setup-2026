# Optional Ansible workflow

Use Ansible when you prefer a declarative YAML selection or want to include this setup in a larger personal playbook. The existing Bash entry point remains the simplest option and requires no Python or Ansible.

**Why not Terraform/OpenTofu?** Those tools are a better fit for provisioned infrastructure with provider-managed resources and state. A local Mac package selection does not need a state backend or shell commands disguised as infrastructure resources. OpenTofu remains available in the `cloud` profile for actual infrastructure work.

## Design

`ansible/playbook.yml` runs locally, without SSH, fact gathering or privilege escalation. It uses only built-in Ansible modules and delegates package operations to the same tested `setup.sh` used by the CLI. This is deliberately a thin orchestration layer, not a second package manager: catalog, profiles, manual-app detection and failure recovery have one implementation.

It does not install Homebrew, Ansible or Python, alter dotfiles or system preferences, start services, sign into accounts, or download models. Homebrew may still require normal package-specific permissions during an explicit apply.

## Install the optional controller dependency

Install a compatible Python first; CI uses Python 3.13. From the repository root:

```bash
python3 -m venv .venv-ansible
.venv-ansible/bin/python -m pip install -r ansible/requirements.txt
cp ansible/config.example.yml ansible/config.local.yml
```

Review `ansible/config.local.yml`. Both this local config and the virtual environment are gitignored. The example selects `essentials`, `developer` and `terminal`; omitting the config file selects only `essentials`. The pinned `ansible-core` dependency is reviewed separately from Homebrew catalog freshness. No Galaxy collections are needed.

## Preview, then apply

```bash
# Default is preview, even without --check.
.venv-ansible/bin/ansible-playbook -i localhost, ansible/playbook.yml \
  -e @ansible/config.local.yml

# Explicit check mode always forces the installer's read-only preview.
.venv-ansible/bin/ansible-playbook -i localhost, ansible/playbook.yml \
  -e @ansible/config.local.yml --check

# Apply the reviewed selection. This explicitly authorizes --apply --yes.
.venv-ansible/bin/ansible-playbook -i localhost, ansible/playbook.yml \
  -e @ansible/config.local.yml -e '{"mac_setup_apply":true}'
```

Use YAML/JSON booleans, not string extra-vars such as `-e mac_setup_apply=true`; incorrect types are rejected. Keep `mac_setup_apply: false` in your saved config to preserve preview-first behavior. Do not run with `sudo`, `--become`, or an untrusted inventory/config. The installer refuses actual apply as root or on non-macOS hosts.

### Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `mac_setup_profiles` | `[essentials]` | Nonempty list of supported profile names; `optional` stays opt-in |
| `mac_setup_apply` | `false` | Explicit permission to install missing entries, unless `--check` is active |
| `mac_setup_appdir` | `""` | Optional literal absolute application directory; spaces are supported |

Arguments are passed as a list, not a shell command. `~`, `$HOME` and other shell variables are **not expanded** inside `mac_setup_appdir`; use an actual absolute path.

## Repeat runs and reporting

- A successful install reports Ansible `changed`; a repeat run with all selected entries present reports `changed=0` and performs no Homebrew update/install/upgrade.
- A Homebrew failure or conflicting app makes the play fail, with the installer's report available in the failed command result. Earlier successful installs are retained; rerun to retry missing entries. This is not transactional rollback.
- `changed` is based on verified selected-package install receipts. It is not a complete audit of Homebrew metadata, dependencies or side effects from failed commands.
- Upgrades are deliberately not exposed through `mac_setup_upgrade` (supplying it is an error). An upgrade check is not proof of a changed version, so the Ansible layer does not label such checks as changes. For intentional upgrades, review and run `bash setup.sh --profile developer --apply --upgrade` separately.
- Check mode prints the requested selection, **not a live installed-state diff**. It never calls Homebrew. Ansible itself may create normal local module/temp files; the stronger no-file-write preview guarantee belongs to `bash setup.sh` alone.

## Verification scope

CI installs the pinned controller on macOS and Linux, checks playbook syntax, and runs integration tests through the real Ansible engine with fake Homebrew commands. This checks argument handling, preview/check-mode safety, missing-only installation, no-op reruns, validation and failure propagation. It does not install real apps or prove clean-Mac behavior. Without Ansible, the regular Node test suite explicitly skips Ansible integration tests; `npm run test:ansible` requires them rather than silently skipping.
