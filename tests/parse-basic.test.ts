import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse'

describe('parse (basic)', () => {
  it('无内联 style 时返回带 source 的 document（与 postcss-html 类似）', () => {
    const wxml = '<view></view>'
    const doc = parse(wxml)
    expect(doc.type).toBe('document')
    expect(doc.nodes.length).toBe(0)
    expect(doc.source?.start).toEqual({ offset: 0, line: 1, column: 1 })
    expect(doc.source?.end).toEqual({ offset: 13, line: 1, column: 14 })
  })

  it('纯内联 style 解析为 fragment root，含 decl 且源码位置正确', () => {
    const wxml = `<view style="
      font-size: 10rpx;
      color: #000;
    "></view>`
    const doc = parse(wxml)
    expect(doc.type).toBe('document')
    expect(doc.nodes.length).toBe(1)
    const fragment = doc.first
    expect(fragment?.type).toBe('root')
    if (!fragment || fragment.type !== 'root') return
    expect(fragment.nodes?.length).toBe(2)
    const decl1 = fragment.nodes?.[0]
    expect(decl1?.type).toBe('decl')
    expect(decl1?.source?.start?.line).toBe(2)
    expect(decl1?.source?.start?.column).toBe(7)

    const decl2 = fragment.nodes?.[1]
    expect(decl2?.type).toBe('decl')
    expect(decl2?.source?.start?.line).toBe(3)
    expect(decl2?.source?.start?.column).toBe(7)
  })

  it('跳过 style="" 与仅空白的内容', () => {
    expect(parse('<view style=""></view>').nodes.length).toBe(0)
    expect(parse('<view style="   "></view>').nodes.length).toBe(0)
  })

  it('多个 style 属性对应多个 fragment root', () => {
    const doc = parse('<view style="font-size: 10rpx;"></view><text style="color: {{ color }};"></text>')
    expect(doc.nodes.length).toBe(2)
  })

  it('HTML 注释内类 style 文本忽略', () => {
    const wxml = `<!-- <view style="color: blue;"></view> -->
<view>
  <text style="color: red;"></text>
</view>`
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(1)
    const css = doc.toString()
    expect(css).toContain('color: red')
    expect(css).not.toContain('color: blue')
  })
})
