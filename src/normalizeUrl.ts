// trailing slashes and url fragments are cosmetic - the same page saved
// from two different tabs shouldn't count as two different bookmarks
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return `${parsed.host}${path}${parsed.search}`;
  } catch {
    return url;
  }
}
