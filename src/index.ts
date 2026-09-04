#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseBookmarksHtml, type Bookmark } from './parser.js';
import { normalizeUrl } from './normalizeUrl.js';

interface DuplicateGroup {
  url: string;
  count: number;
  entries: { title: string; folder: string }[];
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
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const file = args.find((arg) => !arg.startsWith('--'));

  if (!file) {
    console.error('usage: bookmark-dupes <bookmarks.html> [--json]');
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

  const bookmarks = parseBookmarksHtml(html);
  const duplicates = findDuplicates(bookmarks);

  if (jsonMode) {
    console.log(
      JSON.stringify({ totalBookmarks: bookmarks.length, duplicates }, null, 2)
    );
  } else {
    printHuman(duplicates);
  }
}

main();
