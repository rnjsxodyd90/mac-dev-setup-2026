#!/bin/bash
# Review-first macOS Homebrew installer. Bash 3.2 compatible; no Node or Python required.
set -u
set -o pipefail

usage() {
  cat <<'EOT'
Usage: setup.sh [options]

Safely preview or apply one or more static Homebrew profiles.

Options:
  --profile NAME  Select essentials, developer, terminal, cloud, apps, ai, extras,
                  or optional (repeatable). Defaults to essentials.
  --appdir PATH   Use an absolute application directory for missing cask installs,
                  and inspect it in addition to /Applications and ~/Applications.
  --apply         Apply the selected packages after confirmation.
  --yes           Skip confirmation only when used together with --apply.
  --upgrade       Upgrade only selected packages already tracked by Homebrew.
  --dry-run       Preview only (the default); always overrides --apply.
  --help          Show this help.
EOT
}

die() {
  printf '%s\n' "Error: $*" >&2
  exit 2
}

is_safe_token() {
  case "$1" in
    ''|[!a-z0-9]*|*[!a-z0-9@+._-]*) return 1 ;;
    *) return 0 ;;
  esac
}

contains_line() {
  _cl_haystack=$1
  _cl_needle=$2
  [ -n "$_cl_haystack" ] || return 1
  while IFS= read -r _cl_line || [ -n "$_cl_line" ]; do
    [ "$_cl_line" = "$_cl_needle" ] && return 0
  done <<EOF_LINES
$_cl_haystack
EOF_LINES
  return 1
}

append_unique_line() {
  _aul_var=$1
  _aul_value=$2
  case "$_aul_var" in
    SELECTED) _aul_current=$SELECTED ;;
    FORMULAS) _aul_current=$FORMULAS ;;
    CASKS) _aul_current=$CASKS ;;
    MAP_TOKENS) _aul_current=$MAP_TOKENS ;;
    INSTALL_FORMULAS) _aul_current=$INSTALL_FORMULAS ;;
    INSTALL_CASKS) _aul_current=$INSTALL_CASKS ;;
    UPGRADE_FORMULAS) _aul_current=$UPGRADE_FORMULAS ;;
    UPGRADE_CASKS) _aul_current=$UPGRADE_CASKS ;;
    *) die "internal list error: $_aul_var" ;;
  esac
  contains_line "$_aul_current" "$_aul_value" && return 0
  if [ -n "$_aul_current" ]; then _aul_new="$_aul_current
$_aul_value"; else _aul_new=$_aul_value; fi
  case "$_aul_var" in
    SELECTED) SELECTED=$_aul_new ;;
    FORMULAS) FORMULAS=$_aul_new ;;
    CASKS) CASKS=$_aul_new ;;
    MAP_TOKENS) MAP_TOKENS=$_aul_new ;;
    INSTALL_FORMULAS) INSTALL_FORMULAS=$_aul_new ;;
    INSTALL_CASKS) INSTALL_CASKS=$_aul_new ;;
    UPGRADE_FORMULAS) UPGRADE_FORMULAS=$_aul_new ;;
    UPGRADE_CASKS) UPGRADE_CASKS=$_aul_new ;;
  esac
}

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P) || exit 1
PROFILE_DIR=$SCRIPT_DIR/profiles
APP_MAP=$SCRIPT_DIR/catalog/app-bundles.tsv
APPLY=0
YES=0
UPGRADE=0
DRY_RUN=0
SELECTED=
APPDIR=
APPDIR_SET=0

add_profile() {
  case "$1" in
    essentials|developer|terminal|cloud|apps|ai|extras|optional) ;;
    *) die "unknown profile: $1" ;;
  esac
  append_unique_line SELECTED "$1"
}

