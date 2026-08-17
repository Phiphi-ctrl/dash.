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
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
      >
        No Category
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className="flex items-center gap-2"
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