import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = new URL('../setup.sh', import.meta.url);
const profiles = { essentials: 'brew "git"\n', developer: 'brew "node"\n', ai: 'cask "ollama"\n', cloud: 'brew "terraform"\n', extras: 'cask "iterm2"\n' };
async function repo() {
  const dir = await mkdtemp(join(tmpdir(), 'mac-dev-setup-'));
  await mkdir(join(dir, 'profiles')); await copyFile(source, join(dir, 'setup.sh')); await chmod(join(dir, 'setup.sh'), 0o755);
  await Promise.all(Object.entries(profiles).map(([n, b]) => writeFile(join(dir, 'profiles', n + '.Brewfile'), b)));
  return dir;
}
async function mockBin(dir, { brew = null, uname = 'Darwin', arch = 'arm64', uid = '501' } = {}) {
  const bin = join(dir, 'bin'); await mkdir(bin);
  await writeFile(join(bin, 'uname'), `#!/bin/sh\nif [ "$1" = -s ]; then echo ${uname}; else echo ${arch}; fi\n`);
  await writeFile(join(bin, 'id'), `#!/bin/sh\necho ${uid}\n`);
  if (brew !== null) await writeFile(join(bin, 'brew'), `#!/bin/sh\nprintf '%s\\n' "$@" >> "$LOG"\n${brew}\n`);
  for (const n of brew === null ? ['uname', 'id'] : ['uname', 'id', 'brew']) await chmod(join(bin, n), 0o755);
  return bin;
}
function run(dir, args, env = {}) { return spawnSync('/bin/bash', ['setup.sh', ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env } }); }

test('default dry-run has no brew side effect', async t => {
  const dir = await repo(); t.after(() => rm(dir, { recursive: true, force: true }));
  const r = run(dir, []); assert.equal(r.status, 0); assert.match(r.stdout, /Selected profiles:[\s\S]*essentials/); assert.match(r.stdout, /--no-upgrade/); assert.doesNotMatch(r.stderr, /Homebrew was not found/);
});
test('--yes alone remains a dry-run', async t => {
  const dir = await repo(), log = join(dir, 'brew.log'), bin = await mockBin(dir, { brew: 'exit 99' }); t.after(() => rm(dir, { recursive: true, force: true }));
  assert.equal(run(dir, ['--yes'], { PATH: bin + ':' + process.env.PATH, LOG: log }).status, 0); await assert.rejects(readFile(log, 'utf8'));
});
test('rejects unknown options and profiles', async t => {
  const dir = await repo(); t.after(() => rm(dir, { recursive: true, force: true })); assert.equal(run(dir, ['--wat']).status, 2); assert.equal(run(dir, ['--profile', 'oops']).status, 2);
});
test('shows multiple selected profiles', async t => {
  const dir = await repo(); t.after(() => rm(dir, { recursive: true, force: true })); const r = run(dir, ['--profile', 'developer', '--profile', 'cloud']); assert.equal(r.status, 0); assert.match(r.stdout, /\[developer\][\s\S]*\[cloud\]/);
});
test('apply defaults to --no-upgrade and combines profiles', async t => {
  const dir = await repo(), log = join(dir, 'brew.log'), bin = await mockBin(dir, { brew: 'exit 0' }); t.after(() => rm(dir, { recursive: true, force: true }));
  const r = run(dir, ['--apply', '--yes', '--profile', 'developer'], { PATH: bin + ':' + process.env.PATH, LOG: log }); assert.equal(r.status, 0); const calls = await readFile(log, 'utf8'); assert.match(calls, /^update$/m); assert.match(calls, /bundle\ninstall\n--file=.*\n--no-upgrade/);
});
test('--upgrade omits --no-upgrade', async t => {
  const dir = await repo(), log = join(dir, 'brew.log'), bin = await mockBin(dir, { brew: 'exit 0' }); t.after(() => rm(dir, { recursive: true, force: true }));
  assert.equal(run(dir, ['--apply', '--yes', '--upgrade'], { PATH: bin + ':' + process.env.PATH, LOG: log }).status, 0); assert.doesNotMatch(await readFile(log, 'utf8'), /--no-upgrade/);
});
test('update failure halts and bundle failure propagates', async t => {
  const one = await repo(), log1 = join(one, 'log'), bin1 = await mockBin(one, { brew: '[ "$1" = update ] && exit 7; exit 0' }); t.after(() => rm(one, { recursive: true, force: true }));
  assert.equal(run(one, ['--apply', '--yes'], { PATH: bin1 + ':' + process.env.PATH, LOG: log1 }).status, 7); assert.doesNotMatch(await readFile(log1, 'utf8'), /bundle/);
  const two = await repo(), log2 = join(two, 'log'), bin2 = await mockBin(two, { brew: '[ "$1" = bundle ] && exit 9; exit 0' }); t.after(() => rm(two, { recursive: true, force: true }));
  assert.equal(run(two, ['--apply', '--yes'], { PATH: bin2 + ':' + process.env.PATH, LOG: log2 }).status, 9);
});
test('apply rejects noninteractive confirmation, absent brew, and root', async t => {
  const a = await repo(), abin = await mockBin(a, { brew: 'exit 0' }); t.after(() => rm(a, { recursive: true, force: true })); assert.match(run(a, ['--apply'], { PATH: abin + ':' + process.env.PATH }).stderr, /interactive terminal confirmation/);
  const b = await repo(), bbin = await mockBin(b); t.after(() => rm(b, { recursive: true, force: true }));
  const wrapper = join(b, 'setup.sh');
  await writeFile(wrapper, (await readFile(wrapper, 'utf8')).replaceAll('/opt/homebrew/bin/brew', '/missing/homebrew/bin/brew').replaceAll('/usr/local/bin/brew', '/missing/local/bin/brew'));
  assert.match(run(b, ['--apply', '--yes'], { PATH: bbin + ':/usr/bin:/bin' }).stderr, /Homebrew was not found/);
  const c = await repo(), cbin = await mockBin(c, { brew: 'exit 0', uid: '0' }); t.after(() => rm(c, { recursive: true, force: true })); assert.match(run(c, ['--apply', '--yes'], { PATH: cbin + ':' + process.env.PATH }).stderr, /as root/);
});
