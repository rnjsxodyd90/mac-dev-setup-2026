import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, chmod, rm, readFile, readdir, unlink, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = new URL('../setup.sh', import.meta.url);
const profileNames = ['essentials', 'developer', 'terminal', 'cloud', 'apps', 'ai', 'extras', 'optional'];
const mappings = {
  'receipt-app': 'Fixture Receipt.app',
  'external-app': 'Fixture External App.app',
  'broken-app': 'Fixture Broken App.app',
  'missing-app': 'Fixture Missing App.app',
  'second-cask': 'Fixture Second.app',
  'upgrade-cask': 'Fixture Upgrade.app',
  'false-cask': 'Fixture False Success.app',
  'duplicate-cask': 'Fixture Duplicate.app',
};

async function fixture(t, profiles = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'mac-dev-setup-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of ['profiles', 'catalog', 'bin', 'state', 'home', 'tmp', 'system-apps']) await mkdir(join(dir, name));
  await copyFile(source, join(dir, 'setup.sh'));
  let script = await readFile(join(dir, 'setup.sh'), 'utf8');
  script = script.replaceAll('/usr/libexec/PlistBuddy', join(dir, 'bin', 'PlistBuddy'));
  script = script.replace('check_one_bundle "/Applications/$_cec_app"', 'check_one_bundle "' + join(dir, 'system-apps') + '/$_cec_app"');
  await writeFile(join(dir, 'setup.sh'), script);
  await chmod(join(dir, 'setup.sh'), 0o755);

  for (const name of profileNames) {
    await writeFile(join(dir, 'profiles', `${name}.Brewfile`), profiles[name] ?? '# fixture profile\n');
  }
  const map = ['# Generated fixture: cask token<TAB>Main App.app', ...Object.entries(mappings).map(([token, app]) => `${token}\t${app}`), ''].join('\n');
  await writeFile(join(dir, 'catalog', 'app-bundles.tsv'), map);
  await writeFile(join(dir, 'state', 'formula'), '');
  await writeFile(join(dir, 'state', 'cask'), '');

  await writeFile(join(dir, 'bin', 'uname'), `#!/bin/sh
if [ "$1" = "-s" ]; then printf '%s\\n' "\${MOCK_UNAME:-Darwin}"; else printf '%s\\n' "\${MOCK_ARCH:-arm64}"; fi
`);
  await writeFile(join(dir, 'bin', 'id'), `#!/bin/sh
printf '%s\\n' "\${MOCK_UID:-501}"
`);
  await writeFile(join(dir, 'bin', 'PlistBuddy'), `#!/bin/sh
[ "$1" = "-c" ] || exit 2
key=\${2#Print :}
file=$3
value=$(sed -n "s/^$key=//p" "$file" 2>/dev/null | sed -n '1p')
[ -n "$value" ] || exit 1
printf '%s\\n' "$value"
`);
  await writeFile(join(dir, 'bin', 'brew'), `#!/bin/sh
set -u
cmd=$1
shift
printf '%s' "$cmd" >> "$MOCK_BREW_LOG"
for arg in "$@"; do printf '\\t%s' "$arg" >> "$MOCK_BREW_LOG"; done
printf '\\n' >> "$MOCK_BREW_LOG"
[ "\${HOMEBREW_NO_AUTO_UPDATE:-}" = 1 ] || exit 81
[ "\${HOMEBREW_NO_INSTALL_CLEANUP:-}" = 1 ] || exit 82
[ "\${HOMEBREW_NO_INSTALL_UPGRADE:-}" = 1 ] || exit 83
[ -z "\${HOMEBREW_CASK_OPTS:-}" ] || exit 84
[ -z "\${HOMEBREW_FORCE_API_AUTO_UPDATE:-}" ] || exit 85
case "$cmd" in
  list)
    kind=
    case "\${1:-}" in --formula) kind=formula ;; --cask) kind=cask ;; *) exit 3 ;; esac
    [ ! -f "$MOCK_BREW_STATE/fail-list-$kind" ] || exit 17
    cat "$MOCK_BREW_STATE/$kind"
    ;;
  update)
    [ ! -f "$MOCK_BREW_STATE/fail-update" ] || exit 18
    ;;
  install|upgrade)
    action=$cmd
    case "\${1:-}" in --formula) kind=formula ;; --cask) kind=cask ;; *) exit 4 ;; esac
    token=\${2:-}
    [ -n "$token" ] || exit 5
    [ ! -f "$MOCK_BREW_STATE/fail-$action-$kind-$token" ] || exit 19
    [ ! -f "$MOCK_BREW_STATE/false-success-$action-$kind-$token" ] || exit 0
    if [ "$action" = install ]; then
      grep -Fqx "$token" "$MOCK_BREW_STATE/$kind" 2>/dev/null || printf '%s\\n' "$token" >> "$MOCK_BREW_STATE/$kind"
    else
      grep -Fqx "$token" "$MOCK_BREW_STATE/$kind" 2>/dev/null || exit 20
    fi
    if [ -f "$MOCK_BREW_STATE/add-dependency-$token" ]; then cat "$MOCK_BREW_STATE/add-dependency-$token" >> "$MOCK_BREW_STATE/$kind"; fi
    if [ -f "$MOCK_BREW_STATE/break-inventory-after-$token" ]; then touch "$MOCK_BREW_STATE/fail-list-$kind"; fi
    ;;
  *) exit 6 ;;
esac
`);
  for (const name of ['uname', 'id', 'PlistBuddy', 'brew']) await chmod(join(dir, 'bin', name), 0o755);
  return dir;
}

