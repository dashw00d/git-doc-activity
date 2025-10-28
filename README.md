# Git Doc Activity

A VS Code extension that provides a sidebar view of git commit history and branch activity specifically for Markdown documentation files.

## Features

- **Commits View**: See all recent commits that touched Markdown files, sorted newest to oldest
- **Branches View**: See all branches with their Markdown file changes compared to the base branch
- **File Tracking**: See which files were added, modified, deleted, or renamed in each commit
- **Quick Access**: Click any file to open it in the editor
- **Commit Viewing**: View full commit diffs

## How It Works

The extension scans your git history for commits that touched `.md` files and presents them in a hierarchical tree view:

```
Git Doc Activity
├── Commits
│   ├── Oct 28, 2025 — 76baab2 — "Add MMKV offline cache notes"
│   │   ├── A docs/registry/kit-manifest.md
│   │   └── M docs/runtime/offline-storage.md
│   └── Oct 28, 2025 — f04ad18 — "Register kit capabilities"
│       └── M docs/panels/tenant-panel-limits.md
└── Branches
    ├── feature/offline-mmkv
    │   └── Oct 28, 2025 — 76baab2 — "Add MMKV offline cache notes"
    │       ├── A docs/registry/kit-manifest.md
    │       └── M docs/runtime/offline-storage.md
    └── feature/panel-limits-ui
        └── Oct 28, 2025 — f04ad18 — "Register kit capabilities"
            └── M docs/panels/tenant-panel-limits.md
```

## Installation

1. Clone or download this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` to run the extension in a new Extension Development Host window

Or package it:
```bash
npm install
npm run package
```

Then install the resulting `.vsix` file.

## Commands

- `Git Doc Activity: Refresh` - Refresh the view with latest git data

## Development

```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
npm run package      # Package the extension
```

## License

MIT
