import type { Document, ProcessOptions, Root } from 'postcss'
import type { Position, WxmlDocumentMeta } from './types'
import postcss from 'postcss'
import { extractWxmlStyles } from './extract-wxml-styles'
import { isWholeMustache, processMustacheStyle, restoreMustacheValue, stripEmptyMustaches } from './mustache'

type ParseOptions = Pick<ProcessOptions, 'document' | 'from' | 'map'>

interface RootRawsWithId {
  postcssWxmlRootId?: number
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

    const { stripped: styleForParse, strippedOffsetToOriginal } = stripEmptyMustaches(style.value)
    if (!styleForParse.trim()) return
    if (isWholeMustache(styleForParse)) return

    const normalized = processMustacheStyle(styleForParse)
    const fragmentRoot = postcss.parse(normalized.cssText, { from: opts.from })
    const rootId = nextRootId
    nextRootId += 1
    ;(fragmentRoot.raws as RootRawsWithId).postcssWxmlRootId = rootId
    restoreMustacheInRootValues(fragmentRoot, normalized.tokens)

    // 重映射源码位置
    offsetNodeSource(fragmentRoot, style.start, input, strippedOffsetToOriginal)
    fragmentRoot.walk(node => {
      offsetNodeSource(node, style.start, input, strippedOffsetToOriginal)
    })

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

function restoreMustacheInRootValues(root: Root, tokens: ReturnType<typeof processMustacheStyle>['tokens']): void {
  if (tokens.length === 0) return

  root.walkComments(comment => {
    const placeholder = `/*${comment.text}*/`
    const token = tokens.find(t => t.placeholder === placeholder)
    if (token) {
      ;(comment.raws as { textRaw?: string }).textRaw = token.raw
    }
  })

  root.walkDecls(decl => {
    const combined = `${decl.prop}:${decl.value}`
    const declSlot = tokens.find(t => t.placeholder === combined && !t.placeholder.startsWith('/*'))
    if (declSlot) {
      ;(decl.raws as { textRaw?: string }).textRaw = declSlot.raw
      return
    }
    decl.prop = restoreMustacheValue(decl.prop, tokens)
    decl.value = restoreMustacheValue(decl.value, tokens)
  })
}

function offsetNodeSource(
  node: postcss.AnyNode | Root,
  styleStart: Position,
  docInput: postcss.Input,
  strippedOffsetToOriginal?: (strippedOffset: number) => number
): void {
  const mapPos = (pos?: { offset?: number; line?: number; column?: number }) => {
    if (!pos || typeof pos.offset !== 'number') return
    let origInValue = pos.offset
    if (strippedOffsetToOriginal) {
      origInValue = strippedOffsetToOriginal(origInValue)
    }
    const absOffset = styleStart.offset + origInValue
    const mapped = docInput.fromOffset(absOffset)
    if (mapped) {
      pos.line = mapped.line
      pos.column = mapped.col
      pos.offset = absOffset
    }
  }

  if (node.source) {
    node.source.input = docInput
    mapPos(node.source.start)
    mapPos(node.source.end)
  }
}
