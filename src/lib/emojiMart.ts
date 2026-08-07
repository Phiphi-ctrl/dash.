import emojiData from '@emoji-mart/data'
import type { EmojiMartData } from '@emoji-mart/data'
import { init } from 'emoji-mart'

const data =
  emojiData as unknown as EmojiMartData

const emojiMartReady = init({ data })

export {
  data,
  emojiMartReady,
}