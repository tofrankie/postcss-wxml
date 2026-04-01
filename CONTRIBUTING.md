# 贡献指南 📢

专注于微信小程序 WXML 环境的 PostCSS 自定义语法引擎（Custom Syntax）。

以下是为贡献者准备的开发与理解指引。

## 本地开发与测试指南

1. **环境准备与依赖安装**

```bash
$ pnpm install
```

2. **运行测试**

请在提交 PR 之前，确保通过了所有的测试（包括单元测试与快照回归等）。

```bash
$ pnpm test
```

3. **测试快照更新**

如果你的代码行为改变了现有的解析抽象树或输出结构且属于合理修正预期，请记得更新相关的 fixture 快照，避免测试报错：

```bash
$ npx vitest -u
```

## 核心适配情况与边界用例

WXML 属于类 HTML 标记语言，但它混杂了小程序的诸多特殊插值语法。在参与功能迭代或缺陷修复开发时，请务必保证对引擎代码的修改能够妥善解析并回写以下各种边界与复杂嵌套情况。

以下列举了目前必须支持的最核心且易触发解析崩溃的实际用例。无论何时增减功能，都请确保如下语法能被安全处理：

### 1. 基础内联 CSS 与空样式

系统能对标准 `style` 属性顺畅处理；若是空置的或是只有空格，则应做安全跳过处理。

```wxml
<text style=""></text>
<text style="font-size: 10rpx; color: red;"></text>
```

### 2. 插值语法支持

微信小程序允许在任何内联属性的数值、声明部位甚至独立占位处使用 `{{ }}` 绑定数据。这有可能会让 PostCSS 抛出语法错误（`Unknown Word` 等）。我们使用了内部的屏蔽（占位符）和抽取技巧实现了兼容。请务必确保以下全形态不抛错且能原样保存：

#### 三元表达式

```wxml
<!-- 整体跳过 -->
<view style="{{ flag ? 'background: #fff' : 'background: #000' }}"></view>
<view style='{{ flag ? "background: #fff" : "background: #000" }}'></view>

<!-- 解析到 -->
<view style="{{ flag ? 'background: #fff' : 'background: #000' }}; width: {{ flag ? 100 : 200 }}rpx; color: yellow"></view>
<view style='{{ flag ? "background: #fff" : "background: #000" }}; width: {{ flag ? 100 : 200 }}rpx; color: yellow'></view>
```

#### 空插值、整段占位、值内与「声明槽」插值

```wxml
<!-- 纯粹的空插值、占位插值、整段 style 仅由插值构成，应直接忽略处理 -->
<view style="{{ }}"></view>
<view style="{{ style }}"></view>
<!-- 空体 / 仅空白 mustache 应剥离或跳过，不破坏前后声明 -->
<view style="pointer-events: none;{{ }};width:10px"></view>

<!-- 属性值中的局部插值；`url('...')` 内插值须保留 -->
<view style="font-size: 10rpx; color: {{ color }}; background-image: url('{{ backgroundColor }}');"></view>

<!-- 整条声明槽上的 mustache（`; {{ x }};`）、与其它声明混排 -->
<view style="font-size: 10rpx; {{ fontWeight }}; background-image: url('{{ backgroundColor }}');{{ borderWidth }}; display: flex; {{a}}; align-items: center"></view>

<!-- 分号后紧贴 mustache、无空格等紧凑写法 -->
<view style="display:inline;{{ n.attrs.style }}"></view>

<!-- `}}` 与下一属性名粘连（无分号）时不要擅自插入 `;` 破坏原意 -->
<view style="color:red;{{ slot }}width:1px"></view>
```

### 3. 屏蔽 `<wxs>` 标签内容

`wxs` 标签用于编写 JavaScript，中间的代码无论是否看起来像 html 还是 style，都不要误解析其中的符号（如字符串里出现的 `/>` 打断标签闭合或 `</wxs>` 伪词）；同时 WXS 本身还可以像组件一样自闭合。引擎应以强韧的手法将内含环境视作隔离黑盒而绕过：

```wxml
<!-- 自闭合格式 -->
<wxs src="foo.wxs" />

<!-- 块级脚本代码，切勿误把部分文本解析为 WXML -->
<wxs module="bar">
  var x = 1
  module.exports = { x: x }
</wxs>
```

---

如果你在日常使用中发现了新的 WXML 边缘错误（或与 PostCSS 集成出现的未处理的格式情况），请为它单独补充相关的重现测试项（按类别分别归入 `tests/mustache.test.ts`、`tests/wxs.test.ts` 或 `tests/parse-basic.test.ts` 中），进行修复并创建 Pull Request。

期待您的贡献！
