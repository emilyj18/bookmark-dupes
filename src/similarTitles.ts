import type { Bookmark } from './parser.js';
import { normalizeUrl } from './normalizeUrl.js';

export interface SimilarTitleGroup {
  title: string;
  entries: { title: string; url: string; folder: string }[];
}

// Browsers and sync tools append "(2)" when they save a page under a title
// that already exists, so that marker is noise for comparison purposes.
const COPY_SUFFIX_RE = /\s*\(\d+\)\s*$/;

// Key used to decide whether two titles are "the same" for this report:
// case, punctuation, diacritics, spacing and a trailing copy counter are
// ignored. Returns '' for titles with no letters or digits in them.
export function titleKey(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(COPY_SUFFIX_RE, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Finds bookmarks that share a title but point at different pages, e.g. the
// same article saved from a mobile and a desktop URL that normalizeUrl can't
// unify. Groups whose entries all normalize to one URL are left out, since
// findDuplicates already reports those.
export function findSimilarTitles(bookmarks: Bookmark[]): SimilarTitleGroup[] {
  const byKey = new Map<string, Bookmark[]>();
  for (const bookmark of bookmarks) {
    const key = titleKey(bookmark.title);
    if (key === '') continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.push(bookmark);
    } else {
      byKey.set(key, [bookmark]);
    }
  }

  const groups: SimilarTitleGroup[] = [];
  for (const [key, entries] of byKey) {
    const urls = new Set(entries.map((entry) => normalizeUrl(entry.url)));
    if (urls.size < 2) continue;
    groups.push({
      title: key,
      entries: entries.map((entry) => ({
        title: entry.title,
        url: entry.url,
        folder: entry.folder || '(root)',
      })),
    });
  }

  groups.sort((a, b) => b.entries.length - a.entries.length || a.title.localeCompare(b.title));
  return groups;
}
