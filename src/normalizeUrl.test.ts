import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl } from './normalizeUrl.js';

test('strips fragments', () => {
  assert.equal(normalizeUrl('https://example.com/page#section'), 'example.com/page');
});

test('strips trailing slash from non-root paths', () => {
  assert.equal(normalizeUrl('https://example.com/page/'), 'example.com/page');
});

test('keeps the slash on a bare root path', () => {
  assert.equal(normalizeUrl('https://example.com/'), 'example.com/');
});

test('preserves the query string', () => {
  assert.equal(
    normalizeUrl('https://example.com/search?q=cats'),
    'example.com/search?q=cats'
  );
});

test('ignores scheme differences', () => {
  assert.equal(
    normalizeUrl('http://example.com/page'),
    normalizeUrl('https://example.com/page')
  );
});

test('treats different hosts as different bookmarks', () => {
  assert.notEqual(
    normalizeUrl('https://example.com/page'),
    normalizeUrl('https://mirror.example.com/page')
  );
});

test('falls back to the raw string for input the URL constructor rejects', () => {
  assert.equal(normalizeUrl('not a url'), 'not a url');
});