function run(dir, args, extraEnv = {}) {
  return spawnSync('/bin/bash', ['setup.sh', ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
      HOME: join(dir, 'home'),
      TMPDIR: join(dir, 'tmp'),
      MOCK_BREW_LOG: join(dir, 'brew.log'),
      MOCK_BREW_STATE: join(dir, 'state'),
      ...extraEnv,
    },
  });
}

async function setInventory(dir, kind, entries) {
  await writeFile(join(dir, 'state', kind), entries.length ? `${entries.join('\n')}\n` : '');
}

async function brewCalls(dir) {
  try { return (await readFile(join(dir, 'brew.log'), 'utf8')).trim().split('\n').filter(Boolean); }
  catch { return []; }
}

async function clearLog(dir) {
  await rm(join(dir, 'brew.log'), { force: true });
}

async function createValidApp(root, basename, executable = 'FixtureExec') {
  const app = join(root, basename);
  await mkdir(join(app, 'Contents', 'MacOS'), { recursive: true });
  await writeFile(join(app, 'Contents', 'Info.plist'), `CFBundlePackageType=APPL\nCFBundleExecutable=${executable}\nCFBundleIdentifier=test.fixture.app\n`);
  await writeFile(join(app, 'Contents', 'MacOS', executable), '#!/bin/sh\nexit 0\n');
  await chmod(join(app, 'Contents', 'MacOS', executable), 0o755);
  return app;
}

async function createBrokenApp(root, basename) {
  const app = join(root, basename);
  await mkdir(join(app, 'Contents', 'MacOS'), { recursive: true });
  await writeFile(join(app, 'Contents', 'Info.plist'), 'CFBundlePackageType=APPL\nCFBundleExecutable=MissingExec\n');
  return app;
}

function mutationCalls(calls) {
  return calls.filter(line => /^(update|install\t|upgrade\t)/.test(line));
}

test('dry-run and --yes alone never invoke brew or create temporary files', async t => {
  const dir = await fixture(t, { essentials: 'brew "git"\n' });
  const result = run(dir, ['--yes']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry-run mode/);
  assert.deepEqual(await brewCalls(dir), []);
  assert.deepEqual(await readdir(join(dir, 'tmp')), []);
});

