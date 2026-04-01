import { describe, expect, it } from 'vitest'
import { extractWxmlStyles } from '../src/extract-wxml-styles'

describe('wxs tags', () => {
  it('handles wxs self closing', () => {
    const wxml = '<wxs src="m1.wxs" /><view style="color: red;"></view>'
    const styles = extractWxmlStyles(wxml)
    expect(styles.length).toBe(1)
    expect(styles[0].value).toBe('color: red;')
  })

  it('handles wxs with crazy contents like "/>" or "</wxs "', () => {
    const wxml = `<wxs module="m">
      var a = "/>";
      var b = "</wxs ";
      var xml = "<view style='color: evil;'></view>";
    </wxs><view style="color: blue;"></view>`
    const styles = extractWxmlStyles(wxml)
    expect(styles.length).toBe(1)
    expect(styles[0].value).toBe('color: blue;')
  })
})
