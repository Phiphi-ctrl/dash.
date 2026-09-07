import type { Category } from '../../../../types/Category.ts'

type CategoryPickerProps = {
  categories: Category[]
  currentlySelected: string | null
  onSelect: (categoryId: string | null) => void
}

function CategoryPicker({
                          categories,
                          onSelect,
                        }: CategoryPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="text-muted hover:scale-110 hover:text-foreground-secondary transition-transform"
      >
        No Workspace
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className="flex items-center text-muted gap-4 hover:scale-110 hover:text-foreground-secondary transition-transform"
        >
          <span
            className="size-3 rounded-full"
            style={{
              backgroundColor: category.color,
            }}
          />

          <span>{category.name}</span>
        </button>
      ))}
    </div>
  )
}

export default CategoryPicker;