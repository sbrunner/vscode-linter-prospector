# Linter for Prospector

[Linter](https://marketplace.visualstudio.com/items?itemName=fnando.linter) extension for Prospector, a Python static analysis tool.

To make the fix working for Ruff, you need to have a file named `.prospector-fix.yaml` with:

```yaml
inherits:
  - .prospector.yaml

ruff:
  options:
    fix: true
    unsafe-fixes: true
```

Or edit the vscode configuration.

Recommended Prospector version is `1.14.0` or higher.

Support functionality:
- Display the linting result in the editor.
- Fix the Ruff linting issues with a specific prospector profile.
- Ignore the issues from the editor.

