import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBookmarksHtml } from './parser.js';

test('parses a flat list of bookmarks at the root', () => {
  const html = `
    <DL><p>
      <DT><A HREF="https://example.com/one">One</A>
      <DT><A HREF="https://example.com/two">Two</A>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 2);
  assert.equal(bookmarks[0].url, 'https://example.com/one');
  assert.equal(bookmarks[0].title, 'One');
  assert.equal(bookmarks[0].folder, '');
});

test('tracks nested folder paths', () => {
  const html = `
    <DL><p>
      <DT><H3>Work</H3>
      <DL><p>
        <DT><H3>Reading</H3>
        <DL><p>
          <DT><A HREF="https://example.com/article">Article</A>
        </DL><p>
      </DL><p>
    </DL><p>
  `;
  const [bookmark] = parseBookmarksHtml(html);
  assert.equal(bookmark.folder, 'Work/Reading');
});

test('returns to the parent folder after a closing DL', () => {
  const html = `
    <DL><p>
      <DT><H3>Work</H3>
      <DL><p>
        <DT><A HREF="https://example.com/a">A</A>
      </DL><p>
      <DT><A HREF="https://example.com/b">B</A>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks[0].folder, 'Work');
  assert.equal(bookmarks[1].folder, '');
});

test('decodes HTML entities in titles', () => {
  const html = `
    <DL><p>
      <DT><A HREF="https://example.com/x">Tom &amp; Jerry &lt;1940&gt; &quot;short&quot; &#39;cut&#39;</A>
    </DL><p>
  `;
  const [bookmark] = parseBookmarksHtml(html);
  assert.equal(bookmark.title, `Tom & Jerry <1940> "short" 'cut'`);
});

test('reads ADD_DATE when present', () => {
  const html = `
    <DL><p>
      <DT><A HREF="https://example.com/x" ADD_DATE="1700000000">X</A>
    </DL><p>
  `;
  const [bookmark] = parseBookmarksHtml(html);
  assert.equal(bookmark.addDate, 1700000000);
});

test('leaves addDate undefined when missing', () => {
  const html = `
    <DL><p>
      <DT><A HREF="https://example.com/x">X</A>
    </DL><p>
  `;
  const [bookmark] = parseBookmarksHtml(html);
  assert.equal(bookmark.addDate, undefined);
});

test('skips links without an HREF', () => {
  const html = `
    <DL><p>
      <DT><A>No href</A>
      <DT><A HREF="https://example.com/x">X</A>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0].url, 'https://example.com/x');
});

test('returns an empty list for input with no links', () => {
  assert.deepEqual(parseBookmarksHtml('<DL><p></DL><p>'), []);
});

test('does not insert an empty segment for a stray extra DL wrapper', () => {
  // some exporters double-wrap a folder's contents in an extra <DL><p>
  // with no <H3> of its own
  const html = `
    <DL><p>
      <DT><H3>Work</H3>
      <DL><p>
        <DL><p>
          <DT><A HREF="https://example.com/a">A</A>
        </DL><p>
      </DL><p>
    </DL><p>
  `;
  const [bookmark] = parseBookmarksHtml(html);
  assert.equal(bookmark.folder, 'Work');
});

test('does not crash on an unmatched trailing closing tag', () => {
  const html = `
    <DL><p>
      <DT><A HREF="https://example.com/a">A</A>
    </DL><p>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0].folder, '');
});

