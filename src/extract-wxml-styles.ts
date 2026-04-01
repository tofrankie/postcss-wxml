import type { Position, WxmlInlineStyle } from './types'
import { Parser } from 'htmlparser2'
import { WxmlTokenizer } from './wxml-tokenizer'

export function extractWxmlStyles(source: string): WxmlInlineStyle[] {
  const styles: WxmlInlineStyle[] = []
  let currentTagName = 'view'

  const parser = new Parser(
    {
      onopentagname(name) {
        currentTagName = name
      },
      onattribute(name, value, quote) {
        if (name !== 'style') return

        const endIndex = parser.endIndex
        if (endIndex < 0) return

        let valueStartOffset: number
        let valueEndOffset: number

        if (quote === '"' || quote === "'") {
          // 带引号属性：htmlparser2 的 endIndex 在结束引号之后一位。
          valueStartOffset = endIndex - value.length - 1
          valueEndOffset = endIndex - 1
        } else {
          // 无引号属性：endIndex 已在属性值区段末尾。
          valueStartOffset = endIndex - value.length
          valueEndOffset = endIndex
        }

        styles.push({
          tagName: currentTagName,
          quote: quote === "'" ? "'" : '"',
          value,
          start: toPosition(source, valueStartOffset),
          end: toPosition(source, valueEndOffset),
        })
      },
    },
    {
      decodeEntities: false,
      recognizeSelfClosing: true,
      Tokenizer: WxmlTokenizer as any,
    }
  )

  parser.parseComplete(source)

  return styles
}

function toPosition(source: string, offset: number): Position {
  let line = 1
  let column = 1

  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '\n') {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }

  return { offset, line, column }
}
