# Changelog

## postcss-wxml@0.0.2 (2026-04-01)

- **core**: parse style attribute with mustache interpolation.
- **core**: resolve `no-empty-source` rule error when there are no valid styles (`TypeError: Cannot read properties of undefined (reading 'column')`) (bc4a618).
- **parse**: implement precise AST source mapping (line, column, offset) mapping back to the true origin coords in `.wxml` source files.
- **tokenizer**: fix document truncation/bleeding on self-closing `<wxs />` or exotic comment boundaries by enabling `recognizeSelfClosing: true`.
- **mustache**: guarantee 100% deterministic layout offsets by removing `Math.random()` tokens in favor of exact-length padding proxies, avoiding random snapshot/linter drifts.
- **stringify**: preserve native formatting (spaces/newlines) seamlessly by dropping forced semicolon appending in serialization.

## postcss-wxml@0.0.1 (2026-04-01)

- Initial release.
