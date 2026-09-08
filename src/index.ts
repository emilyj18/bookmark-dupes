#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseBookmarksHtml, type Bookmark } from './parser.js';
import { normalizeUrl } from './normalizeUrl.js';

interface DuplicateGroup {
  url: string;
  count: number;
  entries: { title: string; folder: string }[];
}

// a folder filter of "Work" should match "Work" and "Work/Reading" but not
// "Personal/Work" or a sibling folder like "Work2"
export function folderMatches(folder: string, filter: string): boolean {
  return folder === filter || folder.startsWith(`${filter}/`);
}

interface ParsedArgs {
  file?: string;
  jsonMode: boolean;
  folder?: string;
}

export function parseArgs(args: string[]): ParsedArgs {
  const jsonMode = args.includes('--json');
  const folderIndex = args.indexOf('--folder');
  const folderValue = folderIndex === -1 ? undefined : args[folderIndex + 1];
  const folder = folderValue?.startsWith('--') ? undefined : folderValue;
  const skip = new Set([folderIndex, folderIndex + 1]);
  const file = args.find((arg, i) => !skip.has(i) && !arg.startsWith('--'));
  return { file, jsonMode, folder };
}

function findDuplicates(bookmarks: Bookmark[]): DuplicateGroup[] {
  const byUrl = new Map<string, Bookmark[]>();
  for (const bookmark of bookmarks) {
    const key = normalizeUrl(bookmark.url);
    const existing = byUrl.get(key);
    if (existing) {
      existing.push(bookmark);
    } else {
      byUrl.set(key, [bookmark]);
    }
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [url, entries] of byUrl) {
    if (entries.length < 2) continue;
    duplicates.push({
      url,
      count: entries.length,
      entries: entries.map((entry) => ({
        title: entry.title,
        folder: entry.folder || '(root)',
      })),
    });
  }

  duplicates.sort((a, b) => b.count - a.count);
  return duplicates;
}

function printHuman(duplicates: DuplicateGroup[]): void {
  if (duplicates.length === 0) {
    console.log('No duplicate bookmarks found.');
    return;
  }

  for (const group of duplicates) {
    console.log(`${group.url}  (${group.count} copies)`);
    for (const entry of group.entries) {
      console.log(`  - "${entry.title}" in ${entry.folder}`);
    }
    console.log('');
  }
  console.log(`${duplicates.length} duplicate URL(s) found.`);
}

function main(): void {
  const { file, jsonMode, folder } = parseArgs(process.argv.slice(2));

  if (!file || (process.argv.includes('--folder') && !folder)) {
    console.error('usage: bookmark-dupes <bookmarks.html> [--json] [--folder <path>]');
    process.exitCode = 1;
    return;
  }

  let html: string;
  try {
    html = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`could not read ${file}: ${(err as Error).message}`);
    process.exitCode = 1;
    return;
  }

  const allBookmarks = parseBookmarksHtml(html);
  const bookmarks = folder === undefined
    ? allBookmarks
    : allBookmarks.filter((bookmark) => folderMatches(bookmark.folder, folder));
  const duplicates = findDuplicates(bookmarks);

  if (jsonMode) {
    console.log(
      JSON.stringify({ totalBookmarks: bookmarks.length, duplicates }, null, 2)
    );
  } else {
    printHuman(duplicates);
  }
}

// guard so importing this module for tests doesn't also run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
