import type { Root, Rule } from 'postcss'
import type { WxmlRootMeta } from './types'
import postcss from 'postcss'

type StringifyNode = Parameters<typeof postcss.stringify>[0]
type StringifyBuilder = Parameters<typeof postcss.stringify>[1]

function serializeRuleToStyleValue(rule: Rule): string {
  const decls = rule.nodes?.filter(node => node.type === 'decl') ?? []
  if (decls.length === 1) {
    const onlyDecl = decls[0] as any
    if (/^_+wxml_inline_style__$/.test(onlyDecl.prop)) {
      return onlyDecl.value
    }
  }

  return decls
    .map((declNode: any) => `${declNode.prop}: ${declNode.value};`)
    .join(' ')
    .trim()
}

function stringifyWxmlFromRoot(root: Root, meta: WxmlRootMeta): string {
  const { source, entries } = meta
  let result = ''
  let cursor = 0

  for (const entry of entries) {
    const rule = root.nodes.find(
      node => node.type === 'rule' && (node as Rule).selector === entry.selector
    ) as Rule | undefined
    const replacement = rule ? serializeRuleToStyleValue(rule) : entry.originalValue

    result += source.slice(cursor, entry.startOffset)
    result += replacement
    cursor = entry.endOffset
  }

  result += source.slice(cursor)
  return result
}

export function stringify(node: StringifyNode, builder: StringifyBuilder): void {
  if ((node as any).type === 'root') {
    const root = node as Root
    const meta = (root.raws as any).postcssWxml as WxmlRootMeta | undefined
    if (meta?.source && Array.isArray(meta.entries)) {
      builder(stringifyWxmlFromRoot(root, meta), root)
      return
    }
  }

  postcss.stringify(node, builder)
}
