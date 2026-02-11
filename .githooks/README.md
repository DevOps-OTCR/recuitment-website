# Git hooks

## Remove Co-authored-by: Cursor trailer

The `prepare-commit-msg` hook strips any `Co-authored-by: Cursor` line from commit messages so it does not appear in history.

**Enable for this repo (run from repo root):**

```bash
git config core.hooksPath .githooks
chmod +x .githooks/prepare-commit-msg
```

After this, every commit (including those made by Cursor) will have the Cursor co-author trailer removed automatically.
