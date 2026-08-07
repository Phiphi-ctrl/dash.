import {
  Smile,
  PawPrint,
  Utensils,
  Dumbbell,
  Plane,
  Lightbulb,
  Shapes,
  Flag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { data } from '../../lib/emojiMart.ts'

type CategoryOption = {
  id: string
  label: string
  Icon: LucideIcon
}
import { useState, useEffect } from 'react'

const categoryOptions: CategoryOption[] = [
  {
    id: 'people',
    label: 'People',
    Icon: Smile,
  },
  {
    id: 'nature',
    label: 'Nature',
    Icon: PawPrint,
  },
  {
    id: 'foods',
    label: 'Food',
    Icon: Utensils,
  },
  {
    id: 'activity',
    label: 'Activities',
    Icon: Dumbbell,
  },
  {
    id: 'places',
    label: 'Places',
    Icon: Plane,
  },
  {
    id: 'objects',
    label: 'Objects',
    Icon: Lightbulb,
  },
  {
    id: 'symbols',
    label: 'Symbols',
    Icon: Shapes,
  },
  {
    id: 'flags',
    label: 'Flags',
    Icon: Flag,
  },
]

type TaskEmojiPickerProps = {
  onSelect: (emoji: string) => void
}

function TaskEmojiPicker ({onSelect} : TaskEmojiPickerProps) {

  const [activeCategory, setActiveCategory] =
    useState('people')

  const [frequentEmojis, setFrequentEmojis] = useState<string[]>(() => {
    const storedFrequentEmojis = localStorage.getItem("dash.frequentEmojis")
    if(storedFrequentEmojis === null) {
      return []
    }
    return JSON.parse(storedFrequentEmojis)
  })

  useEffect(() => {
    localStorage.setItem("dash.frequentEmojis", JSON.stringify(frequentEmojis))
  }, [frequentEmojis])

  const category = data.categories.find(
    (item) => item.id === activeCategory,
  )

  const categoryEmojis =
    category?.emojis
      .map((emojiId) => data.emojis[emojiId])
      .filter(Boolean) ?? []

  const MAX_FREQUENT_EMOJIS = 16

  function handleEmojiSelect(nativeEmoji: string) {
    setFrequentEmojis((currentEmojis) => {
      const withoutSelectedEmoji = currentEmojis.filter(
        (emoji) => emoji !== nativeEmoji,
      )

      return [
        nativeEmoji,
        ...withoutSelectedEmoji,
      ].slice(0, MAX_FREQUENT_EMOJIS)
    })

    onSelect(nativeEmoji)
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      {/*Frequent*/}
      <div className="grid grid-cols-8 grid-rows-2 rounded-lg border-border">
        {frequentEmojis.map((emoji) => {

          return (
            <button
              type="button"
              onClick={() => handleEmojiSelect(emoji)}
              className="
              grid
              size-9
              place-items-center
              rounded-lg
              p-0
              text-xl
              leading-none
              transition-colors
              hover:bg-surface-hover
              "
            >
              {emoji}
            </button>
          )
        })}
      </div>

      {/*Category Navigation*/}
      <div className="grid grid-cols-8">
        {categoryOptions.map(({id, label, Icon}) => (
          <button
          type="button"
          key={id}
          onClick={() => {setActiveCategory(id)}}
          aria-label={label}
          title={label}
          className="
          grid size-9 place-items-center
          rounded-lg text-xl
          transition-colors
          hover:bg-surface-hover
          "
          >
            <Icon className="size-4"/>
          </button>
        ))}
      </div>

      {/*Emoji grid*/}
      <div className="grid grid-cols-8 overflow-x-hidden overflow-y-auto rounded-lg border-border h-63">
        {categoryEmojis.map((emoji) => {
          const nativeEmoji = emoji.skins[0]?.native

          if (!nativeEmoji) {
            return null
          }

          return (
            <button
              key={emoji.id}
              type="button"
              onClick={() => handleEmojiSelect(nativeEmoji)}
              className="
              grid size-9 place-items-center
              rounded-lg text-xl
              transition-colors
              hover:bg-surface-hover
              "
            >
              {nativeEmoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TaskEmojiPicker