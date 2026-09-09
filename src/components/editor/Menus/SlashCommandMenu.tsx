import type {
  SlashOption,
} from '../utils/blockDefinitions.ts'

type SlashCommandMenuProps = {
  items: SlashOption[]

  selectedIndex: number

  onSelect: (
    item: SlashOption
  ) => void
}

function SlashCommandMenu({
                            items,
                            selectedIndex,
                            onSelect,
                          }: SlashCommandMenuProps) {
  return (
    <div
      data-editor-popup
      className="
        w-64

        glass-surface

        px-1.5
        py-2

        shadow-lg
      "
    >
      <div
        className="
          px-2
          pb-1.5
          pt-1

          text-[11px]
          font-semibold
          uppercase
          tracking-wide
          text-muted
        "
      >
        Blocks
      </div>

      {items.length === 0 ? (
        <div
          className="
            px-2
            py-3

            text-sm
            text-muted
          "
        >
          No blocks found
        </div>
      ) : (
        items.map(
          (
            {
              label,
              description,
              Icon,
              command,
            },
            index,
          ) => (
            <button
              key={
                command.type === 'heading'
                  ? `heading-${command.level}`
                  : command.type
              }

              type="button"

              onMouseDown={(event) => {
                /*
                 * Keep the editor selection
                 * alive while clicking.
                 */
                event.preventDefault()
              }}

              onClick={() => {
                onSelect(
                  items[index],
                )
              }}

              className={`
                flex
                w-full
                items-center
                gap-3

                rounded-xl
                px-2
                py-2

                text-left

                transition-colors

                ${
                index === selectedIndex
                  ? 'bg-surface-hover'
                  : 'hover:bg-surface-hover'
              }
              `}
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center

                  rounded-md
                  bg-surface-hover

                  text-foreground-secondary
                "
              >
                <Icon size={17} />
              </div>

              <div className="min-w-0">
                <div
                  className="
                    text-sm
                    font-medium
                    text-foreground
                  "
                >
                  {label}
                </div>

                <div
                  className="
                    text-xs
                    text-muted
                  "
                >
                  {description}
                </div>
              </div>
            </button>
          ),
        )
      )}
    </div>
  )
}

export default SlashCommandMenu
