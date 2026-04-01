import { describe, expect, it } from 'vitest'
import syntax from '../src'
import { parse } from '../src/parse'

describe('stringify', () => {
  it('stringify 写回 WXML，而非虚拟 CSS 规则', () => {
    const input = `<view>
  <text style="font-size: 10rpx; color: #ff0000"></text>
  <view style="font-size: 10rpx; color: {{ color }}"></view>
  <view style="{{ style }}"></view>
</view>`
    const doc = parse(input)
    const output = doc.toString(syntax)

    expect(output).toContain('<view>')
    expect(output).toContain('style="font-size: 10rpx; color: #ff0000"')
    expect(output).toContain('style="font-size: 10rpx; color: {{ color }}"')
    expect(output).toContain('style="{{ style }}"')
    expect(output).not.toContain('.wxml-inline-style-')
  })

  it('保留形似内部占位的字面文本', () => {
    const input = '<view style="content: _W1________; color: {{ color }};"></view>'
    const doc = parse(input)
    const output = doc.toString(syntax)

    expect(output).toContain('content: _W1________;')
    expect(output).toContain('color: {{ color }}')
  })

  it('移除 document 子节点后 stringify 不误套样式', () => {
    const input = '<view style="color: red;"></view><view style="font-size: 10px;"></view>'
    const doc = parse(input)
    doc.removeChild(doc.first!)
    const output = doc.toString(syntax)

    expect(output).toContain('<view style="color: red;"></view>')
    expect(output).toContain('<view style="font-size: 10px"></view>')
  })
})
