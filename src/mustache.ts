import type { MustacheProcessResult, MustacheToken } from './types'

const MUSTACHE_RE = /\{\{[\s\S]*?\}\}/g
const INLINE_STYLE_PROP = '__wxml_inline_style__'

function isWholeMustache(input: string): boolean {
  const trimmed = input.trim()
  return /^\{\{[\s\S]*\}\}$/u.test(trimmed)
}

function ensureSemicolon(cssText: string): string {
  const trimmedRight = cssText.trimEnd()
  if (trimmedRight.length === 0) return trimmedRight
  if (trimmedRight.endsWith(';')) return trimmedRight
  return `${trimmedRight};`
}

export function processMustacheStyle(styleValue: string): MustacheProcessResult {
  let tokenId = 0
  const tokens: MustacheToken[] = []

  const replaced = styleValue.replace(MUSTACHE_RE, raw => {
    tokenId += 1
    const placeholder = `__WXML_EXPR_${tokenId}__`
    tokens.push({ id: tokenId, raw, placeholder })
    return placeholder
  })

  if (isWholeMustache(styleValue)) {
    const placeholder = tokens[0]?.placeholder ?? '__WXML_EXPR_0__'
    return {
      cssText: `${INLINE_STYLE_PROP}: ${placeholder};`,
      tokens,
    }
  }

  return {
    cssText: ensureSemicolon(replaced.trim()),
    tokens,
  }
}

export function restoreMustacheValue(value: string, tokens: MustacheToken[]): string {
  if (tokens.length === 0) return value

  let restored = value
  for (const token of tokens) {
    restored = restored.split(token.placeholder).join(token.raw)
  }
  return restored
}
