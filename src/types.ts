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
  selector: string
  startOffset: number
  endOffset: number
  originalValue: string
}

export interface WxmlRootMeta {
  source: string
  entries: WxmlStyleMappingEntry[]
}
