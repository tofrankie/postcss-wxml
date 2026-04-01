import type { AnyNode } from 'postcss'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse'

function serializeNode(node: AnyNode) {
  const base: any = { type: node.type }

  if (node.type === 'rule') {
    base.selector = node.selector
  }
  if (node.type === 'decl') {
    base.prop = node.prop
    base.value = node.value
  }
  if (node.type === 'atrule') {
    base.name = node.name
    base.params = node.params
  }
  if (node.source?.start) {
    base.source = {
      start: {
        line: node.source.start.line,
        column: node.source.start.column,
        offset: node.source.start.offset,
      },
      end: node.source.end
        ? {
            line: node.source.end.line,
            column: node.source.end.column,
            offset: node.source.end.offset,
          }
        : undefined,
    }
  }
  if ('nodes' in node && Array.isArray(node.nodes) && node.nodes.length > 0) {
    base.nodes = node.nodes.map(serializeNode)
  }

  return base
}

describe('fixtures 快照', () => {
  const fixturesDir = path.join(__dirname, 'fixtures')
  const files = fs.readdirSync(fixturesDir).filter((file: string) => file.endsWith('.wxml'))

  for (const file of files) {
    it(`解析 ${file} 并与快照一致`, () => {
      const wxml = fs.readFileSync(path.join(fixturesDir, file), 'utf-8')
      const doc = parse(wxml, { from: file })

      const serialized = serializeNode(doc)
      expect(serialized).toMatchSnapshot()
    })
  }
})
