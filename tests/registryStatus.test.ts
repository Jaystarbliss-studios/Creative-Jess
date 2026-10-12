import test from 'node:test';
import assert from 'node:assert/strict';
import { CRAFT_APPS } from '../src/data/registry';

test('catalog includes 21 unique repository records', () => {
  assert.equal(CRAFT_APPS.length, 21);
  assert.equal(new Set(CRAFT_APPS.map((app) => app.id)).size, CRAFT_APPS.length);
});

test('catalog statuses match CI build, MCP discovery, and focused acceptance evidence', () => {
  const evidence: Record<string, 'smoke_test_passed' | 'build_passed' | 'integrated_verified'> = {
    photocraft: 'integrated_verified',
    vectorcraft: 'integrated_verified',
    lightcraft: 'smoke_test_passed',
    filmcraft: 'smoke_test_passed',
    effectcraft: 'smoke_test_passed',
    soundcraft: 'build_passed',
    wordcraft: 'integrated_verified',
    designcraft: 'smoke_test_passed',
    deckcraft: 'integrated_verified',
    pdfcraft: 'integrated_verified',
    cadcraft: 'build_passed',
    gridcraft: 'integrated_verified',
  };
  for (const [id, status] of Object.entries(evidence)) {
    const app = CRAFT_APPS.find((candidate) => candidate.id === id);
    assert.ok(app, 'missing catalog entry for ' + id);
    assert.equal(app.status, status, id + ' must match evidence-backed status');
    assert.equal(app.hasDesktop, true, id + ' must have a successful desktop build');
    assert.equal(app.hasCli, true, id + ' must have a successful CLI build');
    assert.equal(app.hasMcp, true, id + ' must have MCP discovery evidence');
  }
});

test('integrated_verified is reserved for repositories with passing end-to-end acceptance scenarios', () => {
  const accepted = new Set(['photocraft', 'vectorcraft', 'wordcraft', 'gridcraft', 'deckcraft', 'pdfcraft', 'soundcraft', 'cadcraft']);
  const integrated = CRAFT_APPS.filter((app) => app.status === 'integrated_verified');
  assert.deepEqual(new Set(integrated.map((app) => app.id)), accepted);
  for (const app of integrated) assert.match(app.statusNotes, /CI .*temporary directory|CI created|CI generated/);
});

test('repositories with unresolved redistribution/security blockers stay blocked', () => {
  for (const id of ['artcraftx', 'artcraft-services']) {
    const app = CRAFT_APPS.find((candidate) => candidate.id === id);
    assert.ok(app, 'missing catalog entry for ' + id);
    assert.equal(app.status, 'blocked', id + ' must remain blocked until license/security review is resolved');
  }
});

test('support libraries with passing Windows workspace CI are build_passed only', () => {
  for (const id of ['craft-fonts', 'craft-libs']) {
    const app = CRAFT_APPS.find((candidate) => candidate.id === id);
    assert.ok(app, 'missing catalog entry for ' + id);
    assert.equal(app.status, 'build_passed', id + ' must match its successful workspace build');
    assert.equal(app.hasDesktop, false, id + ' is a support library, not a verified desktop app');
    assert.equal(app.hasCli, false, id + ' is not a verified CLI integration');
    assert.equal(app.hasMcp, false, id + ' is not a verified MCP integration');
  }
});
