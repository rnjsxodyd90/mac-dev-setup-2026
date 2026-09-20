import test from 'node:test';
import assert from 'node:assert/strict';
import { accessSync, constants, statSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, copyFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const profiles = ['essentials', 'developer', 'terminal', 'cloud', 'apps', 'ai', 'extras', 'optional'];
const requestedRunner = process.env.ANSIBLE_PLAYBOOK_BIN || 'ansible-playbook';
const candidates = requestedRunner.includes('/')
  ? [resolve(requestedRunner)]
  : (process.env.PATH || '').split(delimiter).map(dir => resolve(dir, requestedRunner));
const runner = candidates.find(candidate => {
  try {
    accessSync(candidate, constants.X_OK);
    return statSync(candidate).isFile();
  } catch { return false; }
});

// A fixture callback preserves structured results across Ansible's different stdout
// formats. It observes the real command module and recap, not a simulated runner.
const callback = `from ansible.plugins.callback import CallbackBase
import json
import os

class CallbackModule(CallbackBase):
    CALLBACK_VERSION = 2.0
    CALLBACK_TYPE = 'aggregate'
    CALLBACK_NAME = 'fixture_events'
    CALLBACK_NEEDS_ENABLED = True

    def emit(self, event):
        with open(os.environ['MOCK_ANSIBLE_EVENTS'], 'a', encoding='utf-8') as stream:
            stream.write(json.dumps(event, default=str) + '\\n')

    def result(self, kind, result):
        self.emit({'kind': kind, 'action': result._task.action,
                   'args': result._task.args, 'become': result._task.become,
                   'name': result._task.get_name(), 'result': result._result})

    def v2_runner_on_ok(self, result):
        self.result('ok', result)

    def v2_runner_on_failed(self, result, ignore_errors=False):
        self.result('failed', result)

    def v2_runner_on_skipped(self, result):
        self.result('skipped', result)

    def v2_playbook_on_stats(self, stats):
        self.emit({'kind': 'stats', 'hosts': {
            host: stats.summarize(host) for host in stats.processed}})
`;

async function fixture(t, selected = {}) {
  // Exercise spaces in the installer pathname. Dollar expansion is tested in
  // appdir: Ansible itself expands variables in inventory/config file paths.
  const dir = await mkdtemp(join(tmpdir(), 'ansible setup fixture-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of ['ansible', 'profiles', 'catalog', 'bin', 'state', 'home', 'tmp', 'callbacks', 'local-tmp', 'remote-tmp']) {
    await mkdir(join(dir, name));
  }
  await copyFile(new URL('../setup.sh', import.meta.url), join(dir, 'setup.sh'));
  await copyFile(new URL('../ansible/playbook.yml', import.meta.url), join(dir, 'ansible', 'playbook.yml'));
  for (const name of profiles) {
    await writeFile(join(dir, 'profiles', `${name}.Brewfile`), selected[name] ?? `brew "fixture-${name}"\n`);
  }
  // Formula-only fixtures avoid touching or even inspecting real application
  // bundles. The argv-only spy below covers appdir without running an installer.
  await writeFile(join(dir, 'catalog', 'app-bundles.tsv'), '# no casks in this fixture\n');
  for (const kind of ['formula', 'cask']) await writeFile(join(dir, 'state', kind), '');
  await writeFile(join(dir, 'inventory'), '[local]\nlocalhost ansible_connection=local\n');
  await writeFile(join(dir, 'ansible.cfg'), `[defaults]
inventory = ./inventory
local_tmp = ./local-tmp
remote_tmp = ./remote-tmp
callback_plugins = ./callbacks
callbacks_enabled = fixture_events
stdout_callback = default
retry_files_enabled = False
host_key_checking = False
interpreter_python = auto_silent
forks = 1
[privilege_escalation]
become = False
`);
  await writeFile(join(dir, 'callbacks', 'fixture_events.py'), callback);
  const scripts = {
    uname: '#!/bin/sh\ncase "$1" in -s) echo Darwin ;; -m) echo arm64 ;; *) exit 2 ;; esac\n',
    id: '#!/bin/sh\n[ "$1" = "-u" ] || exit 2\necho 501\n',
    // Any unexpected privilege escalation must fail, never run a real sudo.
    sudo: '#!/bin/sh\necho "unexpected sudo" >&2\nexit 90\n',
    brew: `#!/bin/sh
set -eu
cmd=$1
shift
printf '%s' "$cmd" >> "$MOCK_BREW_LOG"
for arg in "$@"; do printf '\\t%s' "$arg" >> "$MOCK_BREW_LOG"; done
printf '\\n' >> "$MOCK_BREW_LOG"
[ "\${HOMEBREW_NO_AUTO_UPDATE:-}" = 1 ] || exit 81
[ "\${HOMEBREW_NO_INSTALL_CLEANUP:-}" = 1 ] || exit 82
[ "\${HOMEBREW_NO_INSTALL_UPGRADE:-}" = 1 ] || exit 83
case "$cmd" in
  list)
    case "\${1:-}" in --formula) kind=formula ;; --cask) kind=cask ;; *) exit 84 ;; esac
    cat "$MOCK_BREW_STATE/$kind"
    ;;
  update) : ;;
  install)
    [ "\${1:-}" = --formula ] || exit 85
    token=\${2:?missing token}
    [ ! -f "$MOCK_BREW_STATE/fail-$token" ] || exit 19
    grep -Fqx "$token" "$MOCK_BREW_STATE/formula" || printf '%s\\n' "$token" >> "$MOCK_BREW_STATE/formula"
    ;;
  *) exit 86 ;;
esac
`,
  };
  for (const [name, body] of Object.entries(scripts)) {
    await writeFile(join(dir, 'bin', name), body);
    await chmod(join(dir, 'bin', name), 0o755);
  }
  return dir;
}

async function lines(file) {
  try { return (await readFile(file, 'utf8')).split('\n').filter(Boolean); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function run(dir, vars = {}, args = [], extraEnv = {}) {
  await writeFile(join(dir, 'vars.json'), JSON.stringify(vars));
  await rm(join(dir, 'events.jsonl'), { force: true });
  // Do not inherit a user's Ansible config, inventory, callbacks, escalation,
  // collection paths, or Homebrew overrides. The fixture config is authoritative.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !key.startsWith('ANSIBLE_') && !key.startsWith('HOMEBREW_')));
  const result = spawnSync(runner, ['-i', join(dir, 'inventory'), '-v',
    join(dir, 'ansible', 'playbook.yml'), '--extra-vars', `@${join(dir, 'vars.json')}`, ...args], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...env,
      ...extraEnv,
      PATH: `${join(dir, 'bin')}${delimiter}${process.env.PATH || '/usr/bin:/bin'}`,
      HOME: join(dir, 'home'),
      TMPDIR: join(dir, 'tmp'),
      ANSIBLE_CONFIG: join(dir, 'ansible.cfg'),
      ANSIBLE_LOCAL_TEMP: join(dir, 'local-tmp'),
      ANSIBLE_REMOTE_TEMP: join(dir, 'remote-tmp'),
      ANSIBLE_NOCOLOR: '1',
      ANSIBLE_FORCE_COLOR: '0',
      MOCK_ANSIBLE_EVENTS: join(dir, 'events.jsonl'),
      MOCK_BREW_LOG: join(dir, 'brew.log'),
      MOCK_BREW_STATE: join(dir, 'state'),
      MOCK_ARGV: join(dir, 'argv.bin'),
      MOCK_LITERAL: 'EXPANDED_INCORRECTLY',
    },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'Ansible must finish without a signal');
  result.events = (await lines(join(dir, 'events.jsonl'))).map(line => JSON.parse(line));
  result.diagnostic = `${result.stdout}\n${result.stderr}`;
  return result;
}

function stats(result) {
  const recap = result.events.find(event => event.kind === 'stats');
  assert.ok(recap, `missing callback recap:\n${result.diagnostic}`);
  assert.deepEqual(Object.keys(recap.hosts), ['localhost']);
  assert.ok(!result.events.some(event => /(?:^|\.)(setup|gather_facts)$/.test(event.action || '')), 'must not gather facts');
  return recap.hosts.localhost;
}

function commandResult(result) {
  const commands = result.events.filter(event => /(?:^|\.)command$/.test(event.action || ''));
  assert.equal(commands.length, 1, `expected one command-module invocation:\n${result.diagnostic}`);
  const command = commands[0].result;
  assert.equal(command.cmd[0], '/bin/bash');
  assert.equal(isAbsolute(command.cmd[1]), true);
  assert.equal(commands[0].args.expand_argument_vars, false, 'argv variable expansion must be explicitly disabled');
  assert.equal(commands[0].become, false, 'the installer must never escalate privileges');
  return command;
}

function succeeded(result, changed) {
  assert.equal(result.status, 0, result.diagnostic);
  const recap = stats(result);
  assert.equal(recap.changed, changed, result.diagnostic);
  assert.equal(recap.failures, 0, result.diagnostic);
  assert.equal(recap.unreachable, 0, result.diagnostic);
}

async function brewCalls(dir) { return lines(join(dir, 'brew.log')); }
function mutations(calls) { return calls.filter(line => /^(?:update|install|upgrade)(?:\t|$)/.test(line)); }

async function spyInstaller(dir) {
  // NUL-delimited arguments preserve spaces, quotes, dollar signs, and empty args.
  await writeFile(join(dir, 'setup.sh'), `#!/bin/bash
[ -n "\${BASH_VERSION:-}" ] || exit 91
printf '%s\\0' "$@" > "$MOCK_ARGV"
printf '%s\\n' "\${MOCK_SUMMARY:-  installed: 0}"
exit "\${MOCK_RC:-0}"
`);
}

async function argv(dir) {
  return (await readFile(join(dir, 'argv.bin'), 'utf8')).split('\0').slice(0, -1);
}

function optionValues(args, option) {
  return args.flatMap((arg, index) => arg === option ? [args[index + 1]] : []);
}

test('actual Ansible playbook integration', {
  skip: !runner && process.env.REQUIRE_ANSIBLE_TESTS !== '1'
    ? `Ansible not found: ${requestedRunner}; set ANSIBLE_PLAYBOOK_BIN, or REQUIRE_ANSIBLE_TESTS=1 to require it`
    : false,
}, async t => {
  assert.ok(runner, `Ansible is required but not found: ${requestedRunner}`);

  await t.test('default preview runs the real installer with --dry-run, essentials, and no Homebrew', async t => {
    const dir = await fixture(t);
    const result = await run(dir);
    succeeded(result, 0);
    const command = commandResult(result);
    assert.equal(resolve(command.cmd[1]), join(dir, 'setup.sh'));
    assert.ok(command.cmd.includes('--dry-run'));
    assert.ok(!command.cmd.includes('--apply'));
    assert.ok(!command.cmd.includes('--upgrade'));
    assert.ok(!command.cmd.includes('--appdir'));
    assert.match(command.stdout, /Selected profiles:\n  - essentials\n/);
    assert.match(command.stdout, /dry-run mode/);
    assert.deepEqual(await brewCalls(dir), []);
  });

  await t.test('--check overrides apply=true and still executes a real preview without Homebrew', async t => {
    const dir = await fixture(t);
    const result = await run(dir, { mac_setup_apply: true }, ['--check']);
    succeeded(result, 0);
    const command = commandResult(result);
    assert.ok(command.cmd.includes('--dry-run'));
    assert.ok(!command.cmd.includes('--apply'));
    assert.match(command.stdout, /dry-run mode/);
    assert.deepEqual(await brewCalls(dir), []);
  });

  await t.test('first apply installs missing packages; second apply is changed=0 with no update', async t => {
    const dir = await fixture(t, { essentials: 'brew "first-tool"\nbrew "second-tool"\n' });
    const first = await run(dir, { mac_setup_apply: true });
    succeeded(first, 1);
    const command = commandResult(first);
    assert.ok(command.cmd.includes('--apply'));
    assert.ok(command.cmd.includes('--yes'));
    assert.ok(!command.cmd.includes('--dry-run'));
    assert.ok(!command.cmd.includes('--upgrade'));
    assert.match(command.stdout, /^  installed: 2$/m);
    assert.deepEqual(mutations(await brewCalls(dir)), ['update', 'install\t--formula\tfirst-tool', 'install\t--formula\tsecond-tool']);
    await rm(join(dir, 'brew.log'));
    const second = await run(dir, { mac_setup_apply: true });
    succeeded(second, 0);
    assert.match(commandResult(second).stdout, /^  installed: 0$/m);
    assert.deepEqual(mutations(await brewCalls(dir)), []);
    assert.ok((await brewCalls(dir)).includes('list\t--formula\t-1'));
  });

  await t.test('partial inventory uses exact tokens, not prefix matches', async t => {
    const dir = await fixture(t, { essentials: 'brew "already-installed"\nbrew "missing-tool"\n' });
    await writeFile(join(dir, 'state', 'formula'), 'already-installed\nmissing-tool-extra\n');
    const result = await run(dir, { mac_setup_apply: true });
    succeeded(result, 1);
    assert.match(commandResult(result).stdout, /^  installed: 1$/m);
    assert.deepEqual(mutations(await brewCalls(dir)), ['update', 'install\t--formula\tmissing-tool']);
  });

  await t.test('all whitelisted profiles and literal appdir arguments survive argv transport', async t => {
    const dir = await fixture(t);
    await spyInstaller(dir);
    const appdir = join(dir, 'Apps $HOME ${MOCK_LITERAL} $(touch SHOULD_NOT_EXIST) "quoted"; literal');
    for (const [apply, check, mode] of [[false, false, '--dry-run'], [true, true, '--dry-run'], [true, false, '--apply']]) {
      const result = await run(dir, { mac_setup_profiles: profiles, mac_setup_appdir: appdir, mac_setup_apply: apply }, check ? ['--check'] : []);
      succeeded(result, 0);
      const command = commandResult(result);
      const args = await argv(dir);
      assert.deepEqual(command.cmd.slice(2), args);
      assert.deepEqual(optionValues(args, '--profile'), profiles);
      assert.deepEqual(optionValues(args, '--appdir'), [appdir]);
      const expected = [...profiles.flatMap(name => ['--profile', name]), '--appdir', appdir,
        ...(mode === '--apply' ? ['--apply', '--yes'] : ['--dry-run'])];
      // Flag order is not an interface requirement, but no extra arguments are.
      assert.deepEqual([...args].sort(), expected.sort());
      assert.equal(await readFile(join(dir, 'SHOULD_NOT_EXIST'), 'utf8').catch(error => error.code), 'ENOENT');
      assert.deepEqual(await brewCalls(dir), []);
    }
  });

  await t.test('malformed variables, unknown profiles, and any explicit upgrade are rejected before the installer', async t => {
    const invalid = [
      ['profiles string', { mac_setup_profiles: 'essentials' }],
      ['profiles null', { mac_setup_profiles: null }],
      ['profiles boolean', { mac_setup_profiles: true }],
      ['profiles object', { mac_setup_profiles: { essentials: true } }],
      ['profiles empty', { mac_setup_profiles: [] }],
      ['profiles unknown', { mac_setup_profiles: ['essentials', 'unknown'] }],
      ['profiles nonstring element', { mac_setup_profiles: ['essentials', 1] }],
      ['profiles nested element', { mac_setup_profiles: [['essentials']] }],
      ['apply string true', { mac_setup_apply: 'true' }],
      ['apply string false', { mac_setup_apply: 'false' }],
      ['apply number', { mac_setup_apply: 1 }],
      ['apply null', { mac_setup_apply: null }],
      ['apply list', { mac_setup_apply: [] }],
      ['appdir null', { mac_setup_appdir: null }],
      ['appdir boolean', { mac_setup_appdir: false }],
      ['appdir number', { mac_setup_appdir: 42 }],
      ['appdir list', { mac_setup_appdir: ['/tmp'] }],
      ['appdir object', { mac_setup_appdir: { path: '/tmp' } }],
      ['upgrade true', { mac_setup_upgrade: true }],
      ['upgrade false', { mac_setup_upgrade: false }],
      ['upgrade null', { mac_setup_upgrade: null }],
      ['upgrade string', { mac_setup_upgrade: 'false' }],
    ];
    const dir = await fixture(t);
    for (const [label, vars] of invalid) {
      await t.test(label, async () => {
        const result = await run(dir, { mac_setup_apply: true, ...vars });
        assert.notEqual(result.status, 0, `${label}: ${result.diagnostic}`);
        assert.equal(stats(result).changed, 0, result.diagnostic);
        assert.equal(stats(result).failures, 1, result.diagnostic);
        assert.ok(result.events.some(event => event.kind === 'failed' && /(?:^|\.)assert$/.test(event.action)), result.diagnostic);
        assert.ok(!result.events.some(event => /(?:^|\.)(command|shell|script)$/.test(event.action || '')), 'validation must precede installer execution');
        assert.deepEqual(await brewCalls(dir), []);
        assert.deepEqual(await lines(join(dir, 'state', 'formula')), []);
      });
    }
  });

  await t.test('installer failure reaches Ansible and retry installs only the remaining missing package', async t => {
    const dir = await fixture(t, { essentials: 'brew "first-tool"\nbrew "second-tool"\n' });
    await writeFile(join(dir, 'state', 'fail-second-tool'), '1');
    const first = await run(dir, { mac_setup_apply: true });
    assert.notEqual(first.status, 0, first.diagnostic);
    assert.equal(stats(first).failures, 1, first.diagnostic);
    const failed = commandResult(first);
    assert.equal(failed.rc, 1);
    assert.equal(failed.changed, true, 'partial success must still report a change');
    assert.match(failed.stdout, /^  installed: 1$/m);
    assert.match(failed.stdout, /^  failed: 1$/m);
    assert.deepEqual(await lines(join(dir, 'state', 'formula')), ['first-tool']);
    await rm(join(dir, 'state', 'fail-second-tool'));
    await rm(join(dir, 'brew.log'));
    const retry = await run(dir, { mac_setup_apply: true });
    succeeded(retry, 1);
    assert.match(commandResult(retry).stdout, /^  skipped: 1$/m);
    assert.deepEqual(mutations(await brewCalls(dir)), ['update', 'install\t--formula\tsecond-tool']);
  });

  await t.test('changed_when accepts only an exact positive installed summary line and propagates arbitrary rc', async t => {
    const dir = await fixture(t);
    await spyInstaller(dir);
    for (const [summary, changed] of [
      ['  installed: 0\n  upgrade_checks_completed: 9\n  skipped: 3', 0],
      ['installed: 1\n  installed: 01\n  installed: 2 trailing\nnoise installed: 3', 0],
      ['Summary:\n  installed: 12\n  skipped: 0', 1],
    ]) {
      const result = await run(dir, { mac_setup_apply: true }, [], { MOCK_SUMMARY: summary });
      succeeded(result, changed);
      assert.equal(commandResult(result).changed, changed === 1);
    }
    const failed = await run(dir, { mac_setup_apply: true }, [], { MOCK_RC: '23', MOCK_SUMMARY: '  installed: 0' });
    assert.notEqual(failed.status, 0, failed.diagnostic);
    assert.equal(stats(failed).failures, 1);
    assert.equal(commandResult(failed).rc, 23);
    assert.equal(commandResult(failed).changed, false);
    assert.deepEqual(await brewCalls(dir), []);
  });
});