test('--dry-run wins over --apply in either argument order', async t => {
  const dir = await fixture(t, { essentials: 'brew "git"\n' });
  for (const args of [['--dry-run', '--apply', '--yes'], ['--apply', '--yes', '--dry-run']]) {
    const result = run(dir, args);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.deepEqual(await brewCalls(dir), []);
  assert.deepEqual(await readdir(join(dir, 'tmp')), []);
});

test('mixed inventory uses exact tokens, detects external apps and conflicts, and installs only missing entries', async t => {
  const dir = await fixture(t, { essentials: [
    'brew "git"',
    'brew "gh"',
    'cask "receipt-app"',
    'cask "external-app"',
    'cask "broken-app"',
    'cask "missing-app"',
    '',
  ].join('\n') });
  await setInventory(dir, 'formula', ['git', 'gh-extra']);
  await setInventory(dir, 'cask', ['receipt-app']);
  const appdir = join(dir, 'Apps With Spaces');
  await mkdir(appdir);
  await createValidApp(appdir, mappings['external-app'], 'External Tool');
  await createBrokenApp(appdir, mappings['broken-app']);

  const result = run(dir, ['--apply', '--yes', '--appdir', `${appdir}/`]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid or incomplete existing app/);
  assert.match(result.stdout, /installed: 2/);
  assert.match(result.stdout, /skipped: 2/);
  assert.match(result.stdout, /external: 1/);
  assert.match(result.stdout, /conflict: 1/);
  const calls = await brewCalls(dir);
  assert.equal(calls.filter(x => x === 'update').length, 1);
  assert.ok(calls.includes('install\t--formula\tgh'));
  assert.ok(calls.includes(`install\t--cask\tmissing-app\t--appdir=${appdir}`));
  assert.ok(!calls.some(x => /\tgit$|\treceipt-app(?:\t|$)|\texternal-app(?:\t|$)|\tbroken-app(?:\t|$)/.test(x) && /^(install|upgrade)/.test(x)));
});

test('when all but one selected entry have exact receipts, only the missing entry is installed', async t => {
  const dir = await fixture(t, { essentials: 'brew "already-one"\nbrew "only-missing"\ncask "receipt-app"\n' });
  await setInventory(dir, 'formula', ['already-one', 'only-missing-extra']);
  await setInventory(dir, 'cask', ['receipt-app']);
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 0, result.stderr);
  const mutations = mutationCalls(await brewCalls(dir));
  assert.deepEqual(mutations, ['update', 'install\t--formula\tonly-missing']);
  assert.match(result.stdout, /installed: 1/);
  assert.match(result.stdout, /skipped: 2/);
});

test('a second successful apply only reads inventory and performs no update or mutation', async t => {
  const dir = await fixture(t, { essentials: 'brew "git"\ncask "second-cask"\n' });
  const appdir = join(dir, 'Applications Here');
  await mkdir(appdir);
  const first = run(dir, ['--apply', '--yes', '--appdir', appdir]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(mutationCalls(await brewCalls(dir)).length, 3);
  await clearLog(dir);

  const second = run(dir, ['--apply', '--yes', '--appdir', appdir]);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /installed: 0/);
  assert.match(second.stdout, /skipped: 2/);
  assert.deepEqual(mutationCalls(await brewCalls(dir)), []);
});

test('partial failure preserves success and retry installs only the remaining package', async t => {
  const dir = await fixture(t, { essentials: 'brew "first-tool"\nbrew "second-tool"\n' });
  await writeFile(join(dir, 'state', 'fail-install-formula-second-tool'), '1');
  const first = run(dir, ['--apply', '--yes']);
  assert.equal(first.status, 1);
  assert.deepEqual((await readFile(join(dir, 'state', 'formula'), 'utf8')).trim().split('\n'), ['first-tool']);
  await unlink(join(dir, 'state', 'fail-install-formula-second-tool'));
  await clearLog(dir);

  const retry = run(dir, ['--apply', '--yes']);
  assert.equal(retry.status, 0, retry.stderr);
  const calls = await brewCalls(dir);
  assert.ok(calls.includes('install\t--formula\tsecond-tool'));
  assert.ok(!calls.includes('install\t--formula\tfirst-tool'));
  assert.match(retry.stdout, /skipped: 1/);
});

test('either initial inventory failure fails closed before update or install', async t => {
  for (const kind of ['formula', 'cask']) {
    const dir = await fixture(t, { essentials: 'brew "git"\n' });
    await writeFile(join(dir, 'state', `fail-list-${kind}`), '1');
    const result = run(dir, ['--apply', '--yes']);
    assert.equal(result.status, 1);
    assert.deepEqual(mutationCalls(await brewCalls(dir)), []);
  }
});

