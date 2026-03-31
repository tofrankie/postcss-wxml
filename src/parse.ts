import type { Document, ProcessOptions, Root } from 'postcss'
import type { WxmlDocumentMeta } from './types'
import postcss from 'postcss'
import { extractWxmlStyles } from './extract-wxml-styles'
import { isWholeMustache, processMustacheStyle, restoreMustacheValue } from './mustache'

type ParseOptions = Pick<ProcessOptions, 'document' | 'from' | 'map'>

interface RootRawsWithId {
  postcssWxmlRootId?: number
}

function restoreMustacheInRootValues(
  root: Root,
  tokens: ReturnType<typeof processMustacheStyle>['tokens']
): void {
  if (tokens.length === 0) return

  root.walkDecls(decl => {
    decl.value = restoreMustacheValue(decl.value, tokens)
  })
}

export function parse(css: string | { toString: () => string }, opts: ParseOptions = {}): Document {
  const source = typeof css === 'string' ? css : css.toString()
  const input = new postcss.Input(source, { from: opts.from })
  const endOffset = input.css.length
  const endPos = input.fromOffset(endOffset)

  const document = postcss.document()
  document.source = {
    input,
    start: { offset: 0, line: 1, column: 1 },
    end: {
      offset: endOffset,
      line: endPos?.line ?? 1,
      column: endPos?.col ?? 1,
    },
  }

  const meta: WxmlDocumentMeta = { source, entries: [] }
  const inlineStyles = extractWxmlStyles(source)
  let nextRootId = 1

  inlineStyles.forEach(style => {
    if (!style.value.trim()) return
    if (isWholeMustache(style.value)) return

    const normalized = processMustacheStyle(style.value)
    const fragmentRoot = postcss.parse(normalized.cssText, { from: opts.from })
    const rootId = nextRootId
    nextRootId += 1
    ;(fragmentRoot.raws as RootRawsWithId).postcssWxmlRootId = rootId
    restoreMustacheInRootValues(fragmentRoot, normalized.tokens)
    document.append(fragmentRoot)
    meta.entries.push({
      rootId,
      startOffset: style.start.offset,
      endOffset: style.end.offset,
      originalValue: style.value,
    })
  })
  ;(document.raws as unknown as { postcssWxml: WxmlDocumentMeta }).postcssWxml = meta

  return document
}
