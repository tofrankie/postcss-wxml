import type { Comment, Declaration, Document, Root } from 'postcss'
import type { WxmlDocumentMeta } from './types'
import postcss from 'postcss'

type StringifyNode = Parameters<typeof postcss.stringify>[0]
type StringifyBuilder = Parameters<typeof postcss.stringify>[1]
type RootWithId = Root & { raws: { postcssWxmlRootId?: number } }

export function stringify(node: StringifyNode, builder: StringifyBuilder): void {
  if ((node as { type: string }).type === 'document') {
    const document = node as Document
    const meta = (document.raws as unknown as { postcssWxml?: WxmlDocumentMeta }).postcssWxml
    if (meta?.source && Array.isArray(meta.entries)) {
      builder(stringifyWxmlFromDocument(document, meta), document)
      return
    }
  }

  postcss.stringify(node, builder)
}

function stringifyWxmlFromDocument(document: Document, meta: WxmlDocumentMeta): string {
  const { source, entries } = meta
  const rootsById = new Map<number, Root>()
  document.nodes.forEach(node => {
    if (node.type !== 'root') return
    const rootId = (node as RootWithId).raws?.postcssWxmlRootId
    if (typeof rootId === 'number') rootsById.set(rootId, node as Root)
  })

  let result = ''
  let cursor = 0

  entries.forEach(entry => {
    const fragmentRoot = rootsById.get(entry.rootId)
    const replacement = fragmentRoot ? serializeRootToStyleValue(fragmentRoot) : entry.originalValue

    result += source.slice(cursor, entry.startOffset)
    result += replacement
    cursor = entry.endOffset
  })

  result += source.slice(cursor)
  return result
}

function serializeRootToStyleValue(root: Root): string {
  const parts: string[] = []
  for (const node of root.nodes ?? []) {
    if (node.type === 'decl') {
      const decl = node as Declaration
      const raw = (decl.raws as { textRaw?: string }).textRaw
      if (typeof raw === 'string') parts.push(raw)
      else parts.push(`${decl.prop}: ${decl.value}`)
    } else if (node.type === 'comment') {
      const comment = node as Comment
      const raw = (comment.raws as { textRaw?: string }).textRaw
      if (typeof raw === 'string') parts.push(raw)
      else parts.push(`/*${comment.text}*/`)
    }
  }
  return parts.join('; ').trim()
}
