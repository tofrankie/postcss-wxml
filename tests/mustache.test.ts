import { describe, expect, it } from 'vitest'
import syntax from '../src'
import { parse } from '../src/parse'

describe('parse (mustache)', () => {
  it('声明值中含 mustache 可解析', () => {
    const doc = parse('<view style="font-size: 10rpx; color: {{ color }};"></view>')
    const css = doc.toString()
    expect(css).toContain('color: {{ color }}')
  })

  it('分号后的 mustache 使用边界占位，不出现 Unknown word', () => {
    const wxml = '<view style="display:inline;{{ n.attrs.style }}"></view>'
    expect(() => parse(wxml)).not.toThrow()
    const doc = parse(wxml)
    const out = doc.toString(syntax)
    expect(out).toContain('{{ n.attrs.style }}')
    expect(out).toMatch(/display:\s*inline/)
  })

  it('缺分号时不把 `}}width:` 改写成 `}};width:`', () => {
    const wxml = '<view style="color:red;{{ slot }}width:1px"></view>'
    const doc = parse(wxml)
    const out = doc.toString(syntax)
    expect(out).toContain('{{ slot }}width: 1px')
    expect(out).not.toContain('}}; width')
  })

  it('解析时忽略空体 mustache（{{ }} 内仅空白）', () => {
    const wxml = '<view style="opacity:1;{{  }};{{}};color:red"></view>'
    const doc = parse(wxml)
    const root = doc.first
    expect(root?.type).toBe('root')
    if (!root || root.type !== 'root') return
    expect(root.nodes?.length).toBe(2)
    expect(root.nodes?.every(n => n.type === 'decl')).toBe(true)
    const out = doc.toString(syntax)
    expect(out).toContain('opacity: 1')
    expect(out).toContain('color: red')
  })

  it('声明之间的整条 mustache 占位（如 {{ fontWeight }}）', () => {
    const wxml = `<view style="font-size: 10rpx; {{ fontWeight }}; background-image: url('{{ bg }}');"></view>`
    const doc = parse(wxml)
    const root = doc.first
    expect(root?.type).toBe('root')
    if (!root || root.type !== 'root') return
    expect(root.nodes?.length).toBe(3)
    expect(root.nodes?.[0]?.type).toBe('decl')
    expect(root.nodes?.[1]?.type).toBe('comment')
    expect(root.nodes?.[2]?.type).toBe('decl')
    const virtualCss = doc.toString()
    expect(virtualCss).not.toMatch(/:\s*\{\{/)
    const out = doc.toString(syntax)
    expect(out).toContain('{{ fontWeight }}')
    expect(out).toContain("url('{{ bg }}')")
  })

  it('头/中/尾 mustache 声明槽在分号分隔下均可解析', () => {
    const wxml = '<view style="{{ a }}; color:red; {{ b }}; font-size:10px; {{ c }}"></view>'
    const doc = parse(wxml)
    const root = doc.first
    expect(root?.type).toBe('root')
    if (!root || root.type !== 'root') return
    expect(root.nodes?.map(n => n.type)).toEqual(['comment', 'decl', 'comment', 'decl', 'comment'])
    const out = doc.toString(syntax)
    expect(out).toContain('{{ a }}')
    expect(out).toContain('{{ b }}')
    expect(out).toContain('{{ c }}')
    expect(out).toContain('color: red')
    expect(out).toContain('font-size: 10px')
  })

  it('声明值中含部分 mustache 可解析', () => {
    const doc = parse('<view style="background-image: url(\'{{ bg }}\');"></view>')
    const css = doc.toString()
    expect(css).toContain("background-image: url('{{ bg }}')")
  })

  it('整段 style 仅为 mustache 时跳过（无 fragment，等同空 style）', () => {
    const doc = parse('<view style="{{ style }}"></view>')
    expect(doc.nodes.length).toBe(0)
    expect(doc.toString()).toBe('')
  })

  it('紧凑整段 mustache：style="{{foo}}" 跳过', () => {
    const doc = parse('<view style="{{foo}}"></view>')
    expect(doc.nodes.length).toBe(0)
    expect(doc.toString()).toBe('')
  })

  it('整段 style 为三元 mustache（表达式内单引号 CSS 字面量）时跳过', () => {
    const wxml = `<view style="{{ flag ? 'background: #fff' : 'background: #000' }}"></view>`
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(0)
    expect(doc.toString()).toBe('')
  })

  it('三元 mustache 与声明、数值 mustache 混写可解析并还原', () => {
    const wxml = `<view style="{{ flag ? 'background: #fff' : 'background: #000' }}; width: {{ flag ? 100 : 200 }}rpx; color: yellow"></view>`
    expect(() => parse(wxml)).not.toThrow()
    const doc = parse(wxml)
    const root = doc.first
    expect(root?.type).toBe('root')
    if (!root || root.type !== 'root') return
    expect(root.nodes?.length).toBeGreaterThan(0)
    const out = doc.toString(syntax)
    expect(out).toContain("{{ flag ? 'background: #fff' : 'background: #000' }}")
    expect(out).toContain('{{ flag ? 100 : 200 }}')
    expect(out).toMatch(/color:\s*yellow/)
  })

  it('单引号定界且 mustache 内为双引号字符串：整段三元时跳过', () => {
    const wxml = `<view style='{{ flag ? "background: #fff" : "background: #000" }}'></view>`
    const doc = parse(wxml)
    expect(doc.nodes.length).toBe(0)
    expect(doc.toString()).toBe('')
  })

  it('单引号定界且 mustache 内为双引号：与声明、数值 mustache 混写可解析并还原', () => {
    const wxml = `<view style='{{ flag ? "background: #fff" : "background: #000" }}; width: {{ flag ? 100 : 200 }}rpx; color: yellow'></view>`
    expect(() => parse(wxml)).not.toThrow()
    const doc = parse(wxml)
    const root = doc.first
    expect(root?.type).toBe('root')
    if (!root || root.type !== 'root') return
    const out = doc.toString(syntax)
    expect(out).toContain('{{ flag ? "background: #fff" : "background: #000" }}')
    expect(out).toContain('{{ flag ? 100 : 200 }}')
    expect(out).toMatch(/color:\s*yellow/)
  })
})
