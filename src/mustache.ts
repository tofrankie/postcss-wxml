import type { MustacheProcessResult, MustacheToken } from './types'

const MUSTACHE_RE = /\{\{[\s\S]*?\}\}/g
const PLACEHOLDER_PREFIX = `__WXML_MUSTACHE_${Math.random().toString(36).slice(2)}_`

// True when the entire attribute value is a single `{{ ... }}` (trimmed). Treated like `style=""` — not linted as declarations.
export function isWholeMustache(input: string): boolean {
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
    let suffix = 0
    let placeholder = `${PLACEHOLDER_PREFIX}${tokenId}_${suffix}__`
    while (styleValue.includes(placeholder)) {
      suffix += 1
      placeholder = `${PLACEHOLDER_PREFIX}${tokenId}_${suffix}__`
    }
    tokens.push({ id: tokenId, raw, placeholder })
    return placeholder
  })

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