normalize_appdir() {
  _na_path=$1
  case "$_na_path" in
    /*) ;;
    *) die '--appdir must be an absolute path' ;;
  esac
  case "$_na_path" in
    *[![:print:]]*) die '--appdir contains an unsafe control character' ;;
  esac
  while [ "$_na_path" != / ] && [ "${_na_path%/}" != "$_na_path" ]; do
    _na_path=${_na_path%/}
  done
  [ "$_na_path" != / ] || die '--appdir cannot be the filesystem root'
  case "$_na_path/" in
    *'//'*|*'/../'*|*'/./'*) die '--appdir must not contain empty, dot, or parent path components' ;;
  esac
  APPDIR=$_na_path
  APPDIR_SET=1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --profile)
      [ "$#" -ge 2 ] || die '--profile requires a name'
      add_profile "$2"
      shift 2
      ;;
    --appdir)
      [ "$#" -ge 2 ] || die '--appdir requires a path'
      [ "$APPDIR_SET" -eq 0 ] || die '--appdir may be specified only once'
      normalize_appdir "$2"
      shift 2
      ;;
    --apply) APPLY=1; shift ;;
    --yes) YES=1; shift ;;
    --upgrade) UPGRADE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

[ "$DRY_RUN" -eq 0 ] || APPLY=0
[ -n "$SELECTED" ] || SELECTED=essentials

FORMULAS=
CASKS=
parse_profile() {
  _pp_profile=$1
  _pp_file=$PROFILE_DIR/$_pp_profile.Brewfile
  [ -f "$_pp_file" ] && [ -r "$_pp_file" ] || die "required profile file is missing or unreadable: $_pp_file"
  _pp_number=0
  while IFS= read -r _pp_line || [ -n "$_pp_line" ]; do
    _pp_number=$((_pp_number + 1))
    case "$_pp_line" in
      '') continue ;;
      '#'* ) continue ;;
      *"
"*) die "malformed profile statement in $_pp_file line $_pp_number" ;;
    esac
    _pp_kind=${_pp_line%% *}
    case "$_pp_kind" in brew|cask) ;; *) die "unsupported profile statement in $_pp_file line $_pp_number" ;; esac
    _pp_rest=${_pp_line#"$_pp_kind "}
    case "$_pp_rest" in '"'*'"') ;; *) die "malformed profile statement in $_pp_file line $_pp_number" ;; esac
    _pp_token=${_pp_rest#\"}
    _pp_token=${_pp_token%\"}
    [ "$_pp_line" = "$_pp_kind \"$_pp_token\"" ] || die "malformed profile statement in $_pp_file line $_pp_number"
    is_safe_token "$_pp_token" || die "unsafe package token in $_pp_file line $_pp_number"
    if [ "$_pp_kind" = brew ]; then
      append_unique_line FORMULAS "$_pp_token"
    else
      append_unique_line CASKS "$_pp_token"
    fi
  done < "$_pp_file"
}

while IFS= read -r _profile || [ -n "$_profile" ]; do
  parse_profile "$_profile" || die "could not read profile: $_profile"
done <<EOF_PROFILES
$SELECTED
EOF_PROFILES

[ -f "$APP_MAP" ] && [ -r "$APP_MAP" ] || die "required app mapping file is missing or unreadable: $APP_MAP"
APP_MAPPINGS=
MAP_TOKENS=
_tab=$(printf '\t')
_map_number=0
while IFS= read -r _map_line || [ -n "$_map_line" ]; do
  _map_number=$((_map_number + 1))
  case "$_map_line" in ''|'#'*) continue ;; esac
  case "$_map_line" in
    *"$_tab"*) ;;
    *) die "malformed app mapping in $APP_MAP line $_map_number" ;;
  esac
  _map_token=${_map_line%%"$_tab"*}
  _map_app=${_map_line#*"$_tab"}
  case "$_map_app" in *"$_tab"*) die "malformed app mapping in $APP_MAP line $_map_number" ;; esac
  is_safe_token "$_map_token" || die "unsafe cask token in $APP_MAP line $_map_number"
  case "$_map_app" in
    ''|.*|*/*|*\\*|*[![:print:]]*) die "unsafe app bundle basename in $APP_MAP line $_map_number" ;;
    *.app) ;;
    *) die "app bundle must end in .app in $APP_MAP line $_map_number" ;;
  esac
  contains_line "$MAP_TOKENS" "$_map_token" && die "duplicate cask mapping in $APP_MAP: $_map_token"
  append_unique_line MAP_TOKENS "$_map_token"
  if [ -n "$APP_MAPPINGS" ]; then
    APP_MAPPINGS="$APP_MAPPINGS
$_map_token$_tab$_map_app"
  else
    APP_MAPPINGS="$_map_token$_tab$_map_app"
  fi
done < "$APP_MAP"

app_basename_for() {
  _ab_token=$1
  while IFS="$_tab" read -r _ab_key _ab_name || [ -n "$_ab_key$_ab_name" ]; do
    if [ "$_ab_key" = "$_ab_token" ]; then
      printf '%s\n' "$_ab_name"
      return 0
    fi
  done <<EOF_MAP
$APP_MAPPINGS
EOF_MAP
  return 1
}

