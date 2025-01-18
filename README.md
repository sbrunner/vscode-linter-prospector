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
