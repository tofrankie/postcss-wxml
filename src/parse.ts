import type { Root, Rule } from 'postcss'
import type { WxmlRootMeta } from './types'
import postcss from 'postcss'
import { extractWxmlStyles } from './extract-wxml-styles'
import { processMustacheStyle, restoreMustacheValue } from './mustache'

interface ParseOptions {
  from?: string
}

function appendDeclarationsFromParsedRule(targetRule: Rule, parsedRule: Rule): void {
  parsedRule.each(node => {
    targetRule.append(node.clone())
  })
}

function restoreMustacheInRuleValues(
  rule: Rule,
  tokens: ReturnType<typeof processMustacheStyle>['tokens']
): void {
  if (tokens.length === 0) return

  rule.walkDecls(decl => {
    decl.value = restoreMustacheValue(decl.value, tokens)
  })
}

export function parse(source: string, opts: ParseOptions = {}): Root {
  const input = new postcss.Input(source, { from: opts.from })
  const root = postcss.root({ source: { input } })
  const meta: WxmlRootMeta = { source, entries: [] }

  const inlineStyles = extractWxmlStyles(source)

  inlineStyles.forEach((style, index) => {
    const normalized = processMustacheStyle(style.value)
    const selector = `.wxml-inline-style-${index + 1}`
    const virtualRuleCss = `${selector} { ${normalized.cssText} }`
    const parsed = postcss.parse(virtualRuleCss, { from: opts.from })

    const parsedRule = parsed.first
    if (!parsedRule || parsedRule.type !== 'rule') return

    const rule = postcss.rule({
      selector,
      source: {
        input,
        start: { offset: style.start.offset, line: style.start.line, column: style.start.column },
        end: { offset: style.end.offset, line: style.end.line, column: style.end.column },
      },
    })

    appendDeclarationsFromParsedRule(rule, parsedRule)
    restoreMustacheInRuleValues(rule, normalized.tokens)
    root.append(rule)
    meta.entries.push({
      selector,
      startOffset: style.start.offset,
      endOffset: style.end.offset,
      originalValue: style.value,
    })
  })
  ;(root.raws as any).postcssWxml = meta

  return root
}
