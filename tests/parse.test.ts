import { describe, expect, it } from 'vitest'
import syntax from '../src'
import { parse } from '../src/parse'

describe('parse', () => {
  it('parses plain inline style', () => {
    const root = parse('<view style="font-size: 10rpx; color: #000;"></view>')
    const rule = root.first
    expect(rule?.type).toBe('rule')
    if (!rule || rule.type !== 'rule') return
    expect(rule.nodes?.length).toBe(2)
    expect(rule.nodes?.[0]?.type).toBe('decl')
    expect(rule.nodes?.[1]?.type).toBe('decl')
  })

  it('parses declaration value with mustache', () => {
    const root = parse('<view style="font-size: 10rpx; color: {{ color }};"></view>')
    const css = root.toString()
    expect(css).toContain('color: {{ color }}')
  })

  it('parses declaration value containing partial mustache', () => {
    const root = parse('<view style="background-image: url(\'{{ bg }}\');"></view>')
    const css = root.toString()
    expect(css).toContain("background-image: url('{{ bg }}')")
  })

  it('converts whole-style mustache to pseudo declaration', () => {
    const root = parse('<view style="{{ style }}"></view>')
    const css = root.toString()
    expect(css).toContain('__wxml_inline_style__: {{ style }}')
  })

  it('parses multiple style attributes into multiple rules', () => {
    const root = parse(
      '<view style="font-size: 10rpx;"></view><text style="color: {{ color }};"></text>'
    )
    expect(root.nodes.length).toBe(2)
  })

  it('masks wxs blocks so style-like substrings in JS are not parsed as template styles', () => {
    const wxml = `<wxs module="m">
  var style = "color: red;"
</wxs>
<view style="font-size: 10rpx;"></view>`
    const root = parse(wxml)
    expect(root.nodes.length).toBe(1)
    expect(root.first?.type).toBe('rule')
  })

  it('parses styles after wxs block like temp-wxml sample', () => {
    const wxml = `<wxs module="m">
  var x = 1
  module.exports = { x: x }
</wxs>
<view>
  <text style="font-size: 10rpx; color: red;"></text>
  <view style="font-size: 10rpx; color: {{ color }}; background-image: url('{{ backgroundColor }}');"></view>
  <view style="{{ style }}"></view>
</view>`
    const root = parse(wxml)
    expect(root.nodes.length).toBe(3)
  })

  it('ignores style-like text inside HTML comments', () => {
    const wxml = `<!-- <view style="color: blue;"></view> -->
<view>
  <text style="color: red;"></text>
</view>`
    const root = parse(wxml)
    expect(root.nodes.length).toBe(1)
    const css = root.toString()
    expect(css).toContain('color: red')
    expect(css).not.toContain('color: blue')
  })

  it('stringify writes back WXML instead of virtual CSS rules', () => {
    const input = `<view>
  <text style="font-size: 10rpx; color: #ff0000"></text>
  <view style="font-size: 10rpx; color: {{ color }}"></view>
  <view style="{{ style }}"></view>
</view>`
    const root = parse(input)
    const output = root.toString(syntax)

    expect(output).toContain('<view>')
    expect(output).toContain('style="font-size: 10rpx; color: #ff0000;"')
    expect(output).toContain('style="font-size: 10rpx; color: {{ color }};"')
    expect(output).toContain('style="{{ style }}"')
    expect(output).not.toContain('.wxml-inline-style-')
  })
})