test('does not crash on a folder missing its closing tag', () => {
  const html = `
    <DL><p>
      <DT><H3>Work</H3>
      <DL><p>
        <DT><A HREF="https://example.com/a">A</A>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0].folder, 'Work');
});

test('handles folders several levels deeper than typical exports', () => {
  const depth = 25;
  const open = '<DT><H3>F</H3>\n<DL><p>\n'.repeat(depth);
  const close = '</DL><p>\n'.repeat(depth);
  const html = `<DL><p>${open}<DT><A HREF="https://example.com/deep">Deep</A>${close}</DL><p>`;
  const [bookmark] = parseBookmarksHtml(html);
  assert.equal(bookmark.folder, Array(depth).fill('F').join('/'));
});

// The fixtures below mirror the real export format of each browser rather
// than the minimal hand-written HTML above: the DOCTYPE/META/TITLE preamble,
// the extra attributes each browser stamps onto <H3> and <A>, and the
// browser-specific quirks (Chrome/Firefox's base64 ICON data URIs, Firefox's
// <HR> separators and ICON_URI, Safari's valueless FOLDED attribute).

test('parses a Chrome-style export', () => {
  const html = `
    <!DOCTYPE NETSCAPE-Bookmark-file-1>
    <!-- This is an automatically generated file.
         It will be read and overwritten.
         DO NOT EDIT! -->
    <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
    <TITLE>Bookmarks</TITLE>
    <H1>Bookmarks</H1>
    <DL><p>
        <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000100" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
        <DL><p>
            <DT><A HREF="https://example.com/one" ADD_DATE="1700000200" ICON="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA">Site One</A>
            <DT><H3 ADD_DATE="1700000300" LAST_MODIFIED="1700000400">Work</H3>
            <DL><p>
                <DT><A HREF="https://example.com/two" ADD_DATE="1700000500">Site Two</A>
            </DL><p>
        </DL><p>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 2);
  assert.equal(bookmarks[0].url, 'https://example.com/one');
  assert.equal(bookmarks[0].folder, 'Bookmarks bar');
  assert.equal(bookmarks[1].url, 'https://example.com/two');
  assert.equal(bookmarks[1].folder, 'Bookmarks bar/Work');
});

test('parses a Firefox-style export, ignoring <HR> separators', () => {
  const html = `
    <!DOCTYPE NETSCAPE-Bookmark-file-1>
    <!-- This is an automatically generated file.
         It will be read and overwritten.
         DO NOT EDIT! -->
    <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
    <TITLE>Bookmarks</TITLE>
    <H1>Bookmarks Menu</H1>

    <DL><p>
        <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000100" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Toolbar</H3>
        <DL><p>
            <DT><A HREF="https://example.com/three" ADD_DATE="1700000200" LAST_MODIFIED="1700000200" ICON_URI="fake-favicon-uri:https://example.com/three" ICON="data:image/png;base64,AAAA">Site Three</A>
            <DT><HR>
            <DT><A HREF="https://example.com/four" ADD_DATE="1700000300">Site Four</A>
        </DL><p>
        <DT><H3 ADD_DATE="1700000400" LAST_MODIFIED="1700000400">Other Bookmarks</H3>
        <DL><p>
            <DT><A HREF="https://example.com/five" ADD_DATE="1700000500">Site Five</A>
        </DL><p>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 3);
  assert.deepEqual(bookmarks.map((b) => b.url), [
    'https://example.com/three',
    'https://example.com/four',
    'https://example.com/five',
  ]);
  assert.equal(bookmarks[0].folder, 'Bookmarks Toolbar');
  assert.equal(bookmarks[1].folder, 'Bookmarks Toolbar');
  assert.equal(bookmarks[2].folder, 'Other Bookmarks');
});

test('parses a Safari-style export with a valueless FOLDED attribute', () => {
  const html = `
    <!DOCTYPE NETSCAPE-Bookmark-file-1>
    <!-- This is an automatically generated file.
         It will be read and overwritten.
         Do Not Edit! -->
    <META http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <Title>Bookmarks</Title>
    <H1>Bookmarks</H1>
    <DL><p>
        <DT><H3 FOLDED>Favorites</H3>
        <DL><p>
            <DT><A HREF="https://example.com/six">Site Six</A>
        </DL><p>
        <DT><H3 FOLDED>com.apple.ReadingList</H3>
        <DL><p>
        </DL><p>
    </DL><p>
  `;
  const bookmarks = parseBookmarksHtml(html);
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0].url, 'https://example.com/six');
  assert.equal(bookmarks[0].folder, 'Favorites');
});
