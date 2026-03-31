# postcss-wxml

PostCSS syntax for parsing [WXML](https://developers.weixin.qq.com/miniprogram/en/dev/reference/wxml/).

> [!WARNING]
> Before 1.0.0, releases may include breaking changes. Review [CHANGELOG](CHANGELOG.md) before upgrading.

> [!NOTE]
> If [postcss-html#156](https://github.com/ota-meshi/postcss-html/pull/156) is merged, you can use `postcss-html` directly as a [customSyntax](https://stylelint.io/user-guide/options#customsyntax) to parse WXML.

## Usage

```bash
$ pnpm add -D stylelint @tofrankie/postcss-wxml
```

```js
// stylelint.config.js
export default {
  customSyntax: '@tofrankie/postcss-wxml',
  rules: {},
}
```
