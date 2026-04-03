import { Tokenizer } from 'htmlparser2'

const STATE_IN_TAG_NAME = 3 // State.InTagName
const STATE_SPECIAL_START_SEQUENCE = 23 // State.SpecialStartSequence
const CHAR_W = 'w'.charCodeAt(0)
const CHAR_X = 'x'.charCodeAt(0)
const CHAR_S = 's'.charCodeAt(0)

// 匹配结束序列 `</wxs`
const WXS_END_SEQUENCE = new Uint8Array(['<'.charCodeAt(0), '/'.charCodeAt(0), CHAR_W, CHAR_X, CHAR_S])

function isTagBoundary(charCode: number | null | undefined): boolean {
  return (
    charCode == null ||
    charCode === '/'.charCodeAt(0) || // /
    charCode === '>'.charCodeAt(0) || // >
    charCode === ' '.charCodeAt(0) || // space
    charCode === '\t'.charCodeAt(0) || // tab
    charCode === '\n'.charCodeAt(0) || // \n
    charCode === '\r'.charCodeAt(0) || // \r
    charCode === '\f'.charCodeAt(0) // \f
  )
}

// 小写 ASCII 字母的 char code，用于不区分大小写的标签判断。
function lowerCase(code: number): number {
  return code | 0x20
}

// TODO:
// htmlparser2 Tokenizer 将状态设为 private；子类化在 TS 中需要宽松的构造函数类型。
const BaseTokenizer = Tokenizer as unknown as new (...args: any[]) => any

export class WxmlTokenizer extends BaseTokenizer {
  stateBeforeTagName(c: number): void {
    const self = this as any
    const w = lowerCase(c)
    const x = lowerCase(self.buffer.charCodeAt(self.index + 1))
    const s = lowerCase(self.buffer.charCodeAt(self.index + 2))
    const boundary = self.buffer.charCodeAt(self.index + 3)

    // 进入 <wxs ...> 时切换到 htmlparser2 的 special/raw-text 模式，（类似 <script>）：直到 </wxs> 之前都当作纯文本，
    // 避免 JS 里像样式一样的字符串被当成真实 HTML 属性/标签解析。
    if (w === CHAR_W && x === CHAR_X && s === CHAR_S && isTagBoundary(boundary)) {
      self.sectionStart = self.index
      self.isSpecial = true
      self.currentSequence = WXS_END_SEQUENCE
      self.sequenceIndex = 3
      self.state = STATE_SPECIAL_START_SEQUENCE
      return
    }

    super.stateBeforeTagName(c)
  }

  stateInTagName(c: number): void {
    const self = this as any
    self.state = STATE_IN_TAG_NAME
    super.stateInTagName(c)
  }
}
