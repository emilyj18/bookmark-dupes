import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSimilarTitles, titleKey } from './similarTitles.js';
import type { Bookmark } from './parser.js';

function bm(title: string, url: string, folder = ''): Bookmark {
  return { title, url, folder };
}

test('titleKey ignores case, punctuation and spacing', () => {
  assert.equal(titleKey('  Some   Article: Part-1! '), 'some article part 1');
});

test('titleKey drops a trailing copy counter', () => {
  assert.equal(titleKey('Some Article (2)'), titleKey('Some Article'));
});

test('titleKey keeps a counter that is part of the title', () => {
  assert.notEqual(titleKey('Top 10'), titleKey('Top'));
});

test('titleKey folds diacritics', () => {
  assert.equal(titleKey('Café Menu'), titleKey('cafe menu'));
});

test('titleKey is empty for titles with no letters or digits', () => {
  assert.equal(titleKey('--- ()'), '');
});

test('groups same-titled bookmarks with different URLs', () => {
  const groups = findSimilarTitles([
    bm('Some Article', 'https://example.com/a', 'Work'),
    bm('some article (2)', 'https://m.example.com/a'),
    bm('Unrelated', 'https://example.com/b'),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].title, 'some article');
  assert.deepEqual(
    groups[0].entries.map((e) => e.folder),
    ['Work', '(root)']
  );
});

test('skips groups that are exact URL duplicates', () => {
  const groups = findSimilarTitles([
    bm('Same', 'https://example.com/a#one'),
    bm('Same', 'https://example.com/a/'),
  ]);
  assert.deepEqual(groups, []);
});

test('ignores empty-key titles', () => {
  const groups = findSimilarTitles([
    bm('', 'https://example.com/a'),
    bm('...', 'https://example.com/b'),
  ]);
  assert.deepEqual(groups, []);
});

test('sorts larger groups first, then by title', () => {
  const groups = findSimilarTitles([
    bm('Beta', 'https://example.com/1'),
    bm('Beta', 'https://example.com/2'),
    bm('Alpha', 'https://example.com/3'),
    bm('Alpha', 'https://example.com/4'),
    bm('Gamma', 'https://example.com/5'),
    bm('Gamma', 'https://example.com/6'),
    bm('Gamma', 'https://example.com/7'),
  ]);
  assert.deepEqual(
    groups.map((g) => g.title),
    ['gamma', 'alpha', 'beta']
  );
});
