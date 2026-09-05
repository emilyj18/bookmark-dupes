// Parses the Netscape Bookmark File Format, the HTML dialect every major
// browser (Chrome, Firefox, Safari, Edge) both imports and exports. It is
// not real HTML - tags are unclosed by design - so a DOM parser doesn't
// help here. A stack-tracking token scan is enough because the format is
// rigid: folders are <H3> headers immediately followed by a <DL><p> block
// containing their children, closed by a matching </DL><p>.

export interface Bookmark {
  title: string;
  url: string;
  folder: string;
  addDate?: number;
}

const TOKEN_RE =
  /<DT><H3[^>]*>([^<]*)<\/H3>|<DT><A\s+([^>]*)>([^<]*)<\/A>|<DL><p>|<\/DL><p>/gi;
const HREF_RE = /HREF="([^"]*)"/i;
const ADD_DATE_RE = /ADD_DATE="(\d+)"/i;

export function parseBookmarksHtml(html: string): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  // null entries are anonymous DL wrappers (the top-level DL, or a stray
  // extra one some exporters emit) - they still need to occupy a stack
  // slot so a later </DL> pops the right level, but they must not turn
  // into an empty path segment when joined
  const stack: (string | null)[] = [];
  let pendingFolder: string | null = null;

  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(html)) !== null) {
    const [full, folderTitle, linkAttrs, linkTitle] = match;

    if (folderTitle !== undefined) {
      pendingFolder = decodeEntities(folderTitle.trim());
      continue;
    }

    if (linkAttrs !== undefined) {
      const hrefMatch = HREF_RE.exec(linkAttrs);
      if (!hrefMatch) continue;
      const addDateMatch = ADD_DATE_RE.exec(linkAttrs);
      bookmarks.push({
        title: decodeEntities((linkTitle ?? '').trim()),
        url: hrefMatch[1],
        folder: stack.filter((segment): segment is string => segment !== null).join('/'),
        addDate: addDateMatch ? Number(addDateMatch[1]) : undefined,
      });
      continue;
    }

    if (/^<DL>/i.test(full)) {
      stack.push(pendingFolder);
      pendingFolder = null;
    } else if (/^<\/DL>/i.test(full)) {
      stack.pop();
    }
  }

  return bookmarks;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
