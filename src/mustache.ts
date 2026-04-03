import type { MustacheProcessResult, MustacheToken } from './types'

const MUSTACHE_REGEX = /\{\{[\s\S]*?\}\}/g

const PLACEHOLDER_BODY_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const EMPTY_BODY_PREFIX = /^\{\{\s*\}\}/

/**
 * 去掉 `{{}}` / `{{  }}`（花括号内仅空白）。不合并 `;;` — PostCSS 可接受。
 * 将返回串中的偏移映射回原始 `styleValue`，用于源码位置。
 * @param styleValue
 */
export function stripEmptyMustaches(styleValue: string): {
  stripped: string
  strippedOffsetToOriginal: (strippedOffset: number) => number
} {
  const origAt: number[] = []
  let stripped = ''
  let o = 0

  while (o < styleValue.length) {
    const sub = styleValue.slice(o)
    const m = sub.match(EMPTY_BODY_PREFIX)
    if (m) {
      o += m[0]!.length
      continue
    }
    origAt[stripped.length] = o
    stripped += styleValue[o]!
    o += 1
  }
  origAt[stripped.length] = styleValue.length

  const strippedOffsetToOriginal = (strippedOffset: number): number => {
    if (strippedOffset <= 0) return 0
    if (strippedOffset >= stripped.length) return styleValue.length
    return origAt[strippedOffset]!
  }

  return { stripped, strippedOffsetToOriginal }
}

// 整个属性值经 trim 后仅为单个 `{{ ... }}` 时为真。按 `style=""` 处理 — 不作为声明参与 lint。
export function isWholeMustache(input: string): boolean {
  const trimmed = input.trim()
  const matches = [...trimmed.matchAll(MUSTACHE_REGEX)]
  if (matches.length !== 1) return false
  const [match] = matches
  const start = match?.index ?? -1
  const raw = match?.[0] ?? ''
  return start === 0 && raw.length === trimmed.length
}

export function processMustacheStyle(styleValue: string): MustacheProcessResult {
  let tokenId = 0
  const tokens: MustacheToken[] = []

  const replaced = styleValue.replace(MUSTACHE_REGEX, (raw, offset) => {
    const start = typeof offset === 'number' ? offset : 0
    tokenId += 1
    let suffix = 0
    let placeholder: string

    const atBoundary = isStandaloneDeclarationSlot(styleValue, start, raw.length)

    const tryPlaceholder = (): string =>
      atBoundary
        ? commentPlaceholderOfLength(raw.length, `${tokenId}_${suffix}`)
        : underscorePlaceholder(raw.length, tokenId, suffix)

    do {
      placeholder = tryPlaceholder()
      suffix += 1
    } while (styleValue.includes(placeholder) || tokens.some(t => t.placeholder === placeholder))

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

function isStandaloneDeclarationSlot(styleValue: string, mustacheStart: number, rawLength: number): boolean {
  let i = mustacheStart - 1
  while (i >= 0 && /\s/.test(styleValue[i]!)) i -= 1
  const beforeBoundary = i < 0 || styleValue[i] === ';'

  let j = mustacheStart + rawLength
  while (j < styleValue.length && /\s/.test(styleValue[j]!)) j += 1
  const afterBoundary = j >= styleValue.length || styleValue[j] === ';'

  return beforeBoundary && afterBoundary
}

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h
}

/**
 * 总长度为 totalLen 的块注释。可放在声明之间；PostCSS 会保留为 `comment` 节点
 * （与声明值内部的注释不同）。用于声明边界上的每个 `{{ }}`，包括
 * 整条声明占位如 `; {{ fontWeight }};`。
 * @param totalLen
 * @param seed
 */
function commentPlaceholderOfLength(totalLen: number, seed: string): string {
  if (totalLen < 4) {
    return '_'.repeat(totalLen)
  }
  const innerLen = totalLen - 4
  if (innerLen === 0) return '/**/'

  let h = hashSeed(seed)
  let body = ''
  for (let i = 0; i < innerLen; i += 1) {
    h = Math.imul(h ^ (h >>> 13), 1274126175) >>> 0
    body += PLACEHOLDER_BODY_ALPHABET[h % PLACEHOLDER_BODY_ALPHABET.length]!
  }
  return `/*${body}*/`
}

function underscorePlaceholder(rawLength: number, tokenId: number, suffix: number): string {
  const base = `W${tokenId}${suffix > 0 ? `_${suffix}` : ''}X`
  const placeholder = base.padEnd(rawLength, 'X')
  return placeholder.slice(0, rawLength)
}
