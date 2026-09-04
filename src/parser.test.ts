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