while IFS= read -r _cask || [ -n "$_cask" ]; do
  [ -n "$_cask" ] || continue
  app_basename_for "$_cask" >/dev/null || die "no app bundle mapping for selected cask: $_cask"
done <<EOF_CASKS
$CASKS
EOF_CASKS

printf '%s\n' 'Selected profiles:'
while IFS= read -r _profile || [ -n "$_profile" ]; do
  [ -n "$_profile" ] && printf '  - %s\n' "$_profile"
done <<EOF_PROFILES_OUT
$SELECTED
EOF_PROFILES_OUT
printf '%s\n' 'Selected packages:'
while IFS= read -r _formula || [ -n "$_formula" ]; do
  [ -n "$_formula" ] && printf '  formula: %s\n' "$_formula"
done <<EOF_FORMULAS_OUT
$FORMULAS
EOF_FORMULAS_OUT
while IFS= read -r _cask || [ -n "$_cask" ]; do
  [ -n "$_cask" ] && printf '  cask: %s\n' "$_cask"
done <<EOF_CASKS_OUT
$CASKS
EOF_CASKS_OUT
[ "$APPDIR_SET" -eq 0 ] || printf 'Application directory: %s\n' "$APPDIR"
case "
$SELECTED
" in
  *"
optional
"*) printf '%s\n' 'Warning: optional contains proprietary, mixed-license or unverified-open-source apps; account and plan terms may apply.' >&2 ;;
esac
printf '%s\n' 'Warning: package availability depends on macOS and Homebrew compatibility.' >&2
if [ "$UPGRADE" -eq 1 ]; then
  printf '%s\n' 'Preview: install missing entries and upgrade selected Homebrew-managed entries.'
else
  printf '%s\n' 'Preview: install missing entries; leave installed entries unchanged.'
fi
printf '%s\n' 'External cask detection checks expected names and bundle structure, not app authenticity or runtime health.'
printf '%s\n' 'No packages, settings, services, accounts, or files are changed in dry-run mode.'
[ "$APPLY" -eq 1 ] || exit 0

case "$(uname -s)" in Darwin) ;; *) die '--apply is supported only on macOS (Darwin)' ;; esac
case "$(uname -m)" in arm64|x86_64) ;; *) die "unsupported macOS architecture: $(uname -m)" ;; esac
[ "$(id -u)" != 0 ] || die 'do not run setup.sh --apply as root'

if [ "$YES" -ne 1 ]; then
  [ -t 0 ] || die '--apply needs an interactive terminal confirmation; use --yes only if you intend to apply'
  printf 'Apply the selected Homebrew packages? [y/N] '
  IFS= read -r _answer || _answer=
  case "$_answer" in y|Y) ;; *) printf '%s\n' 'Not applied.'; exit 0 ;; esac
fi

BREW=
if command -v brew >/dev/null 2>&1; then
  BREW=$(command -v brew)
elif [ -x /opt/homebrew/bin/brew ]; then
  BREW=/opt/homebrew/bin/brew
elif [ -x /usr/local/bin/brew ]; then
  BREW=/usr/local/bin/brew
else
  printf '%s\n' 'Homebrew was not found. This script does not install it automatically.' >&2
  printf '%s\n' 'Install Homebrew from https://brew.sh, then rerun this command.' >&2
  exit 1
fi

trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

brew_command() {
  (
  unset HOMEBREW_CASK_OPTS HOMEBREW_FORCE_API_AUTO_UPDATE
  HOMEBREW_NO_AUTO_UPDATE=1 \
  HOMEBREW_NO_INSTALL_CLEANUP=1 \
  HOMEBREW_NO_INSTALL_UPGRADE=1 \
  "$BREW" "$@"
  )
}

if ! FORMULA_INVENTORY=$(brew_command list --formula -1); then
  printf '%s\n' 'Error: could not read Homebrew formula inventory; nothing was changed.' >&2
  exit 1
fi
if ! CASK_INVENTORY=$(brew_command list --cask -1); then
  printf '%s\n' 'Error: could not read Homebrew cask inventory; nothing was changed.' >&2
  exit 1
fi