test('brew update failure prevents all package mutations', async t => {
  const dir = await fixture(t, { essentials: 'brew "git"\ncask "missing-app"\n' });
  await writeFile(join(dir, 'state', 'fail-update'), '1');
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 1);
  const calls = await brewCalls(dir);
  assert.equal(calls.filter(x => x === 'update').length, 1);
  assert.ok(!calls.some(x => /^(install|upgrade)\t/.test(x)));
});

test('a successful command without a Homebrew receipt is reported as failure', async t => {
  const dir = await fixture(t, { essentials: 'brew "ghost-receipt"\n' });
  await writeFile(join(dir, 'state', 'false-success-install-formula-ghost-receipt'), '1');
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /reported success.*no receipt/);
  assert.match(result.stdout, /failed: 1/);
});

test('--upgrade mutates only selected Homebrew receipts and never adopts an external app', async t => {
  const dir = await fixture(t, { developer: 'brew "upgrade-formula"\nbrew "new-formula"\ncask "upgrade-cask"\ncask "external-app"\n' });
  await setInventory(dir, 'formula', ['upgrade-formula', 'unrelated-formula']);
  await setInventory(dir, 'cask', ['upgrade-cask', 'unrelated-cask']);
  const appdir = join(dir, 'External Apps');
  await mkdir(appdir);
  const external = await createValidApp(appdir, mappings['external-app']);
  const before = await readFile(join(external, 'Contents', 'Info.plist'), 'utf8');

  const result = run(dir, ['--profile', 'developer', '--apply', '--yes', '--upgrade', '--appdir', appdir]);
  assert.equal(result.status, 0, result.stderr);
  const calls = await brewCalls(dir);
  assert.ok(calls.includes('install\t--formula\tnew-formula'));
  assert.ok(calls.includes('upgrade\t--formula\tupgrade-formula'));
  assert.ok(calls.includes('upgrade\t--cask\tupgrade-cask'));
  assert.ok(!calls.some(x => /unrelated-|external-app/.test(x) && /^(install|upgrade)/.test(x)));
  assert.equal(await readFile(join(external, 'Contents', 'Info.plist'), 'utf8'), before);
  assert.match(result.stdout, /external: 1/);
});

test('non-macOS and root apply attempts are rejected before brew is invoked', async t => {
  const nonMac = await fixture(t, { essentials: 'brew "git"\n' });
  const linux = run(nonMac, ['--apply', '--yes'], { MOCK_UNAME: 'Linux' });
  assert.equal(linux.status, 2);
  assert.match(linux.stderr, /only on macOS/);
  assert.deepEqual(await brewCalls(nonMac), []);

  const root = await fixture(t, { essentials: 'brew "git"\n' });
  const rooted = run(root, ['--apply', '--yes'], { MOCK_UID: '0' });
  assert.equal(rooted.status, 2);
  assert.match(rooted.stderr, /as root/);
  assert.deepEqual(await brewCalls(root), []);
});

test('malformed Brewfile statements are rejected before any Homebrew action', async t => {
  const malformed = [
    'brew "good-tool"',
    'brew "bad-tool", restart_service: true',
    '',
  ].join('\n');
  const dir = await fixture(t, { essentials: malformed });
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /malformed profile statement/);
  assert.deepEqual(await brewCalls(dir), []);
});

test('duplicate profiles and entries result in one install', async t => {
  const dir = await fixture(t, { terminal: 'brew "duplicate-tool"\nbrew "duplicate-tool"\n' });
  const result = run(dir, ['--profile', 'terminal', '--profile', 'terminal', '--apply', '--yes']);
  assert.equal(result.status, 0, result.stderr);
  const calls = await brewCalls(dir);
  assert.equal(calls.filter(x => x === 'install\t--formula\tduplicate-tool').length, 1);
  assert.deepEqual(mutationCalls(calls), ['update', 'install\t--formula\tduplicate-tool']);
});

