import test from 'node:test';
import assert from 'node:assert/strict';
import { CRAFT_APPS } from '../src/data/registry';

test('catalog includes 21 unique repository records', () => {
  assert.equal(CRAFT_APPS.length, 21);
  assert.equal(new Set(CRAFT_APPS.map((app) => app.id)).size, CRAFT_APPS.length);
});

test('only apps with CI build and MCP evidence carry verified smoke/build statuses', () => {
  const evidence: Record<string, 'smoke_test_passed' | 'build_passed'> = {
    photocraft: 'smoke_test_passed',
    vectorcraft: 'smoke_test_passed',
    lightcraft: 'smoke_test_passed',
    filmcraft: 'smoke_test_passed',
    effectcraft: 'smoke_test_passed',
    soundcraft: 'build_passed',
    wordcraft: 'smoke_test_passed',
    designcraft: 'smoke_test_passed',
    deckcraft: 'smoke_test_passed',
    cadcraft: 'build_passed',
    gridcraft: 'smoke_test_passed',
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

test('no app is marked integrated_verified before editing/export acceptance passes', () => {
  assert.equal(CRAFT_APPS.filter((app) => app.status === 'integrated_verified').length, 0);
});
