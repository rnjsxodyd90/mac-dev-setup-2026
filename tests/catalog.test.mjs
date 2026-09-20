import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'mac-catalog-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const entry of ['catalog', 'profiles', 'scripts', 'docs']) await cp(path.join(root, entry), path.join(dir, entry), { recursive: true });
  return dir;
}
function run(dir, command, preload) {
  return spawnSync(process.execPath, [...(preload ? ['--import', preload] : []), 'scripts/catalog.mjs', command], { cwd: dir, encoding: 'utf8', timeout: 10000 });
}
async function mockFetch(dir, body) {
  const file = path.join(dir, 'mock-fetch.mjs');
  await writeFile(file, body);
  return file;
}
const successMock = `
import { readFileSync } from 'node:fs';
const snapshot = JSON.parse(readFileSync(new URL('./catalog/verified.json', import.meta.url), 'utf8'));
globalThis.fetch = async url => {
  const id = url.split('/').pop().replace('.json','');
  const p = snapshot.packages.find(p => p.id === id);
  return { ok: true, json: async () => ({...p, name:p.token, versions:{stable:p.version}}) };
};
`;

test('committed catalog and generated files agree', () => {
  const result = run(root, 'check');
  assert.equal(result.status, 0, result.stderr);
});
test('generated drift is rejected', async t => {
  const dir = await fixture(t);
  await writeFile(path.join(dir, 'profiles/ai.Brewfile'), 'cask "wrong"\n');
  const result = run(dir, 'check');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Generated file is stale/);
});
test('invalid package identifiers cannot become executable Brewfile code', async t => {
  const dir = await fixture(t);
  const catalog = JSON.parse(await readFile(path.join(dir, 'catalog/apps.json')));
  catalog.packages[0].id = 'git"; system("bad")';
  await writeFile(path.join(dir, 'catalog/apps.json'), JSON.stringify(catalog));
  const result = run(dir, 'generate');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid package identifier/);
});
test('failed refresh preserves the last valid snapshot and generated files', async t => {
  const dir = await fixture(t);
  const before = await readFile(path.join(dir, 'catalog/verified.json'), 'utf8');
  const docsBefore = await readFile(path.join(dir, 'docs/apps.md'), 'utf8');
  const preload = await mockFetch(dir, 'globalThis.fetch = async () => { throw new Error("offline fixture"); };');
  const result = run(dir, 'refresh', preload);
  assert.equal(result.status, 1);
  assert.equal(await readFile(path.join(dir, 'catalog/verified.json'), 'utf8'), before);
  assert.equal(await readFile(path.join(dir, 'docs/apps.md'), 'utf8'), docsBefore);
  assert.match(await readFile(path.join(dir, 'reports/freshness.md'), 'utf8'), /snapshot has been preserved/);
});
test('matching live metadata passes without mutating committed verification', async t => {
  const dir = await fixture(t);
  const before = await readFile(path.join(dir, 'catalog/verified.json'), 'utf8');
  const preload = await mockFetch(dir, successMock);
  const result = run(dir, 'audit', preload);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, 'catalog/verified.json'), 'utf8'), before);
});
test('version drift reports review needed without replacing snapshot', async t => {
  const dir = await fixture(t);
  const before = await readFile(path.join(dir, 'catalog/verified.json'), 'utf8');
  const preload = await mockFetch(dir, successMock + '\nconst original = fetch; globalThis.fetch = async url => { const r = await original(url); const p = await r.json(); p.version = "fixture-new"; p.versions.stable = "fixture-new"; return {ok:true,json:async()=>p}; };');
  const result = run(dir, 'audit', preload);
  assert.equal(result.status, 2, result.stderr);
  assert.match(await readFile(path.join(dir, 'reports/freshness.md'), 'utf8'), /fixture-new/);
  assert.equal(await readFile(path.join(dir, 'catalog/verified.json'), 'utf8'), before);
});
test('disabled packages fail the refresh and preserve snapshot', async t => {
  const dir = await fixture(t);
  const before = await readFile(path.join(dir, 'catalog/verified.json'), 'utf8');
  const preload = await mockFetch(dir, successMock + '\nconst original = fetch; globalThis.fetch = async url => { const r = await original(url); const p = await r.json(); p.disabled = true; return {ok:true,json:async()=>p}; };');
  const result = run(dir, 'refresh', preload);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /disabled or deprecated/);
  assert.equal(await readFile(path.join(dir, 'catalog/verified.json'), 'utf8'), before);
});

test('non-open-source packages are restricted to the optional profile', async t => {
  const dir = await fixture(t);
  const catalog = JSON.parse(await readFile(path.join(dir, 'catalog/apps.json')));
  catalog.packages.find(p => p.id === 'aside').profile = 'essentials';
  await writeFile(path.join(dir, 'catalog/apps.json'), JSON.stringify(catalog));
  const result = run(dir, 'generate');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Non-open-source entry outside optional/);
});
test('open-source entries require license evidence', async t => {
  const dir = await fixture(t);
  const catalog = JSON.parse(await readFile(path.join(dir, 'catalog/apps.json')));
  delete catalog.packages.find(p => p.id === 'ghostty').license.evidence;
  await writeFile(path.join(dir, 'catalog/apps.json'), JSON.stringify(catalog));
  const result = run(dir, 'generate');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing license evidence/);
});
test('default and developer profiles use the intended open-source choices', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'catalog/apps.json')));
  for (const p of catalog.packages.filter(p => p.profile !== 'optional')) assert.equal(p.license.status, 'open-source', p.id);
  assert.equal(catalog.packages.find(p => p.id === 'vscodium').profile, 'developer');
  assert.equal(catalog.packages.find(p => p.id === 'colima').profile, 'cloud');
  assert.equal(catalog.packages.find(p => p.id === 'keepassxc').profile, 'essentials');
  for (const id of ['aside', 'visual-studio-code', 'cursor', 'claude', 'orbstack', 'bitwarden']) assert.equal(catalog.packages.find(p => p.id === id).profile, 'optional');
});
test('formula license drift triggers review without replacing snapshot', async t => {
  const dir = await fixture(t);
  const before = await readFile(path.join(dir, 'catalog/verified.json'), 'utf8');
  const preload = await mockFetch(dir, successMock + '\nconst original = fetch; globalThis.fetch = async url => { const r = await original(url); const p = await r.json(); if (p.kind === "formula") p.license = "fixture-changed-license"; return {ok:true,json:async()=>p}; };');
  const result = run(dir, 'audit', preload);
  assert.equal(result.status, 2, result.stderr);
  assert.match(await readFile(path.join(dir, 'reports/freshness.md'), 'utf8'), /license changed/);
  assert.equal(await readFile(path.join(dir, 'catalog/verified.json'), 'utf8'), before);
});