test('unsafe app directories and unknown profiles are rejected during argument validation', async t => {
  const dir = await fixture(t, { essentials: 'brew "git"\n' });
  for (const args of [['--appdir', '/'], ['--appdir', '/tmp/../Applications'], ['--appdir', 'relative'], ['--profile', 'unknown']]) {
    const result = run(dir, [...args, '--apply', '--yes']);
    assert.equal(result.status, 2);
  }
  assert.deepEqual(await brewCalls(dir), []);
});

test('dependencies installed earlier in the run are not installed a second time', async t => {
  const dir = await fixture(t, { essentials: 'brew "parent-tool"\nbrew "dependency-tool"\n' });
  await writeFile(join(dir, 'state', 'add-dependency-parent-tool'), 'dependency-tool\n');
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(mutationCalls(await brewCalls(dir)), ['update', 'install\t--formula\tparent-tool']);
  assert.match(result.stdout, /skipped: 1/);
});
test('inventory loss after an install prevents further mutations', async t => {
  const dir = await fixture(t, { essentials: 'brew "first-tool"\nbrew "later-tool"\ncask "missing-app"\n' });
  await writeFile(join(dir, 'state', 'break-inventory-after-first-tool'), '1');
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 1);
  assert.deepEqual(mutationCalls(await brewCalls(dir)), ['update', 'install\t--formula\tfirst-tool']);
});
test('inherited force/adopt options and forced auto-update do not leak into Homebrew commands', async t => {
  const dir = await fixture(t, { essentials: 'brew "safe-tool"\n' });
  const result = run(dir, ['--apply', '--yes'], { HOMEBREW_CASK_OPTS: '--force --adopt', HOMEBREW_FORCE_API_AUTO_UPDATE: '1' });
  assert.equal(result.status, 0, result.stderr);
});
test('a valid external app in user Applications is left alone even with --upgrade', async t => {
  const dir = await fixture(t, { essentials: 'cask "external-app"\n' });
  const appRoot = join(dir, 'home', 'Applications');
  await createValidApp(appRoot, mappings['external-app']);
  const result = run(dir, ['--apply', '--yes', '--upgrade']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /external: 1/);
  assert.deepEqual(mutationCalls(await brewCalls(dir)), []);
});

test('a valid app in the system Applications location is left untouched', async t => {
  const dir = await fixture(t, { essentials: 'cask "external-app"\n' });
  await createValidApp(join(dir, 'system-apps'), mappings['external-app']);
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /external: 1/);
  assert.deepEqual(mutationCalls(await brewCalls(dir)), []);
});
test('invalid and symlink app bundles in default locations remain conflicts', async t => {
  for (const mode of ['invalid', 'symlink']) {
    const dir = await fixture(t, { essentials: 'cask "broken-app"\n' });
    const appRoot = join(dir, 'home', 'Applications');
    await mkdir(appRoot);
    if (mode === 'invalid') await createBrokenApp(appRoot, mappings['broken-app']);
    else {
      const target = await createValidApp(join(dir, 'system-apps'), 'Other.app');
      await symlink(target, join(appRoot, mappings['broken-app']));
    }
    const result = run(dir, ['--apply', '--yes']);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /conflict: 1/);
    assert.deepEqual(mutationCalls(await brewCalls(dir)), []);
  }
});
test('cask false success is a failure and other independent casks still install', async t => {
  const dir = await fixture(t, { essentials: 'cask "false-cask"\ncask "missing-app"\n' });
  await writeFile(join(dir, 'state', 'false-success-install-cask-false-cask'), '1');
  const result = run(dir, ['--apply', '--yes']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cask false-cask but no receipt/);
  assert.match(result.stdout, /installed: 1/);
  assert.ok((await brewCalls(dir)).includes('install\t--cask\tmissing-app'));
});
test('cask inventory loss stops later casks and all queued upgrades', async t => {
  const dir = await fixture(t, { essentials: 'brew "existing-tool"\ncask "missing-app"\ncask "second-cask"\n' });
  await setInventory(dir, 'formula', ['existing-tool']);
  await writeFile(join(dir, 'state', 'break-inventory-after-missing-app'), '1');
  const result = run(dir, ['--apply', '--yes', '--upgrade']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unable to verify cask missing-app.*stopping further mutations/);
  assert.deepEqual(mutationCalls(await brewCalls(dir)), ['update', 'install\t--cask\tmissing-app']);
});