PLISTBUDDY=/usr/libexec/PlistBuddy
APP_CHECK_STATE=missing
APP_CHECK_PATH=
check_one_bundle() {
  _cob_path=$1
  APP_CHECK_PATH=$_cob_path
  if [ -e "$_cob_path" ] || [ -L "$_cob_path" ]; then
    if [ ! -d "$_cob_path" ] || [ -L "$_cob_path" ]; then
      APP_CHECK_STATE=conflict
      return 0
    fi
    _cob_plist=$_cob_path/Contents/Info.plist
    [ -f "$_cob_plist" ] && [ -r "$_cob_plist" ] || { APP_CHECK_STATE=conflict; return 0; }
    _cob_type=$("$PLISTBUDDY" -c 'Print :CFBundlePackageType' "$_cob_plist" 2>/dev/null) || { APP_CHECK_STATE=conflict; return 0; }
    [ "$_cob_type" = APPL ] || { APP_CHECK_STATE=conflict; return 0; }
    _cob_exec=$("$PLISTBUDDY" -c 'Print :CFBundleExecutable' "$_cob_plist" 2>/dev/null) || { APP_CHECK_STATE=conflict; return 0; }
    case "$_cob_exec" in ''|.*|*/*|*\\*|*[![:print:]]*) APP_CHECK_STATE=conflict; return 0 ;; esac
    [ -x "$_cob_path/Contents/MacOS/$_cob_exec" ] || { APP_CHECK_STATE=conflict; return 0; }
    APP_CHECK_STATE=external
    return 0
  fi
  APP_CHECK_STATE=missing
}

check_external_cask() {
  _cec_token=$1
  _cec_app=$(app_basename_for "$_cec_token") || { APP_CHECK_STATE=conflict; APP_CHECK_PATH='(missing mapping)'; return 0; }
  APP_CHECK_STATE=missing
  APP_CHECK_PATH=
  _cec_valid_path=
  _cec_conflict_path=
  if [ "$APPDIR_SET" -eq 1 ]; then
    check_one_bundle "$APPDIR/$_cec_app"
    case "$APP_CHECK_STATE" in external) _cec_valid_path=$APP_CHECK_PATH ;; conflict) _cec_conflict_path=$APP_CHECK_PATH ;; esac
  fi
  check_one_bundle "/Applications/$_cec_app"
  case "$APP_CHECK_STATE" in external) [ -n "$_cec_valid_path" ] || _cec_valid_path=$APP_CHECK_PATH ;; conflict) [ -n "$_cec_conflict_path" ] || _cec_conflict_path=$APP_CHECK_PATH ;; esac
  if [ -n "${HOME:-}" ]; then
    check_one_bundle "$HOME/Applications/$_cec_app"
    case "$APP_CHECK_STATE" in external) [ -n "$_cec_valid_path" ] || _cec_valid_path=$APP_CHECK_PATH ;; conflict) [ -n "$_cec_conflict_path" ] || _cec_conflict_path=$APP_CHECK_PATH ;; esac
  fi
  if [ -n "$_cec_conflict_path" ]; then
    APP_CHECK_STATE=conflict
    APP_CHECK_PATH=$_cec_conflict_path
  elif [ -n "$_cec_valid_path" ]; then
    APP_CHECK_STATE=external
    APP_CHECK_PATH=$_cec_valid_path
  else
    APP_CHECK_STATE=missing
    APP_CHECK_PATH=
  fi
}

INSTALL_FORMULAS=
INSTALL_CASKS=
UPGRADE_FORMULAS=
UPGRADE_CASKS=
COUNT_INSTALLED=0
COUNT_UPGRADED=0
COUNT_SKIPPED=0
COUNT_EXTERNAL=0
COUNT_CONFLICT=0
COUNT_FAILED=0
INVENTORY_BROKEN=0

while IFS= read -r _formula || [ -n "$_formula" ]; do
  [ -n "$_formula" ] || continue
  if contains_line "$FORMULA_INVENTORY" "$_formula"; then
    if [ "$UPGRADE" -eq 1 ]; then append_unique_line UPGRADE_FORMULAS "$_formula"; else COUNT_SKIPPED=$((COUNT_SKIPPED + 1)); printf 'skip formula %s (Homebrew receipt present)\n' "$_formula"; fi
  else
    append_unique_line INSTALL_FORMULAS "$_formula"
  fi
done <<EOF_PLAN_FORMULAS
$FORMULAS
EOF_PLAN_FORMULAS

while IFS= read -r _cask || [ -n "$_cask" ]; do
  [ -n "$_cask" ] || continue
  if contains_line "$CASK_INVENTORY" "$_cask"; then
    if [ "$UPGRADE" -eq 1 ]; then append_unique_line UPGRADE_CASKS "$_cask"; else COUNT_SKIPPED=$((COUNT_SKIPPED + 1)); printf 'skip cask %s (Homebrew receipt present)\n' "$_cask"; fi
  else
    check_external_cask "$_cask"
    case "$APP_CHECK_STATE" in
      external)
        COUNT_EXTERNAL=$((COUNT_EXTERNAL + 1))
        printf 'external cask %s (%s)\n' "$_cask" "$APP_CHECK_PATH"
        ;;
      conflict)
        COUNT_CONFLICT=$((COUNT_CONFLICT + 1))
        printf 'Error: cask %s has an invalid or incomplete existing app at %s; left untouched.\n' "$_cask" "$APP_CHECK_PATH" >&2
        ;;
      missing) append_unique_line INSTALL_CASKS "$_cask" ;;
    esac
  fi
done <<EOF_PLAN_CASKS
$CASKS
EOF_PLAN_CASKS

needs_mutation=0
for _queue in "$INSTALL_FORMULAS" "$INSTALL_CASKS" "$UPGRADE_FORMULAS" "$UPGRADE_CASKS"; do
  [ -z "$_queue" ] || needs_mutation=1
done

print_summary() {
  printf '%s\n' 'Summary:'
  printf '  installed: %s\n' "$COUNT_INSTALLED"
  printf '  upgrade_checks_completed: %s\n' "$COUNT_UPGRADED"
  printf '  skipped: %s\n' "$COUNT_SKIPPED"
  printf '  external: %s\n' "$COUNT_EXTERNAL"
  printf '  conflict: %s\n' "$COUNT_CONFLICT"
  printf '  failed: %s\n' "$COUNT_FAILED"
}

if [ "$needs_mutation" -eq 0 ]; then
  print_summary
  [ "$COUNT_CONFLICT" -eq 0 ] && exit 0
  exit 1
fi

if ! brew_command update; then
  COUNT_FAILED=$((COUNT_FAILED + 1))
  printf '%s\n' 'Error: brew update failed; no package mutations were attempted.' >&2
  print_summary
  exit 1
fi

refresh_formula_inventory() {
  if FORMULA_INVENTORY=$(brew_command list --formula -1); then return 0; fi
  INVENTORY_BROKEN=1
  printf '%s\n' 'Error: could not refresh Homebrew formula inventory.' >&2
  return 1
}
refresh_cask_inventory() {
  if CASK_INVENTORY=$(brew_command list --cask -1); then return 0; fi
  INVENTORY_BROKEN=1
  printf '%s\n' 'Error: could not refresh Homebrew cask inventory.' >&2
  return 1
}

run_formula_queue() {
  _rfq_action=$1
  _rfq_entries=$2
  while IFS= read -r _rfq_token || [ -n "$_rfq_token" ]; do
    [ -n "$_rfq_token" ] || continue
    if [ "$_rfq_action" = install ]; then
      if ! refresh_formula_inventory; then COUNT_FAILED=$((COUNT_FAILED + 1)); return 1; fi
      if contains_line "$FORMULA_INVENTORY" "$_rfq_token"; then
        COUNT_SKIPPED=$((COUNT_SKIPPED + 1))
        printf 'skip formula %s (receipt became present earlier in this run)\n' "$_rfq_token"
        continue
      fi
    fi
    if brew_command "$_rfq_action" --formula "$_rfq_token"; then
      if ! refresh_formula_inventory; then
        COUNT_FAILED=$((COUNT_FAILED + 1))
        printf 'Error: unable to verify formula %s because inventory could not be read; stopping further mutations.\n' "$_rfq_token" >&2
        return 1
      elif contains_line "$FORMULA_INVENTORY" "$_rfq_token"; then
        if [ "$_rfq_action" = install ]; then
          COUNT_INSTALLED=$((COUNT_INSTALLED + 1)); printf 'installed formula %s\n' "$_rfq_token"
        else
          COUNT_UPGRADED=$((COUNT_UPGRADED + 1)); printf 'upgrade check completed for formula %s\n' "$_rfq_token"
        fi
      else
        COUNT_FAILED=$((COUNT_FAILED + 1))
        printf 'Error: brew reported success for formula %s but no receipt was found.\n' "$_rfq_token" >&2
      fi
    else
      COUNT_FAILED=$((COUNT_FAILED + 1))
      printf 'Error: failed to %s formula %s.\n' "$_rfq_action" "$_rfq_token" >&2
    fi
    [ "$INVENTORY_BROKEN" -eq 0 ] || return 1
  done <<EOF_FORMULA_QUEUE
$_rfq_entries
EOF_FORMULA_QUEUE
}

run_cask_install_queue() {
  _rci_entries=$1
  while IFS= read -r _rci_token || [ -n "$_rci_token" ]; do
    [ -n "$_rci_token" ] || continue
    if ! refresh_cask_inventory; then COUNT_FAILED=$((COUNT_FAILED + 1)); return 1; fi
    if contains_line "$CASK_INVENTORY" "$_rci_token"; then
      COUNT_SKIPPED=$((COUNT_SKIPPED + 1))
      printf 'skip cask %s (receipt became present earlier in this run)\n' "$_rci_token"
      continue
    fi
    check_external_cask "$_rci_token"
    case "$APP_CHECK_STATE" in
      external)
        COUNT_EXTERNAL=$((COUNT_EXTERNAL + 1))
        printf 'external cask %s appeared before install (%s); left untouched\n' "$_rci_token" "$APP_CHECK_PATH"
        continue
        ;;
      conflict)
        COUNT_CONFLICT=$((COUNT_CONFLICT + 1))
        printf 'Error: cask %s has an invalid or incomplete existing app at %s; left untouched.\n' "$_rci_token" "$APP_CHECK_PATH" >&2
        continue
        ;;
    esac
    if [ "$APPDIR_SET" -eq 1 ]; then
      brew_command install --cask "$_rci_token" "--appdir=$APPDIR"
    else
      brew_command install --cask "$_rci_token"
    fi
    _rci_status=$?
    if [ "$_rci_status" -eq 0 ]; then
      if ! refresh_cask_inventory; then
        COUNT_FAILED=$((COUNT_FAILED + 1))
        printf 'Error: unable to verify cask %s because inventory could not be read; stopping further mutations.\n' "$_rci_token" >&2
        return 1
      elif contains_line "$CASK_INVENTORY" "$_rci_token"; then
        COUNT_INSTALLED=$((COUNT_INSTALLED + 1)); printf 'installed cask %s\n' "$_rci_token"
      else
        COUNT_FAILED=$((COUNT_FAILED + 1))
        printf 'Error: brew reported success for cask %s but no receipt was found.\n' "$_rci_token" >&2
      fi
    else
      COUNT_FAILED=$((COUNT_FAILED + 1))
      printf 'Error: failed to install cask %s.\n' "$_rci_token" >&2
    fi
    [ "$INVENTORY_BROKEN" -eq 0 ] || return 1
  done <<EOF_CASK_INSTALL_QUEUE
$_rci_entries
EOF_CASK_INSTALL_QUEUE
}

run_cask_upgrade_queue() {
  _rcu_entries=$1
  while IFS= read -r _rcu_token || [ -n "$_rcu_token" ]; do
    [ -n "$_rcu_token" ] || continue
    if brew_command upgrade --cask "$_rcu_token"; then
      if ! refresh_cask_inventory; then
        COUNT_FAILED=$((COUNT_FAILED + 1))
        printf 'Error: unable to verify cask %s because inventory could not be read; stopping further mutations.\n' "$_rcu_token" >&2
        return 1
      elif contains_line "$CASK_INVENTORY" "$_rcu_token"; then
        COUNT_UPGRADED=$((COUNT_UPGRADED + 1)); printf 'upgrade check completed for cask %s\n' "$_rcu_token"
      else
        COUNT_FAILED=$((COUNT_FAILED + 1))
        printf 'Error: brew reported success for cask %s but no receipt was found.\n' "$_rcu_token" >&2
      fi
    else
      COUNT_FAILED=$((COUNT_FAILED + 1))
      printf 'Error: failed to upgrade cask %s.\n' "$_rcu_token" >&2
    fi
    [ "$INVENTORY_BROKEN" -eq 0 ] || return 1
  done <<EOF_CASK_UPGRADE_QUEUE
$_rcu_entries
EOF_CASK_UPGRADE_QUEUE
}

run_formula_queue install "$INSTALL_FORMULAS"
[ "$INVENTORY_BROKEN" -ne 0 ] || run_cask_install_queue "$INSTALL_CASKS"
[ "$INVENTORY_BROKEN" -ne 0 ] || run_formula_queue upgrade "$UPGRADE_FORMULAS"
[ "$INVENTORY_BROKEN" -ne 0 ] || run_cask_upgrade_queue "$UPGRADE_CASKS"

print_summary
if [ "$COUNT_FAILED" -ne 0 ] || [ "$COUNT_CONFLICT" -ne 0 ]; then exit 1; fi
exit 0
