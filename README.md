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

## Status

Early skeleton. The HTML parser assumes a well-formed export from a
mainstream browser and hasn't been run against real-world edge cases yet
(see below).
