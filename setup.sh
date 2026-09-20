#!/bin/bash
# macOS development setup wrapper. Default mode only previews selected Brewfiles.
set -u
set -o pipefail
usage() { cat <<'EOT'
Usage: setup.sh [options]

Safely preview or apply one or more static Homebrew bundle profiles.

Options:
  --profile NAME  Select essentials, developer, terminal, cloud, apps, ai, extras,
                  or optional (repeatable).
                  essentials is selected when no profile is given.
  --apply         Run Homebrew after an explicit interactive confirmation.
  --yes           Skip confirmation only when used together with --apply.
  --upgrade       Let brew bundle upgrade entries (opt-in).
  --dry-run       Preview only (the default).
  --help          Show this help.
EOT
}
die() { printf '%s\n' "Error: $*" >&2; exit 2; }
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P) || exit 1
PROFILE_DIR="$SCRIPT_DIR/profiles"
APPLY=0 YES=0 UPGRADE=0 DRY_RUN=0 SELECTED=""
add_profile() {
  case "$1" in essentials|developer|terminal|cloud|apps|ai|extras|optional) ;; *) die "unknown profile: $1" ;; esac
  case " $SELECTED " in *" $1 "*) ;; *) SELECTED="${SELECTED}${SELECTED:+ }$1" ;; esac
}
while [ "$#" -gt 0 ]; do
  case "$1" in
    --profile) [ "$#" -ge 2 ] || die "--profile requires a name"; add_profile "$2"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    --yes) YES=1; shift ;;
    --upgrade) UPGRADE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done
[ "$DRY_RUN" -eq 0 ] || APPLY=0
[ -n "$SELECTED" ] || SELECTED="essentials"
printf '%s\n' 'Selected profiles:'
for profile in $SELECTED; do
  brewfile="$PROFILE_DIR/$profile.Brewfile"
  [ -f "$brewfile" ] || die "required profile file is missing: $brewfile"
  printf '  - %s\n' "$profile"
done
printf '%s\n' 'Package entries:'
for profile in $SELECTED; do
  brewfile="$PROFILE_DIR/$profile.Brewfile"
  printf '  [%s]\n' "$profile"
  sed -e '/^[[:space:]]*#/d' -e '/^[[:space:]]*$/d' "$brewfile" | sed 's/^/    /'
done
case " $SELECTED " in
  *" optional "*) printf '%s\n' 'Warning: optional contains proprietary, mixed-license or unverified-open-source apps; account and plan terms may apply.' >&2 ;;
esac
printf '%s\n' 'Warning: package availability depends on your macOS version and architecture; Homebrew determines compatibility.' >&2
if [ "$UPGRADE" -eq 1 ]; then BUNDLE_PREVIEW='bundle install --file=<temporary combined Brewfile>'; else BUNDLE_PREVIEW='bundle install --file=<temporary combined Brewfile> --no-upgrade'; fi
printf '%s\n' 'Command preview:'
printf '  brew update\n'
printf '  brew %s\n' "$BUNDLE_PREVIEW"
printf '%s\n' 'No packages, settings, dotfiles, or accounts will be changed in dry-run mode.'
[ "$APPLY" -eq 1 ] || exit 0
case "$(uname -s)" in Darwin) ;; *) die '--apply is supported only on macOS (Darwin)' ;; esac
case "$(uname -m)" in arm64|x86_64) ;; *) die "unsupported macOS architecture: $(uname -m)" ;; esac
[ "$(id -u)" != 0 ] || die 'do not run setup.sh --apply as root'
if [ "$YES" -ne 1 ]; then
  [ -t 0 ] || die '--apply needs an interactive terminal confirmation; use --yes only if you intend to apply'
  printf 'Apply the selected Homebrew packages? [y/N] '
  IFS= read -r answer || answer=''
  [ "$answer" = y ] || [ "$answer" = Y ] || { printf '%s\n' 'Not applied.'; exit 0; }
fi
BREW=''
if command -v brew >/dev/null 2>&1; then BREW=$(command -v brew)
elif [ -x /opt/homebrew/bin/brew ]; then BREW=/opt/homebrew/bin/brew
elif [ -x /usr/local/bin/brew ]; then BREW=/usr/local/bin/brew
else
  printf '%s\n' 'Homebrew was not found. This script does not install it automatically.' >&2
  printf '%s\n' 'Install Homebrew from https://brew.sh, then rerun this command.' >&2
  exit 1
fi
PLAN=$(mktemp "${TMPDIR:-/tmp}/mac-dev-setup.XXXXXX") || exit 1
cleanup() { rm -f "$PLAN"; }
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
for profile in $SELECTED; do cat "$PROFILE_DIR/$profile.Brewfile" >> "$PLAN" || exit 1; printf '\n' >> "$PLAN" || exit 1; done
"$BREW" update || exit $?
if [ "$UPGRADE" -eq 1 ]; then "$BREW" bundle install --file="$PLAN"; else "$BREW" bundle install --file="$PLAN" --no-upgrade; fi
