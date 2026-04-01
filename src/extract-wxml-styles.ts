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
          // htmlparser2 endIndex for quoted attributes points one char after the closing quote.
          valueStartOffset = endIndex - value.length - 1
          valueEndOffset = endIndex - 1
        } else {
          // For unquoted attributes, endIndex already points at the end of attribute value section.
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
