import { test } from 'node:test';
import assert from 'node:assert/strict';
import { folderMatches, parseArgs, findDuplicates } from './index.js';
import type { Bookmark } from './parser.js';

function bookmark(overrides: Partial<Bookmark>): Bookmark {
  return { title: 'Untitled', url: 'https://example.com', folder: '', ...overrides };
}

test('folderMatches: matches the folder itself', () => {
  assert.equal(folderMatches('Work', 'Work'), true);
});

test('folderMatches: matches a subfolder', () => {
  assert.equal(folderMatches('Work/Reading', 'Work'), true);
});

test('folderMatches: rejects an unrelated folder with the same prefix', () => {
  assert.equal(folderMatches('Work2', 'Work'), false);
});

test('folderMatches: rejects a folder that only contains the filter as a suffix', () => {
  assert.equal(folderMatches('Personal/Work', 'Work'), false);
});

test('folderMatches: root bookmarks never match a named filter', () => {
  assert.equal(folderMatches('', 'Work'), false);
});

test('parseArgs: reads the file, --json, and --folder together', () => {
  const parsed = parseArgs(['bookmarks.html', '--json', '--folder', 'Work/Reading']);
  assert.deepEqual(parsed, {
    file: 'bookmarks.html',
    jsonMode: true,
    folder: 'Work/Reading',
  });
});

test('parseArgs: works with no flags', () => {
  const parsed = parseArgs(['bookmarks.html']);
  assert.deepEqual(parsed, { file: 'bookmarks.html', jsonMode: false, folder: undefined });
});

test('parseArgs: --folder value is not mistaken for the input file', () => {
  const parsed = parseArgs(['--folder', 'Work', 'bookmarks.html']);
  assert.equal(parsed.file, 'bookmarks.html');
  assert.equal(parsed.folder, 'Work');
});

test('parseArgs: a --folder with no value does not swallow a following flag', () => {
  const parsed = parseArgs(['bookmarks.html', '--folder', '--json']);
  assert.equal(parsed.folder, undefined);
  assert.equal(parsed.jsonMode, true);
});

test('parseArgs: missing file leaves file undefined', () => {
  const parsed = parseArgs(['--json']);
  assert.equal(parsed.file, undefined);
});

test('findDuplicates: returns nothing when every URL is unique', () => {
  const bookmarks = [
    bookmark({ url: 'https://example.com/a' }),
    bookmark({ url: 'https://example.com/b' }),
  ];
  assert.deepEqual(findDuplicates(bookmarks), []);
});

test('findDuplicates: groups bookmarks that normalize to the same URL', () => {
  const bookmarks = [
    bookmark({ url: 'https://example.com/page', title: 'Page' }),
    bookmark({ url: 'https://example.com/page/#section', title: 'Page (copy)' }),
  ];
  const duplicates = findDuplicates(bookmarks);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].url, 'example.com/page');
  assert.equal(duplicates[0].count, 2);
});

test('findDuplicates: labels an empty folder as (root)', () => {
  const bookmarks = [
    bookmark({ url: 'https://example.com/page', folder: '' }),
    bookmark({ url: 'https://example.com/page', folder: 'Work' }),
  ];
  const [group] = findDuplicates(bookmarks);
  assert.deepEqual(
    group.entries.map((e) => e.folder),
    ['(root)', 'Work']
  );
});

test('findDuplicates: sorts groups by copy count, most first', () => {
  const bookmarks = [
    bookmark({ url: 'https://example.com/a' }),
    bookmark({ url: 'https://example.com/a' }),
    bookmark({ url: 'https://example.com/b' }),
    bookmark({ url: 'https://example.com/b' }),
    bookmark({ url: 'https://example.com/b' }),
  ];
  const duplicates = findDuplicates(bookmarks);
  assert.deepEqual(
    duplicates.map((d) => d.url),
    ['example.com/b', 'example.com/a']
  );
});

test('findDuplicates: a lone bookmark never forms a group of one', () => {
  const bookmarks = [
    bookmark({ url: 'https://example.com/a' }),
    bookmark({ url: 'https://example.com/b' }),
    bookmark({ url: 'https://example.com/b' }),
  ];
  const duplicates = findDuplicates(bookmarks);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].url, 'example.com/b');
});
