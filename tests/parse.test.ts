import { describe, expect, it } from 'vitest'
import syntax from '../src'
import { parse } from '../src/parse'

describe('parse', () => {
  it('returns a document with source when there are no inline styles (like postcss-html)', () => {
    const wxml = '<view></view>'
    const doc = parse(wxml)
    expect(doc.type).toBe('document')
    expect(doc.nodes.length).toBe(0)
    expect(doc.source?.start).toEqual({ offset: 0, line: 1, column: 1 })
    expect(doc.source?.end).toEqual({ offset: 13, line: 1, column: 14 })
  })

  it('parses plain inline style as a fragment root with decls', () => {
    const doc = parse('<view style="font-size: 10rpx; color: #000;"></view>')
    expect(doc.type).toBe('document')
    expect(doc.nodes.length).toBe(1)
    const fragment = doc.first
    expect(fragment?.type).toBe('root')
    if (!fragment || fragment.type !== 'root') return
    expect(fragment.nodes?.length).toBe(2)
    expect(fragment.nodes?.[0]?.type).toBe('decl')
    expect(fragment.nodes?.[1]?.type).toBe('decl')
  })

  it('parses declaration value with mustache', () => {
    const doc = parse('<view style="font-size: 10rpx; color: {{ color }};"></view>')
    const css = doc.toString()
    expect(css).toContain('color: {{ color }}')
  })

  it('parses declaration value containing partial mustache', () => {
    const doc = parse('<view style="background-image: url(\'{{ bg }}\');"></view>')
    const css = doc.toString()
    expect(css).toContain("background-image: url('{{ bg }}')")
  })

  it('skips whole-style-only mustache (no fragment, like empty style)', () => {
    const doc = parse('<view style="{{ style }}"></view>')
    expect(doc.nodes.length).toBe(0)
    expect(doc.toString()).toBe('')
  })

  it('skips empty style="" and whitespace-only value', () => {
    expect(parse('<view style=""></view>').nodes.length).toBe(0)
    expect(parse('<view style="   "></view>').nodes.length).toBe(0)
  })

  it('skips compact whole mustache style="{{foo}}"', () => {
    const doc = parse('<view style="{{foo}}"></view>')
    expect(doc.nodes.length).toBe(0)
    expect(doc.toString()).toBe('')
  })

  it('parses multiple style attributes into multiple fragment roots', () => {
    const doc = parse(
      '<view style="font-size: 10rpx;"></view><text style="color: {{ color }};"></text>'
    )
    expect(doc.nodes.length).toBe(2)
  })

  it('masks wxs blocks so style-like substrings in JS are not parsed as template styles', () => {
    const wxml = `<wxs module="m">
  var style = "color: red;"
</wxs>
<view style="font-size: 10rpx;"></view>`
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(1)
    expect(doc.first?.type).toBe('root')
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
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(2)
  })

  it('ignores style-like text inside HTML comments', () => {
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

  it('stringify writes back WXML instead of virtual CSS rules', () => {
    const input = `<view>
  <text style="font-size: 10rpx; color: #ff0000"></text>
  <view style="font-size: 10rpx; color: {{ color }}"></view>
  <view style="{{ style }}"></view>
</view>`
    const doc = parse(input)
    const output = doc.toString(syntax)

    expect(output).toContain('<view>')
    expect(output).toContain('style="font-size: 10rpx; color: #ff0000;"')
    expect(output).toContain('style="font-size: 10rpx; color: {{ color }};"')
    expect(output).toContain('style="{{ style }}"')
    expect(output).not.toContain('.wxml-inline-style-')
  })

  it('keeps literal text that looks like internal placeholder', () => {
    const input = '<view style="content: __WXML_EXPR_1__; color: {{ color }};"></view>'
    const doc = parse(input)
    const output = doc.toString(syntax)

    expect(output).toContain('content: __WXML_EXPR_1__;')
    expect(output).toContain('color: {{ color }};')
  })

  it('stringify does not mis-apply styles after document node removal', () => {
    const input = '<view style="color: red;"></view><view style="font-size: 10px;"></view>'
    const doc = parse(input)
    doc.removeChild(doc.first!)
    const output = doc.toString(syntax)

    expect(output).toContain('<view style="color: red;"></view>')
    expect(output).toContain('<view style="font-size: 10px;"></view>')
  })
})
