# bookmark-dupes

Every browser lets you export your bookmarks as an HTML file, and after a
few years of syncing across devices, reinstalling browsers, and importing
old exports back into new profiles, that file ends up full of the same
page saved three or four times under slightly different titles and
folders. This is a small command-line tool that reads one of those export
files and tells you which URLs show up more than once, and where.

It does one thing. It doesn't edit your bookmarks, merge folders, or check
whether links are still alive - it just answers "which of these are
duplicates?"

## Getting a bookmarks export

- Chrome / Edge: bookmark manager -> the three-dot menu -> "Export
  bookmarks"
- Firefox: Library window -> Import and Backup -> "Export Bookmarks to
  HTML"
- Safari: File -> Export Bookmarks

All of these produce the same format (Netscape Bookmark File Format),
which is what this tool parses.

## Usage

```
npm install
npm run build
node dist/index.js bookmarks.html
```

Run the tests with `npm test` (uses Node's built-in test runner, no extra
dependencies).

Human-readable output:

```
https://example.com/some-article  (3 copies)
  - "Some Article" in Work/Reading
  - "Some Article (2)" in Personal
  - "some article - saved" in (root)

1 duplicate URL(s) found.
```

Machine-readable output, for piping into other tools:

```
node dist/index.js bookmarks.html --json
```

```json
{
  "totalBookmarks": 842,
  "duplicates": [
    {
      "url": "example.com/some-article",
      "count": 3,
      "entries": [
        { "title": "Some Article", "folder": "Work/Reading" },
        { "title": "Some Article (2)", "folder": "Personal" },
        { "title": "some article - saved", "folder": "(root)" }
      ]
    }
  ]
}
```

URLs are normalized before comparison (trailing slash and `#fragment`
removed) so the same page isn't missed just because it was saved from two
different tabs.

## Scoping the search to one folder

Large exports (years of Chrome syncing across machines) can turn up
duplicates you don't care about right now. `--folder` limits the search to
one folder and everything under it:

```
node dist/index.js bookmarks.html --folder Work/Reading
```

The match is on the full folder path from the root, so `--folder Work`
matches `Work` and `Work/Reading` but not `Personal/Work` or a sibling
folder like `Work2`. It can be combined with `--json`.

## Status

Early skeleton. The parser, `normalizeUrl`, and the CLI's argument parsing
and folder matching have unit test coverage, including deeply nested
folders, stray duplicate `<DL><p>` wrappers, and unmatched closing tags, so
it shouldn't crash or scramble folder paths on a slightly malformed export.
It still hasn't been run against a real export from each of the major
browsers - only against hand-written fixtures.
