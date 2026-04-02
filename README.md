# postcss-wxml

PostCSS syntax for parsing [WXML](https://developers.weixin.qq.com/miniprogram/en/dev/reference/wxml/).

> [!IMPORTANT]
> Before 1.0.0, releases may include breaking changes. Review [CHANGELOG](CHANGELOG.md) before upgrading.

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

## Acknowledgments

Thanks to [postcss-html](https://github.com/ota-meshi/postcss-html) for inspiration.
