export interface Position {
  offset: number
  line: number
  column: number
}

export interface WxmlInlineStyle {
  tagName: string
  quote: '"' | "'"
  value: string
  start: Position
  end: Position
}

export interface MustacheToken {
  id: number
  raw: string
  placeholder: string
}

export interface MustacheProcessResult {
  cssText: string
  tokens: MustacheToken[]
}

export interface WxmlStyleMappingEntry {
  rootId: number
  startOffset: number
  endOffset: number
  originalValue: string
}

export interface WxmlDocumentMeta {
  source: string
  entries: WxmlStyleMappingEntry[]
}
