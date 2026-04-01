import type { MustacheProcessResult, MustacheToken } from './types'

const MUSTACHE_REGEX = /\{\{[\s\S]*?\}\}/g

// True when the entire attribute value is a single `{{ ... }}` (trimmed). Treated like `style=""` — not linted as declarations.
export function isWholeMustache(input: string): boolean {
  const trimmed = input.trim()
  return /^\{\{[\s\S]*\}\}$/u.test(trimmed)
}

export function processMustacheStyle(styleValue: string): MustacheProcessResult {
  let tokenId = 0
  const tokens: MustacheToken[] = []

  const replaced = styleValue.replace(MUSTACHE_REGEX, raw => {
    tokenId += 1
    let suffix = 0
    let base = `_W${tokenId}_`
    let placeholder = base.padEnd(raw.length, '_')

    while (styleValue.includes(placeholder)) {
      suffix += 1
      base = `_W${tokenId}_${suffix}_`
      placeholder = base.padEnd(raw.length, '_')
    }

    tokens.push({ id: tokenId, raw, placeholder })
    return placeholder
  })

  return {
    cssText: replaced,
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
