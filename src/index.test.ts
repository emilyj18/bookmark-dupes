import { test } from 'node:test';
import assert from 'node:assert/strict';
import { folderMatches, parseArgs } from './index.js';

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
