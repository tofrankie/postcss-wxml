# Changelog

## postcss-wxml@0.0.4 (2026-04-02)

- fix: support collapsing newlines in declaration values when stringifying.

## postcss-wxml@0.0.3 (2026-04-01)

- fix: support interpolating ternary operator
- test: add more test cases

## postcss-wxml@0.0.2 (2026-04-01)

- **core**: parse style attribute with mustache interpolation.
- **core**: resolve `no-empty-source` rule error when there are no valid styles (`TypeError: Cannot read properties of undefined (reading 'column')`) (bc4a618).
- **parse**: implement precise AST source mapping (line, column, offset) mapping back to the true origin coords in `.wxml` source files.
- **tokenizer**: set `recognizeSelfClosing: true` on the htmlparser2 `Parser` so `<wxs ... />` closes correctly and does not leave special-tag mode open until `</wxs>` (which previously truncated or swallowed following markup).
- **mustache**: guarantee 100% deterministic layout offsets by removing `Math.random()` tokens in favor of exact-length padding proxies, avoiding random snapshot/linter drifts.
- **stringify**: preserve native formatting (spaces/newlines) seamlessly by dropping forced semicolon appending in serialization.

## postcss-wxml@0.0.1 (2026-04-01)

- Initial release.
