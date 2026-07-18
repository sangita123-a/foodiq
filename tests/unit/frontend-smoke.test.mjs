/**
 * Frontend unit smoke — pure helpers (Node test runner, no React mount).
 * Run from repo root: node --test tests/unit/*.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('foodiq frontend smoke', () => {
  it('package name is foodiq', async () => {
    const { readFileSync } = await import('node:fs');
    const pkg = JSON.parse(readFileSync(new URL('../fixtures/package-name.json', import.meta.url)));
    assert.equal(pkg.name, 'foodiq');
  });

  it('NEXT_PUBLIC_API_URL placeholder is http(s)', () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    assert.match(url, /^https?:\/\//);
  });
});
