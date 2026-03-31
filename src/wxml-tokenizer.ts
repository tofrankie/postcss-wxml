import { Tokenizer } from 'htmlparser2'

const STATE_IN_TAG_NAME = 3
const STATE_SPECIAL_START_SEQUENCE = 23
const CHAR_W = 0x77
const CHAR_X = 0x78
const CHAR_S = 0x73

const WXS_END_SEQUENCE = new Uint8Array([0x3c, 0x2f, CHAR_W, CHAR_X, CHAR_S]) // </wxs

function isTagBoundary(charCode: number | undefined): boolean {
  return (
    charCode === undefined ||
    charCode === 0x2f || // /
    charCode === 0x3e || // >
    charCode === 0x20 || // space
    charCode === 0x09 || // tab
    charCode === 0x0a || // \n
    charCode === 0x0d || // \r
    charCode === 0x0c // \f
  )
}

/**
 * htmlparser2 treats script/style as special raw-text tags.
 * Extend it so <wxs> is parsed the same way to avoid false tag/attr matches in JS code.
 */
const BaseTokenizer = Tokenizer as unknown as new (...args: any[]) => any

export class WxmlTokenizer extends BaseTokenizer {
  stateBeforeTagName(c: number): void {
    const self = this as any
    const lower = c | 0x20
    const x = self.buffer.charCodeAt(self.index + 1) | 0x20
    const s = self.buffer.charCodeAt(self.index + 2) | 0x20
    const boundary = self.buffer.charCodeAt(self.index + 3)

    if (lower === CHAR_W && x === CHAR_X && s === CHAR_S && isTagBoundary(boundary)) {
      self.sectionStart = self.index
      self.isSpecial = true
      self.currentSequence = WXS_END_SEQUENCE
      self.sequenceIndex = 3
      self.state = STATE_SPECIAL_START_SEQUENCE
      return
    }

    // Keep default behavior for all non-wxs tags.
    super.stateBeforeTagName(c)
  }

  stateInTagName(c: number): void {
    const self = this as any
    self.state = STATE_IN_TAG_NAME
    super.stateInTagName(c)
  }
}
