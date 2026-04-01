import { describe, expect, it } from 'vitest'
import { extractWxmlStyles } from '../src/extract-wxml-styles'
import { parse } from '../src/parse'

describe('wxs 提取', () => {
  it('自闭合 wxs', () => {
    const wxml = '<wxs src="m1.wxs" /><view style="color: red;"></view>'
    const styles = extractWxmlStyles(wxml)
    expect(styles.length).toBe(1)
    expect(styles[0].value).toBe('color: red;')
  })

  it('wxs 内含 "/>" 或 "</wxs " 等干扰内容时仍正确', () => {
    const wxml = `<wxs module="m">
      var a = "/>";
      var b = "</wxs ";
      var xml = "<view style='color: evil;'></view>";
    </wxs><view style="color: blue;"></view>`
    const styles = extractWxmlStyles(wxml)
    expect(styles.length).toBe(1)
    expect(styles[0].value).toBe('color: blue;')
  })

  it('双引号定界 style：mustache 内用单引号字符串（与外层互斥）', () => {
    const wxml = `<view class="container" style="{{ flag ? 'background: #fff' : 'background: #000' }}"></view>`
    const styles = extractWxmlStyles(wxml)
    expect(styles.length).toBe(1)
    expect(styles[0].value).toBe("{{ flag ? 'background: #fff' : 'background: #000' }}")
  })

  it('单引号定界 style：mustache 内用双引号字符串（与外层互斥）', () => {
    const wxml = `<view class="container" style='{{ flag ? "background: #fff" : "background: #000" }}'></view>`
    const styles = extractWxmlStyles(wxml)
    expect(styles.length).toBe(1)
    expect(styles[0].value).toBe('{{ flag ? "background: #fff" : "background: #000" }}')
  })
})

describe('parse (wxs)', () => {
  it('wxs 块内 JS 中类样式子串不会被当成模板 style 解析', () => {
    const wxml = `<wxs module="m">
  var style = "color: red;"
</wxs>
<view style="font-size: 10rpx;"></view>`
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(1)
    expect(doc.first?.type).toBe('root')
  })

  it('wxs 之后的 style 可解析', () => {
    const wxml = `<wxs module="m">
  var x = 1
  module.exports = { x: x }
</wxs>
<view>
  <text style="font-size: 10rpx; color: red;"></text>
  <view style="font-size: 10rpx; color: {{ color }}; background-image: url('{{ backgroundColor }}');"></view>
  <view style="{{ style }}"></view>
</view>`
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(2)
  })
})
